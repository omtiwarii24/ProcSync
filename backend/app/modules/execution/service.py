from sqlalchemy.orm import Session

from app.core.audit import audit
from app.core.errors import AppError, NotFound, PermissionDenied
from app.models.audit import utcnow
from app.models.enums import AuditAction, UserRole
from app.modules.auth.models import User
from app.modules.execution.models import Constraint, KPI, Milestone, Risk
from app.modules.execution.schemas import (
    ConstraintCreate, KPICreate, KPIPatch, MilestoneCreate, RiskCreate,
    RiskPatch)
from app.modules.orgs.models import Startup

try:
    from app.models.enums import MilestoneStatus
except ImportError:  # pragma: no cover - parallel-wave fallback only
    from app.modules.execution.models import MilestoneStatus

try:
    # Parallel wave: Task H creates app.modules.pilots.models. If the import
    # fails at collect-only time, Pilot stays None and the controller
    # reconciles at the serial gate (this module is never executed before
    # the pilots module lands).
    from app.modules.pilots.models import Pilot
except ImportError:  # pragma: no cover - parallel-wave fallback only
    Pilot = None  # type: ignore[assignment]

# Frozen milestone lifecycle (Plan 5): PENDING -> SUBMITTED -> VERIFIED -> PAID.
# Direct PAID assignment is forbidden — only mark_milestone_paid may enter PAID.
MILESTONE_TRANSITIONS = {
    MilestoneStatus.PENDING: [MilestoneStatus.SUBMITTED],
    MilestoneStatus.SUBMITTED: [MilestoneStatus.VERIFIED],
    MilestoneStatus.VERIFIED: [MilestoneStatus.PAID],
    MilestoneStatus.PAID: [],
}


def _status_value(status) -> str:
    return getattr(status, "value", status)


def _assert_pilot_visible(db: Session, user: User, pilot):
    """Local mirror of the frozen pilot-visibility policy (Task H contract).

    Visible to: assigned pilot manager, owning-dept DEPT_OWNER, ADMIN,
    proposal-owner STARTUP. Everyone else gets existence-hiding 404.
    Implemented from User.department_id + Pilot fields directly — never
    imports pilots.service (avoids any cycle surface).
    """
    if user.role in (UserRole.ADMIN, UserRole.FINANCE):
        # FINANCE is platform-wide read-only: visible for reads; mutations
        # stay gated by _require_manager_or_owner (FINANCE gets 403 there).
        return pilot
    if pilot.pilot_manager_id is not None and user.id == pilot.pilot_manager_id:
        return pilot
    if (user.role == UserRole.DEPT_OWNER
            and user.department_id is not None
            and user.department_id == pilot.department_id):
        return pilot
    if user.role == UserRole.STARTUP:
        st = db.query(Startup).filter(
            Startup.owner_user_id == user.id).first()
        if st is not None and st.id == pilot.startup_id:
            return pilot
    raise NotFound(f"Pilot {pilot.id} not found")


def _get_visible_pilot(db: Session, user: User, pilot_id: int):
    pilot = db.get(Pilot, pilot_id)
    if pilot is None:
        raise NotFound(f"Pilot {pilot_id} not found")
    return _assert_pilot_visible(db, user, pilot)


def _require_manager_or_owner(user: User, pilot) -> None:
    """Mutation gate: assigned PILOT_MANAGER, owning-dept DEPT_OWNER, or ADMIN."""
    if user.role == UserRole.ADMIN:
        return
    if pilot.pilot_manager_id is not None and user.id == pilot.pilot_manager_id:
        return
    if (user.role == UserRole.DEPT_OWNER
            and user.department_id is not None
            and user.department_id == pilot.department_id):
        return
    raise PermissionDenied("Only the pilot manager or department owner "
                           "can perform this action")


def _require_live_pilot(pilot) -> None:
    from app.models.enums import PilotStatus
    # Terminal-only guard (not `!= ACTIVE`): DRAFT pilots must still accept
    # planning writes (milestones/KPIs/risks created before activation —
    # see test_summary_shape, test_failed_pilot_rejects_submit_409,
    # test_submit_before_active_409). Terminal states reject with 409.
    if pilot.status in (PilotStatus.COMPLETED, PilotStatus.FAILED,
                        PilotStatus.TERMINATED):
        raise AppError("Pilot is not active", status_code=409, code="PILOT_NOT_ACTIVE")


def _require_startup_owner(db: Session, user: User, pilot) -> Startup:
    st = db.query(Startup).filter(Startup.owner_user_id == user.id).first()
    if st is None or st.id != pilot.startup_id:
        raise PermissionDenied("Only the pilot's startup can perform this action")
    return st


def _reject_startup_safety(user: User, payload) -> None:
    """Startups may never set safety_critical — explicit 400 beats silent drop."""
    if user.role == UserRole.STARTUP:
        data = payload.model_dump(exclude_unset=True)
        if data.get("safety_critical"):
            raise AppError("Startups cannot set safety_critical",
                           status_code=400, code="SAFETY_CRITICAL_FORBIDDEN")


def _scoped(query, pilot_id: int, entity_id: int, entity_name: str):
    obj = query.get(entity_id)
    if obj is None or obj.pilot_id != pilot_id:
        # Cross-pilot access is hidden as 404 (existence-hiding).
        raise NotFound(f"{entity_name} {entity_id} not found")
    return obj


def _paginate(q, page: int, size: int) -> dict:
    total = q.count()
    items = q.offset((page - 1) * size).limit(size).all()
    return {"items": items, "page": page, "size": size, "total": total}


# ---- Milestones ----

def create_milestone(db: Session, user: User, pilot_id: int,
                     payload: MilestoneCreate) -> Milestone:
    pilot = _get_visible_pilot(db, user, pilot_id)
    _reject_startup_safety(user, payload)
    _require_manager_or_owner(user, pilot)
    _require_live_pilot(pilot)
    ms = Milestone(pilot_id=pilot.id, title=payload.title,
                   amount=payload.amount, due_date=payload.due_date,
                   status=MilestoneStatus.PENDING,
                   safety_critical=payload.safety_critical)
    db.add(ms)
    db.flush()
    audit(db, user_id=user.id, action=AuditAction.CREATE,
          entity_type="Milestone", entity_id=str(ms.id),
          new={"pilot_id": pilot.id, "title": payload.title,
               "amount": payload.amount,
               "safety_critical": payload.safety_critical})
    return ms


def list_milestones(db: Session, user: User, pilot_id: int,
                    page: int, size: int) -> dict:
    pilot = _get_visible_pilot(db, user, pilot_id)
    q = db.query(Milestone).filter(Milestone.pilot_id == pilot.id).order_by(
        Milestone.id)
    return _paginate(q, page, size)


def submit_milestone(db: Session, user: User, pilot_id: int,
                     milestone_id: int) -> Milestone:
    from app.core.transitions import assert_transition
    pilot = _get_visible_pilot(db, user, pilot_id)
    ms = _scoped(db.query(Milestone), pilot.id, milestone_id, "Milestone")
    _require_startup_owner(db, user, pilot)
    if _status_value(pilot.status) != "ACTIVE":
        raise AppError("Milestones can only be submitted on an ACTIVE pilot",
                       status_code=409, code="PILOT_NOT_ACTIVE")
    if not pilot.terms_accepted:
        raise AppError("Startup must accept pilot terms before submitting "
                       "milestones",
                       status_code=409, code="TERMS_NOT_ACCEPTED")
    assert_transition("Milestone", ms.status, MILESTONE_TRANSITIONS,
                      MilestoneStatus.SUBMITTED)
    old = _status_value(ms.status)
    ms.status = MilestoneStatus.SUBMITTED
    ms.submitted_at = utcnow()
    db.flush()
    audit(db, user_id=user.id, action=AuditAction.UPDATE,
          entity_type="Milestone", entity_id=str(ms.id),
          old={"status": old}, new={"status": ms.status.value})
    return ms


def _get_pilot_for_verify(db: Session, user: User, pilot_id: int):
    """Verify path: assigned manager or any EVALUATOR may verify.

    The frozen visibility policy hides pilots from evaluators on reads, but
    milestone verification is explicitly an evaluator job (evaluator-verify
    must 200), so EVALUATOR bypasses the ownership check here while every
    other role still routes through strict visibility.
    """
    pilot = db.get(Pilot, pilot_id)
    if pilot is None:
        raise NotFound(f"Pilot {pilot_id} not found")
    if user.role in (UserRole.EVALUATOR, UserRole.ADMIN):
        return pilot
    return _assert_pilot_visible(db, user, pilot)


def verify_milestone(db: Session, user: User, pilot_id: int,
                     milestone_id: int) -> Milestone:
    from app.core.transitions import assert_transition
    pilot = _get_pilot_for_verify(db, user, pilot_id)
    ms = _scoped(db.query(Milestone), pilot.id, milestone_id, "Milestone")
    is_manager = (user.role == UserRole.ADMIN
                  or (pilot.pilot_manager_id is not None
                      and user.id == pilot.pilot_manager_id))
    if not (is_manager or user.role == UserRole.EVALUATOR):
        raise PermissionDenied("Only the pilot manager or an evaluator "
                               "can verify milestones")
    _require_live_pilot(pilot)
    assert_transition("Milestone", ms.status, MILESTONE_TRANSITIONS,
                      MilestoneStatus.VERIFIED)
    old = _status_value(ms.status)
    ms.status = MilestoneStatus.VERIFIED
    ms.verified_at = utcnow()
    db.flush()
    audit(db, user_id=user.id, action=AuditAction.UPDATE,
          entity_type="Milestone", entity_id=str(ms.id),
          old={"status": old}, new={"status": ms.status.value})
    return ms


def mark_milestone_paid(db: Session, milestone_id: int) -> Milestone:
    """FROZEN for Task J (payments.disburse): asserts VERIFIED -> PAID via the
    map. Performs NO audit of its own — the caller audits the payment."""
    from app.core.transitions import assert_transition
    ms = db.get(Milestone, milestone_id)
    if ms is None:
        raise NotFound(f"Milestone {milestone_id} not found")
    assert_transition("Milestone", ms.status, MILESTONE_TRANSITIONS,
                      MilestoneStatus.PAID)
    ms.status = MilestoneStatus.PAID
    db.flush()
    return ms


# ---- KPIs ----

def create_kpi(db: Session, user: User, pilot_id: int,
               payload: KPICreate) -> KPI:
    pilot = _get_visible_pilot(db, user, pilot_id)
    _reject_startup_safety(user, payload)
    _require_manager_or_owner(user, pilot)
    _require_live_pilot(pilot)
    kpi = KPI(pilot_id=pilot.id, name=payload.name,
              definition=payload.definition, unit=payload.unit,
              baseline=payload.baseline, target=payload.target,
              direction=payload.direction,
              safety_critical=payload.safety_critical)
    db.add(kpi)
    db.flush()
    audit(db, user_id=user.id, action=AuditAction.CREATE,
          entity_type="KPI", entity_id=str(kpi.id),
          new={"pilot_id": pilot.id, "name": payload.name,
               "direction": payload.direction,
               "safety_critical": payload.safety_critical})
    return kpi


def list_kpis(db: Session, user: User, pilot_id: int,
              page: int, size: int) -> dict:
    pilot = _get_visible_pilot(db, user, pilot_id)
    q = db.query(KPI).filter(KPI.pilot_id == pilot.id).order_by(KPI.id)
    return _paginate(q, page, size)


def patch_kpi(db: Session, user: User, pilot_id: int, kpi_id: int,
              payload: KPIPatch) -> KPI:
    pilot = _get_visible_pilot(db, user, pilot_id)
    kpi = _scoped(db.query(KPI), pilot.id, kpi_id, "KPI")
    _reject_startup_safety(user, payload)
    _require_manager_or_owner(user, pilot)
    _require_live_pilot(pilot)
    data = payload.model_dump(exclude_unset=True)
    for field, value in data.items():
        setattr(kpi, field, value)
    db.flush()
    audit(db, user_id=user.id, action=AuditAction.UPDATE,
          entity_type="KPI", entity_id=str(kpi.id), new=data)
    return kpi


# ---- Risks ----

def create_risk(db: Session, user: User, pilot_id: int,
                payload: RiskCreate) -> Risk:
    pilot = _get_visible_pilot(db, user, pilot_id)
    _require_manager_or_owner(user, pilot)
    _require_live_pilot(pilot)
    risk = Risk(pilot_id=pilot.id, description=payload.description,
                category=payload.category, likelihood=payload.likelihood,
                impact=payload.impact, mitigation=payload.mitigation,
                residual=payload.residual,
                is_critical=payload.is_critical)
    db.add(risk)
    db.flush()
    audit(db, user_id=user.id, action=AuditAction.CREATE,
          entity_type="Risk", entity_id=str(risk.id),
          new={"pilot_id": pilot.id, "description": payload.description})
    return risk


def list_risks(db: Session, user: User, pilot_id: int,
               page: int, size: int) -> dict:
    pilot = _get_visible_pilot(db, user, pilot_id)
    q = db.query(Risk).filter(Risk.pilot_id == pilot.id).order_by(Risk.id)
    return _paginate(q, page, size)


def patch_risk(db: Session, user: User, pilot_id: int, risk_id: int,
               payload: RiskPatch) -> Risk:
    pilot = _get_visible_pilot(db, user, pilot_id)
    risk = _scoped(db.query(Risk), pilot.id, risk_id, "Risk")
    _require_manager_or_owner(user, pilot)
    _require_live_pilot(pilot)
    data = payload.model_dump(exclude_unset=True)
    for field, value in data.items():
        setattr(risk, field, value)
    db.flush()
    audit(db, user_id=user.id, action=AuditAction.UPDATE,
          entity_type="Risk", entity_id=str(risk.id), new=data)
    return risk


# ---- Constraints ----

def create_constraint(db: Session, user: User, pilot_id: int,
                      payload: ConstraintCreate) -> Constraint:
    pilot = _get_visible_pilot(db, user, pilot_id)
    _require_manager_or_owner(user, pilot)
    _require_live_pilot(pilot)
    constraint = Constraint(pilot_id=pilot.id,
                            constraint_type=payload.constraint_type,
                            context_value=payload.context_value,
                            notes=payload.notes)
    db.add(constraint)
    db.flush()
    audit(db, user_id=user.id, action=AuditAction.CREATE,
          entity_type="Constraint", entity_id=str(constraint.id),
          new={"pilot_id": pilot.id,
               "constraint_type": payload.constraint_type.value})
    return constraint


def list_constraints(db: Session, user: User, pilot_id: int,
                     page: int, size: int) -> dict:
    pilot = _get_visible_pilot(db, user, pilot_id)
    q = db.query(Constraint).filter(
        Constraint.pilot_id == pilot.id).order_by(Constraint.id)
    return _paginate(q, page, size)
