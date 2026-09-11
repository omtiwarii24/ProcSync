from sqlalchemy.orm import Session

from app.core.audit import audit
from app.core.errors import NotFound, PermissionDenied
from app.models.enums import (AuditAction, ChallengeStatus, CriterionType,
                              DomainTag, UserRole)
from app.modules.auth.models import User
from app.modules.challenges.models import Challenge, EligibilityCriterion
from app.modules.challenges.schemas import (ChallengeCreate, ChallengeUpdate,
                                            CriterionCreate)

CHALLENGE_TRANSITIONS = {
    ChallengeStatus.DRAFT: [ChallengeStatus.PUBLISHED],
    ChallengeStatus.PUBLISHED: [ChallengeStatus.CLOSED],
    ChallengeStatus.CLOSED: [],
}

DEFAULT_EVALUATION_WEIGHTS = {
    "impact": 35.0, "cost_effectiveness": 20.0, "technical_maturity": 15.0,
    "operational_readiness": 10.0, "security_compliance": 10.0,
    "user_adoption": 5.0, "scalability": 5.0,
}


def get_challenge(db: Session, challenge_id: int) -> Challenge:
    ch = db.get(Challenge, challenge_id)
    if ch is None:
        raise NotFound(f"Challenge {challenge_id} not found")
    return ch


def assert_dept_owns(user: User, challenge: Challenge) -> None:
    if user.role != UserRole.ADMIN and user.department_id != challenge.department_id:
        raise PermissionDenied("You do not own this challenge")


def create_challenge(db: Session, user: User, payload: ChallengeCreate) -> Challenge:
    if user.department_id is None:
        raise PermissionDenied("DEPT_OWNER must be linked to a department")
    ch = Challenge(department_id=user.department_id, status=ChallengeStatus.DRAFT,
                   **payload.model_dump())
    db.add(ch)
    db.flush()
    audit(db, user_id=user.id, action=AuditAction.CREATE, entity_type="Challenge",
          entity_id=str(ch.id),
          new={"title": ch.title, "domain": ch.domain.value, "status": ch.status.value})
    return ch


def update_challenge(db: Session, user: User, challenge_id: int,
                     payload: ChallengeUpdate) -> Challenge:
    ch = get_challenge(db, challenge_id)
    assert_dept_owns(user, ch)
    if ch.status != ChallengeStatus.DRAFT:
        from app.core.errors import InvalidStateTransition
        raise InvalidStateTransition(
            f"Challenge editable only in DRAFT (current: {ch.status.value})",
            context={"challenge_id": challenge_id, "status": ch.status.value})
    data = payload.model_dump(exclude_none=True)
    if data:
        old = {"title": ch.title, "domain": ch.domain.value}
        for field, value in data.items():
            setattr(ch, field, value)
        audit(db, user_id=user.id, action=AuditAction.UPDATE, entity_type="Challenge",
              entity_id=str(ch.id), old=old, new=data)
    return ch


def publish_challenge(db: Session, user: User, challenge_id: int) -> Challenge:
    from app.core.transitions import assert_transition
    ch = get_challenge(db, challenge_id)
    assert_dept_owns(user, ch)
    assert_transition("Challenge", ch.status,
                      {k: [s for s in v] for k, v in CHALLENGE_TRANSITIONS.items()},
                      ChallengeStatus.PUBLISHED)
    old_status = ch.status.value
    ch.status = ChallengeStatus.PUBLISHED
    if ch.evaluation_weights is None:
        ch.evaluation_weights = dict(DEFAULT_EVALUATION_WEIGHTS)
    audit(db, user_id=user.id, action=AuditAction.PUBLISH, entity_type="Challenge",
          entity_id=str(ch.id), old={"status": old_status}, new={"status": "PUBLISHED"})
    try:
        from app.modules.discovery.service import run_discovery
        run_discovery(db, user.id, ch)
    except Exception as exc:
        # Discovery may have failed mid-write (session now needs rollback).
        # Rollback discards the publish state above, so re-apply it and
        # re-write the PUBLISH audit, then record the discovery failure.
        db.rollback()
        ch.status = ChallengeStatus.PUBLISHED
        if ch.evaluation_weights is None:
            ch.evaluation_weights = dict(DEFAULT_EVALUATION_WEIGHTS)
        audit(db, user_id=user.id, action=AuditAction.PUBLISH, entity_type="Challenge",
              entity_id=str(ch.id), old={"status": old_status}, new={"status": "PUBLISHED"})
        audit(db, user_id=user.id, action=AuditAction.COMPUTE,
              entity_type="DiscoveryRun", entity_id=str(ch.id),
              new={"status": "failed", "error": str(exc)[:200]})
    return ch


def close_challenge(db: Session, user: User, challenge_id: int) -> Challenge:
    from app.core.transitions import assert_transition
    ch = get_challenge(db, challenge_id)
    assert_dept_owns(user, ch)
    assert_transition("Challenge", ch.status,
                      {k: [s for s in v] for k, v in CHALLENGE_TRANSITIONS.items()},
                      ChallengeStatus.CLOSED)
    old_status = ch.status.value
    ch.status = ChallengeStatus.CLOSED
    audit(db, user_id=user.id, action=AuditAction.CLOSE, entity_type="Challenge",
          entity_id=str(ch.id), old={"status": old_status}, new={"status": "CLOSED"})
    return ch


def list_challenges(db: Session, user: User, page: int, size: int,
                     status_filter: ChallengeStatus | None,
                     domain_filter: DomainTag | None = None) -> dict:
    q = db.query(Challenge)
    if user.role == UserRole.STARTUP:
        q = q.filter(Challenge.status == ChallengeStatus.PUBLISHED)
    elif user.role == UserRole.DEPT_OWNER:
        from sqlalchemy import or_
        q = q.filter(or_(
            Challenge.department_id == user.department_id,
            Challenge.status != ChallengeStatus.DRAFT))
        if status_filter is not None:
            q = q.filter(Challenge.status == status_filter)
    elif user.role != UserRole.ADMIN:
        q = q.filter(Challenge.status != ChallengeStatus.DRAFT)
        if status_filter is not None:
            q = q.filter(Challenge.status == status_filter)
    elif status_filter is not None:
        q = q.filter(Challenge.status == status_filter)
    if domain_filter is not None:
        q = q.filter(Challenge.domain == domain_filter)
    total = q.count()
    items = q.order_by(Challenge.id.desc()).offset((page - 1) * size).limit(size).all()
    return {"items": items, "page": page, "size": size, "total": total}


def get_challenge_for_user(db: Session, user: User, challenge_id: int) -> Challenge:
    ch = get_challenge(db, challenge_id)
    if user.role == UserRole.STARTUP and ch.status != ChallengeStatus.PUBLISHED:
        raise NotFound(f"Challenge {challenge_id} not found")  # existence-hiding per ledger ruling
    if (user.role != UserRole.ADMIN and user.role != UserRole.DEPT_OWNER
            and ch.status == ChallengeStatus.DRAFT):
        raise NotFound(f"Challenge {challenge_id} not found")
    if user.role == UserRole.DEPT_OWNER and ch.status == ChallengeStatus.DRAFT \
            and user.department_id != ch.department_id:
        raise NotFound(f"Challenge {challenge_id} not found")
    return ch


def add_criterion(db: Session, user: User, challenge_id: int,
                  payload: CriterionCreate) -> EligibilityCriterion:
    ch = get_challenge(db, challenge_id)
    assert_dept_owns(user, ch)
    if ch.status != ChallengeStatus.DRAFT:
        from app.core.errors import InvalidStateTransition
        raise InvalidStateTransition(
            f"Criteria editable only in DRAFT (current: {ch.status.value})",
            context={"challenge_id": challenge_id, "status": ch.status.value})
    is_auto = payload.criterion_type != CriterionType.CUSTOM
    crit = EligibilityCriterion(
        challenge_id=challenge_id,
        criterion_type=payload.criterion_type,
        operator=payload.operator,
        threshold=payload.threshold,
        is_auto_checkable=is_auto,
        waiver_allowed=payload.waiver_allowed,
        description=payload.description,
    )
    db.add(crit)
    db.flush()
    audit(db, user_id=user.id, action=AuditAction.CREATE,
          entity_type="EligibilityCriterion", entity_id=str(crit.id),
          new={"challenge_id": challenge_id, "criterion_type": payload.criterion_type.value,
               "operator": payload.operator.value, "threshold": payload.threshold,
               "is_auto_checkable": is_auto})
    return crit
