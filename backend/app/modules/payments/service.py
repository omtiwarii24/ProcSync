from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.audit import audit
from app.core.errors import AppError, NotFound, PermissionDenied
from app.models.enums import AuditAction, MilestoneStatus, PaymentStatus, UserRole
from app.modules.auth.models import User
from app.modules.execution.models import Milestone
from app.modules.execution.service import mark_milestone_paid
from app.modules.payments.models import PaymentRecord
from app.modules.payments.schemas import RejectPayment

# Frozen payment lifecycle (Plan 5 Task J): records are created AT invoice
# time with status INVOICED; PENDING exists in the enum only for future use.
# Every payment status change routes through core.transitions.assert_transition
# with this map — no ad-hoc assignment.
PAYMENT_TRANSITIONS = {
    PaymentStatus.PENDING: [PaymentStatus.INVOICED],
    PaymentStatus.INVOICED: [PaymentStatus.APPROVED, PaymentStatus.REJECTED],
    PaymentStatus.APPROVED: [PaymentStatus.DISBURSED, PaymentStatus.REJECTED],
    PaymentStatus.DISBURSED: [],
    PaymentStatus.REJECTED: [],
}


def _status_value(status) -> str:
    return getattr(status, "value", status)


def _require_finance(user: User) -> None:
    """Payment approval/disburse/reject: FINANCE or ADMIN (platform-wide ADMIN rule)."""
    # FINANCE is platform-wide by design (no department_id on FINANCE users);
    # cross-department approvals are intended. Revisit if finance becomes
    # department-scoped.
    if user.role not in (UserRole.FINANCE, UserRole.ADMIN):
        raise PermissionDenied("Only FINANCE can perform this action")


def _get_payment(db: Session, payment_id: int) -> PaymentRecord:
    payment = db.get(PaymentRecord, payment_id)
    if payment is None:
        raise NotFound(f"Payment {payment_id} not found")
    return payment


def _get_milestone(db: Session, milestone_id: int) -> Milestone:
    ms = db.get(Milestone, milestone_id)
    if ms is None:
        raise NotFound(f"Milestone {milestone_id} not found")
    return ms


def invoice_milestone(db: Session, user: User,
                      milestone_id: int) -> PaymentRecord:
    """Startup owner invoices a VERIFIED milestone (creates INVOICED record)."""
    from app.modules.pilots.service import get_pilot_for_user, pilot_startup

    ms = _get_milestone(db, milestone_id)
    pilot = get_pilot_for_user(db, user, ms.pilot_id)
    startup = pilot_startup(db, pilot)
    if user.role != UserRole.STARTUP or startup.owner_user_id != user.id:
        raise PermissionDenied(
            "Only the pilot's startup can invoice milestones")
    if _status_value(ms.status) != MilestoneStatus.VERIFIED.value:
        raise AppError(
            f"Only VERIFIED milestones can be invoiced "
            f"(current: {_status_value(ms.status)})",
            status_code=409, code="MILESTONE_NOT_VERIFIED")
    existing = db.query(PaymentRecord).filter(
        PaymentRecord.milestone_id == ms.id).first()
    if existing is not None:
        raise AppError("A payment already exists for this milestone",
                       status_code=409, code="PAYMENT_DUPLICATE")
    payment = PaymentRecord(
        milestone_id=ms.id,
        amount=ms.amount,
        status=PaymentStatus.INVOICED,
        invoiced_by=user.id,
    )
    db.add(payment)
    try:
        db.flush()
    except IntegrityError:
        db.rollback()
        raise AppError("A payment already exists for this milestone",
                       status_code=409, code="PAYMENT_DUPLICATE")
    audit(db, user_id=user.id, action=AuditAction.INVOICE,
          entity_type="PaymentRecord", entity_id=str(payment.id),
          new={"milestone_id": ms.id, "amount": ms.amount,
               "status": payment.status.value})
    return payment


def approve_payment(db: Session, user: User,
                    payment_id: int) -> PaymentRecord:
    """FINANCE approves an INVOICED payment (milestone must still be VERIFIED)."""
    from app.core.transitions import assert_transition

    _require_finance(user)
    payment = _get_payment(db, payment_id)
    ms = _get_milestone(db, payment.milestone_id)
    if _status_value(ms.status) != MilestoneStatus.VERIFIED.value:
        raise AppError(
            f"Payment can only be approved while its milestone is VERIFIED "
            f"(current: {_status_value(ms.status)})",
            status_code=409, code="MILESTONE_NOT_VERIFIED")
    assert_transition("Payment", payment.status, PAYMENT_TRANSITIONS,
                      PaymentStatus.APPROVED)
    old = _status_value(payment.status)
    payment.status = PaymentStatus.APPROVED
    payment.approved_by = user.id
    db.flush()
    audit(db, user_id=user.id, action=AuditAction.APPROVE,
          entity_type="PaymentRecord", entity_id=str(payment.id),
          old={"status": old}, new={"status": payment.status.value})
    return payment


def disburse_payment(db: Session, user: User,
                     payment_id: int) -> PaymentRecord:
    """FINANCE disburses an APPROVED payment; milestone moves to PAID."""
    from app.core.transitions import assert_transition

    _require_finance(user)
    payment = _get_payment(db, payment_id)
    assert_transition("Payment", payment.status, PAYMENT_TRANSITIONS,
                      PaymentStatus.DISBURSED)
    old = _status_value(payment.status)
    payment.status = PaymentStatus.DISBURSED
    db.flush()
    mark_milestone_paid(db, payment.milestone_id)
    audit(db, user_id=user.id, action=AuditAction.DISBURSE,
          entity_type="PaymentRecord", entity_id=str(payment.id),
          old={"status": old}, new={"status": payment.status.value})
    return payment


def reject_payment(db: Session, user: User, payment_id: int,
                   payload: RejectPayment) -> PaymentRecord:
    """FINANCE rejects an INVOICED or APPROVED payment with a reason."""
    from app.core.transitions import assert_transition

    _require_finance(user)
    payment = _get_payment(db, payment_id)
    assert_transition("Payment", payment.status, PAYMENT_TRANSITIONS,
                      PaymentStatus.REJECTED)
    old = _status_value(payment.status)
    payment.status = PaymentStatus.REJECTED
    payment.rejected_reason = payload.reason
    db.flush()
    audit(db, user_id=user.id, action=AuditAction.REJECT,
          entity_type="PaymentRecord", entity_id=str(payment.id),
          old={"status": old},
          new={"status": payment.status.value,
               "rejected_reason": payload.reason})
    return payment


def list_payments(db: Session, user: User, pilot_id: int,
                  page: int, size: int) -> dict:
    """Paginated payments for a pilot (pilot visibility policy applies)."""
    from app.modules.pilots.service import get_pilot_for_user

    pilot = get_pilot_for_user(db, user, pilot_id)
    q = db.query(PaymentRecord).join(
        Milestone, PaymentRecord.milestone_id == Milestone.id).filter(
        Milestone.pilot_id == pilot.id).order_by(PaymentRecord.id)
    total = q.count()
    items = q.offset((page - 1) * size).limit(size).all()
    return {"items": items, "page": page, "size": size, "total": total}
