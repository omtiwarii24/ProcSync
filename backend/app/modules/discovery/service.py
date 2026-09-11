import secrets
from datetime import timedelta

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.ai.base import AIProviderUnavailable
from app.ai.factory import get_ai_provider
from app.core.audit import audit
from app.core.errors import (AIProviderError, AppError, NotFound,
                             PermissionDenied)
from app.models.audit import utcnow
from app.models.enums import (AuditAction, DiscoverySource, InvitationStatus,
                              UserRole)
from app.modules.auth.models import User
from app.modules.challenges.models import Challenge
from app.modules.discovery.models import DiscoveredStartup, Invitation

_PROVIDER_SOURCE = {
    "gemini": DiscoverySource.GEMINI_SEARCH,
    "mock": DiscoverySource.SEED_INDEX,
}


def _resolve_source() -> DiscoverySource:
    import os
    provider_name = (os.environ.get("AI_PROVIDER") or "mock").strip().lower() or "mock"
    return _PROVIDER_SOURCE.get(provider_name, DiscoverySource.GEMINI_SEARCH)


def _get_challenge(db: Session, challenge_id: int) -> Challenge:
    ch = db.get(Challenge, challenge_id)
    if ch is None:
        raise NotFound(f"Challenge {challenge_id} not found")
    return ch


def _assert_can_manage(user: User, challenge: Challenge) -> None:
    if user.role not in (UserRole.DEPT_OWNER, UserRole.ADMIN):
        raise PermissionDenied(
            "Requires role DEPT_OWNER or ADMIN",
            context={"required": ["DEPT_OWNER", "ADMIN"]})
    if user.role == UserRole.DEPT_OWNER and user.department_id != challenge.department_id:
        raise PermissionDenied("You do not own this challenge")


def _sorted_rows(db: Session, challenge_id: int) -> list[DiscoveredStartup]:
    return db.query(DiscoveredStartup).filter(
        DiscoveredStartup.challenge_id == challenge_id).order_by(
        DiscoveredStartup.relevance_score.desc(),
        DiscoveredStartup.id).all()


def run_discovery_for_user(db: Session, user: User, challenge_id: int) -> list[DiscoveredStartup]:
    ch = _get_challenge(db, challenge_id)
    _assert_can_manage(user, ch)
    try:
        result = run_discovery(db, user.id, ch)
    except AIProviderError as exc:
        audit(db, user_id=user.id, action=AuditAction.COMPUTE,
              entity_type="DiscoveryRun", entity_id=str(ch.id),
              new={"status": "failed", "error": str(exc)[:200]})
        db.commit()
        raise
    db.commit()
    return result


def _score(item: dict) -> float:
    try:
        return min(1.0, max(0.0, float(item.get("relevance_score") or 0.0)))
    except (TypeError, ValueError):
        return 0.0


def _dedupe_by_best_score(items: list[dict]) -> list[dict]:
    best: dict[str, dict] = {}
    for item in items:
        name = item.get("name") or ""
        if not name:
            continue
        current = best.get(name)
        if current is None or _score(item) > _score(current):
            best[name] = item
    return sorted(best.values(),
                  key=lambda i: (-_score(i), i["name"]))[:10]


def _upsert_one(db: Session, challenge: Challenge, item: dict,
                source: DiscoverySource) -> None:
    for attempt in range(3):
        nested = db.begin_nested()
        try:
            row = db.query(DiscoveredStartup).filter(
                DiscoveredStartup.challenge_id == challenge.id,
                DiscoveredStartup.name == item["name"]).first()
            if row is None:
                row = DiscoveredStartup(challenge_id=challenge.id,
                                        name=item["name"])
                db.add(row)
            row.website = str(item.get("website") or "")
            row.sector = str(item.get("sector") or "")
            row.location = str(item.get("location") or "")
            row.source = source
            row.relevance_score = _score(item)
            row.relevance_evidence = str(item.get("relevance_evidence") or "")
            db.flush()
            nested.commit()
            return
        except IntegrityError:
            # concurrent INSERT raced us; savepoint rollback keeps the
            # caller's pending work intact, retry takes the update path
            nested.rollback()
            if attempt == 2:
                raise


def run_discovery(db: Session, actor_user_id: int | None, challenge: Challenge) -> list[DiscoveredStartup]:
    try:
        provider = get_ai_provider()
        results = provider.discover_startups(
            problem_statement=challenge.problem_statement,
            domain=challenge.domain.value,
        )
    except AIProviderUnavailable as exc:
        raise AIProviderError(
            f"AI provider unavailable: {exc}",
            context={"challenge_id": challenge.id}) from exc

    source = _resolve_source()
    if source == DiscoverySource.GEMINI_SEARCH:
        # gemini mode must also consult the mock/seed index (mock mode IS
        # the seed index, so no merge there)
        from app.ai.mock import MockAI
        seed_results = MockAI().discover_startups(
            problem_statement=challenge.problem_statement,
            domain=challenge.domain.value,
        )
        results = _dedupe_by_best_score(list(results) + list(seed_results))
    else:
        results = _dedupe_by_best_score(list(results))

    for item in results:
        _upsert_one(db, challenge, item, source)
    audit(db, user_id=actor_user_id, action=AuditAction.COMPUTE,
          entity_type="DiscoveryRun", entity_id=str(challenge.id),
          new={"count": len(results), "source": source.value})
    return _sorted_rows(db, challenge.id)


def list_discovered(db: Session, user: User, challenge_id: int,
                    page: int, size: int) -> dict:
    ch = _get_challenge(db, challenge_id)
    _assert_can_manage(user, ch)
    q = db.query(DiscoveredStartup).filter(
        DiscoveredStartup.challenge_id == ch.id)
    total = q.count()
    items = (q.order_by(DiscoveredStartup.relevance_score.desc(),
                        DiscoveredStartup.id)
             .offset((page - 1) * size).limit(size).all())
    return {"items": items, "page": page, "size": size, "total": total}


def create_invitation(db: Session, user: User, challenge_id: int,
                      discovered_startup_id: int, email: str) -> Invitation:
    ch = _get_challenge(db, challenge_id)
    _assert_can_manage(user, ch)
    startup = db.get(DiscoveredStartup, discovered_startup_id)
    if startup is None or startup.challenge_id != ch.id:
        raise NotFound(
            f"Discovered startup {discovered_startup_id} not found for "
            f"challenge {challenge_id}")
    active = db.query(Invitation).filter(
        Invitation.challenge_id == ch.id,
        Invitation.email == email,
        Invitation.status == InvitationStatus.SENT).first()
    if active is not None:
        raise AppError(
            "An active invitation already exists for this email",
            context={"challenge_id": ch.id, "email": email},
            status_code=409, code="INVITATION_DUPLICATE_ACTIVE")
    inv = Invitation(
        challenge_id=ch.id,
        discovered_startup_id=startup.id,
        email=email,
        invite_code=secrets.token_urlsafe(16),
        status=InvitationStatus.SENT,
        invited_by=user.id,
        expires_at=utcnow() + timedelta(days=14),
    )
    db.add(inv)
    db.flush()
    audit(db, user_id=user.id, action=AuditAction.CREATE,
          entity_type="Invitation", entity_id=str(inv.id),
          new={"challenge_id": ch.id, "email": email,
               "discovered_startup_id": startup.id,
               "status": InvitationStatus.SENT.value})
    return inv


def list_invitations(db: Session, user: User, challenge_id: int,
                     page: int, size: int) -> dict:
    ch = _get_challenge(db, challenge_id)
    _assert_can_manage(user, ch)
    q = db.query(Invitation).filter(Invitation.challenge_id == ch.id)
    total = q.count()
    items = (q.order_by(Invitation.id.desc())
             .offset((page - 1) * size).limit(size).all())
    return {"items": items, "page": page, "size": size, "total": total}


def resolve_invitation(db: Session, invite_code: str, startup_id: int) -> Invitation:
    inv = db.query(Invitation).filter(
        Invitation.invite_code == invite_code).first()
    if inv is None:
        raise NotFound("Invitation code not found")
    if inv.status != InvitationStatus.SENT:
        raise AppError(
            "Invitation code has already been used",
            context={"invitation_id": inv.id, "status": inv.status.value},
            status_code=409, code="INVITATION_ALREADY_USED")
    if inv.expires_at is not None and inv.expires_at <= utcnow():
        # Rollback FIRST: the caller (register_with_invite) may hold uncommitted
        # User/Startup rows in this transaction — the registration is failing,
        # so that partial state must be discarded, not committed alongside the
        # EXPIRED flip. Then re-query and re-validate on a clean session.
        db.rollback()
        inv = db.query(Invitation).filter(
            Invitation.invite_code == invite_code).first()
        if inv is None:
            raise NotFound("Invitation code not found")
        if inv.status != InvitationStatus.SENT:
            raise AppError("Invitation code has already been used",
                           context={"invitation_id": inv.id, "status": inv.status.value},
                           status_code=409, code="INVITATION_ALREADY_USED")
        inv.status = InvitationStatus.EXPIRED
        db.flush()
        audit(db, user_id=None, action=AuditAction.RESOLVE,
              entity_type="Invitation", entity_id=str(inv.id),
              old={"status": InvitationStatus.SENT.value},
              new={"status": InvitationStatus.EXPIRED.value,
                   "reason": "expired"})
        # EXPIRED is terminal: persist the flip even though this request fails
        # (unlike REGISTERED, which must stay atomic with the caller's commit).
        db.commit()
        raise AppError("Invitation code has expired",
                       context={"invitation_id": inv.id},
                       status_code=409, code="INVITATION_EXPIRED")
    old_status = inv.status.value
    inv.status = InvitationStatus.REGISTERED
    inv.registered_startup_id = startup_id
    db.flush()
    audit(db, user_id=None, action=AuditAction.RESOLVE,
          entity_type="Invitation", entity_id=str(inv.id),
          old={"status": old_status},
          new={"status": InvitationStatus.REGISTERED.value,
               "registered_startup_id": startup_id})
    return inv
