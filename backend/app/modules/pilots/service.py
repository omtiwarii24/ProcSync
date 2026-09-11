from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.audit import audit
from app.core.errors import AppError, BadRequest, NotFound, PermissionDenied
from app.models.enums import AuditAction, PilotStatus, ProposalStatus, UserRole
from app.modules.auth.models import User
from app.modules.challenges.service import get_challenge
from app.modules.orgs.models import Startup
from app.modules.pilots.models import Pilot
from app.modules.pilots.schemas import PilotCreate
from app.modules.proposals.models import Proposal

# Frozen pilot lifecycle map (Plan 5 Task H; I/J/K + Plan 6/7 consume it).
# Every pilot status change routes through core.transitions.assert_transition
# with this map — no ad-hoc assignment.
PILOT_TRANSITIONS = {
    PilotStatus.DRAFT: [PilotStatus.ACTIVE],
    PilotStatus.ACTIVE: [PilotStatus.COMPLETED, PilotStatus.FAILED,
                         PilotStatus.TERMINATED],
    PilotStatus.COMPLETED: [],
    PilotStatus.FAILED: [],
    PilotStatus.TERMINATED: [],
}


def _startup_of(db: Session, user: User) -> Startup:
    st = db.query(Startup).filter(Startup.owner_user_id == user.id).first()
    if st is None:
        raise NotFound("Startup profile not found")
    return st


def create_pilot(db: Session, actor: User, proposal_id: int,
                 payload: PilotCreate) -> Pilot:
    prop = db.get(Proposal, proposal_id)
    if prop is None:
        raise NotFound(f"Proposal {proposal_id} not found")
    ch = get_challenge(db, prop.challenge_id)
    if actor.role == UserRole.ADMIN:
        pass
    elif actor.role == UserRole.DEPT_OWNER:
        if actor.department_id != ch.department_id:
            raise PermissionDenied("Not your department's proposal")
    else:
        raise PermissionDenied("Only department owners or admins can create pilots")
    if prop.status != ProposalStatus.SELECTED:
        raise AppError(
            f"Pilot can only be created from a SELECTED proposal "
            f"(current: {prop.status.value})",
            status_code=409, code="PROPOSAL_NOT_SELECTED")
    manager = db.get(User, payload.pilot_manager_id)
    if (manager is None or manager.role != UserRole.PILOT_MANAGER
            or not manager.is_active):
        raise BadRequest(
            "pilot_manager_id must be an active PILOT_MANAGER user",
            context={"pilot_manager_id": payload.pilot_manager_id})
    existing = db.query(Pilot).filter(Pilot.proposal_id == proposal_id).first()
    if existing is not None:
        raise AppError("Pilot already exists for this proposal",
                       status_code=409, code="PILOT_DUPLICATE")
    pilot = Pilot(
        proposal_id=proposal_id,
        department_id=ch.department_id,
        startup_id=prop.startup_id,
        pilot_manager_id=payload.pilot_manager_id,
        scope=payload.scope,
        status=PilotStatus.DRAFT,
        terms_accepted=False,
        data_ip_terms=payload.data_ip_terms,
        starts_at=payload.starts_at,
        ends_at=payload.ends_at,
    )
    db.add(pilot)
    try:
        db.flush()
    except IntegrityError:
        db.rollback()
        raise AppError("Pilot already exists for this proposal",
                       status_code=409, code="PILOT_DUPLICATE")
    audit(db, user_id=actor.id, action=AuditAction.CREATE, entity_type="Pilot",
          entity_id=str(pilot.id),
          new={"proposal_id": proposal_id,
               "department_id": ch.department_id,
               "startup_id": prop.startup_id,
               "pilot_manager_id": payload.pilot_manager_id,
               "status": pilot.status.value})
    return pilot


def get_pilot_for_user(db: Session, user: User, pilot_id: int) -> Pilot:
    pilot = db.get(Pilot, pilot_id)
    if pilot is None:
        raise NotFound(f"Pilot {pilot_id} not found")
    if user.role in (UserRole.ADMIN, UserRole.FINANCE):
        # FINANCE is read-only platform-wide (no department_id on FINANCE
        # users); mutations stay FINANCE/ADMIN-gated elsewhere as today.
        return pilot
    if user.id == pilot.pilot_manager_id:
        return pilot
    if user.role == UserRole.DEPT_OWNER \
            and user.department_id == pilot.department_id:
        return pilot
    if user.role == UserRole.STARTUP:
        st = _startup_of(db, user)
        if pilot.startup_id == st.id:
            return pilot
    # Existence-hiding: evaluators, other departments, other startups,
    # and unassigned managers all see 404.
    raise NotFound(f"Pilot {pilot_id} not found")


def list_pilots(db: Session, user: User, page: int, size: int) -> dict:
    q = db.query(Pilot)
    if user.role == UserRole.ADMIN:
        pass
    elif user.role == UserRole.PILOT_MANAGER:
        q = q.filter(Pilot.pilot_manager_id == user.id)
    elif user.role == UserRole.DEPT_OWNER:
        q = q.filter(Pilot.department_id == user.department_id)
    elif user.role == UserRole.STARTUP:
        st = _startup_of(db, user)
        q = q.filter(Pilot.startup_id == st.id)
    else:
        return {"items": [], "page": page, "size": size, "total": 0}
    total = q.count()
    items = q.order_by(Pilot.id.desc()).offset((page - 1) * size).limit(size).all()
    return {"items": items, "page": page, "size": size, "total": total}


def transition_pilot(db: Session, user: User, pilot_id: int,
                     new_status: PilotStatus) -> Pilot:
    from app.core.transitions import assert_transition
    pilot = get_pilot_for_user(db, user, pilot_id)
    assert_transition("Pilot", pilot.status, PILOT_TRANSITIONS, new_status)
    if new_status in (PilotStatus.FAILED, PilotStatus.TERMINATED):
        raise BadRequest(
            "FAILED/TERMINATED transitions use the dedicated fail/terminate endpoints",
            context={"to": new_status.value})
    if pilot.status == PilotStatus.DRAFT and new_status == PilotStatus.ACTIVE:
        is_manager = user.id == pilot.pilot_manager_id
        is_owner = user.role == UserRole.DEPT_OWNER \
            and user.department_id == pilot.department_id
        if not (is_manager or is_owner or user.role == UserRole.ADMIN):
            raise PermissionDenied(
                "Only the assigned pilot manager or owning department can activate the pilot")
        if not pilot.terms_accepted:
            raise AppError("Startup must accept terms before activation",
                           status_code=409, code="TERMS_NOT_ACCEPTED")
    elif new_status == PilotStatus.COMPLETED:
        if user.id != pilot.pilot_manager_id and user.role != UserRole.ADMIN:
            raise PermissionDenied(
                "Only the assigned pilot manager can complete the pilot")
    old_status = pilot.status.value
    pilot.status = new_status
    db.flush()
    audit(db, user_id=user.id, action=AuditAction.UPDATE, entity_type="Pilot",
          entity_id=str(pilot.id),
          old={"status": old_status},
          new={"status": pilot.status.value})
    return pilot


def pilot_startup(db: Session, pilot: Pilot) -> Startup:
    """Frozen helper for I/J/K: the Startup that owns the pilot's proposal."""
    st = db.get(Startup, pilot.startup_id)
    if st is None:
        raise NotFound(f"Startup {pilot.startup_id} not found")
    return st


def assert_pilot_manager(db: Session, user: User, pilot: Pilot) -> None:
    """Frozen helper for I/J/K: assigned manager or ADMIN, else 403."""
    if user.role != UserRole.ADMIN and user.id != pilot.pilot_manager_id:
        raise PermissionDenied("Only the assigned pilot manager can perform this action")


# ---- Task K: pilot workflow extras (accept-terms, fail, terminate, summary) ----
# pilots.service keeps zero imports from execution/payments at module top
# (one-way discipline for the parallel wave) — summary imports them read-only
# at function level below.

def accept_terms(db: Session, user: User, pilot_id: int) -> Pilot:
    """STARTUP owner accepts pilot terms. Idempotent — already-true → 200."""
    pilot = get_pilot_for_user(db, user, pilot_id)
    startup = pilot_startup(db, pilot)
    if startup.owner_user_id != user.id:
        raise PermissionDenied("Only the pilot's startup owner can accept terms")
    if not pilot.terms_accepted:
        pilot.terms_accepted = True
        db.flush()
        audit(db, user_id=user.id, action=AuditAction.UPDATE,
              entity_type="Pilot", entity_id=str(pilot.id),
              old={"terms_accepted": False},
              new={"terms_accepted": True})
    return pilot


def fail_pilot(db: Session, user: User, pilot_id: int,
               failure_conditions: str) -> Pilot:
    """Assigned manager records ACTIVE → FAILED + stores failure_conditions."""
    # ADMIN override intentional (platform-wide ADMIN rule).
    from app.core.transitions import assert_transition
    pilot = get_pilot_for_user(db, user, pilot_id)
    assert_pilot_manager(db, user, pilot)
    assert_transition("Pilot", pilot.status, PILOT_TRANSITIONS,
                      PilotStatus.FAILED)
    old_status = pilot.status.value
    pilot.status = PilotStatus.FAILED
    pilot.failure_conditions = failure_conditions
    db.flush()
    audit(db, user_id=user.id, action=AuditAction.UPDATE,
          entity_type="Pilot", entity_id=str(pilot.id),
          old={"status": old_status},
          new={"status": pilot.status.value,
                "failure_conditions": failure_conditions})
    return pilot


def terminate_pilot(db: Session, user: User, pilot_id: int,
                    reason: str) -> Pilot:
    """Owning-dept DEPT_OWNER or ADMIN records ACTIVE → TERMINATED."""
    # terminate reason lives in audit_logs (query via GET /audit/logs);
    # add a column if Plan 7 needs it queryable.
    from app.core.transitions import assert_transition
    pilot = get_pilot_for_user(db, user, pilot_id)
    if user.role == UserRole.ADMIN:
        pass
    elif user.role == UserRole.DEPT_OWNER \
            and user.department_id == pilot.department_id:
        pass
    else:
        raise PermissionDenied(
            "Only the owning department or an admin can terminate the pilot")
    assert_transition("Pilot", pilot.status, PILOT_TRANSITIONS,
                      PilotStatus.TERMINATED)
    old_status = pilot.status.value
    pilot.status = PilotStatus.TERMINATED
    db.flush()
    audit(db, user_id=user.id, action=AuditAction.UPDATE,
          entity_type="Pilot", entity_id=str(pilot.id),
          old={"status": old_status},
          new={"status": pilot.status.value, "reason": reason})
    return pilot


def get_pilot_summary(db: Session, user: User, pilot_id: int) -> dict:
    """Read-only aggregate for anyone with pilot visibility."""
    pilot = get_pilot_for_user(db, user, pilot_id)
    from app.modules.execution.models import KPI, Milestone, Risk
    from app.modules.payments.models import PaymentRecord
    milestones = db.query(Milestone).filter(
        Milestone.pilot_id == pilot.id).all()
    by_status: dict[str, int] = {}
    for ms in milestones:
        key = getattr(ms.status, "value", ms.status)
        by_status[key] = by_status.get(key, 0) + 1
    kpis = db.query(KPI).filter(KPI.pilot_id == pilot.id).order_by(
        KPI.id).all()
    open_risks = db.query(Risk).filter(
        Risk.pilot_id == pilot.id, Risk.resolved.is_(False)).count()
    records = db.query(PaymentRecord).join(
        Milestone,
        PaymentRecord.milestone_id == Milestone.id).filter(
        Milestone.pilot_id == pilot.id).all()
    total_amount = sum(r.amount for r in records)
    disbursed_amount = sum(
        r.amount for r in records
        if getattr(r.status, "value", r.status) == "DISBURSED")
    return {
        "pilot": pilot,
        "milestones": {"total": len(milestones), "by_status": by_status},
        "kpis": kpis,
        "open_risks": open_risks,
        "payments": {"total_amount": total_amount,
                     "disbursed_amount": disbursed_amount},
    }
