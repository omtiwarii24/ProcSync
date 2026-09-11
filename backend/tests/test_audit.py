from sqlalchemy import text

from app.core.audit import audit
from app.models.audit import AuditLog
from app.models.enums import AuditAction


def _seed_user(session):
    from app.core.security import hash_password
    from app.models.enums import UserRole
    from app.modules.auth.models import User

    user = User(email="audit-test@gov.in", password_hash=hash_password("Passw0rd!123"),
                role=UserRole.DEPT_OWNER, full_name="Audit Test")
    session.add(user)
    session.flush()
    return user.id


def test_audit_writes_row(session):
    uid = _seed_user(session)
    audit(session, user_id=uid, action=AuditAction.CREATE, entity_type="Challenge",
          entity_id="1", new={"title": "Leak detection"})
    session.commit()
    row = session.query(AuditLog).one()
    assert row.action == AuditAction.CREATE
    assert row.entity_type == "Challenge"
    assert row.new_values["title"] == "Leak detection"
    assert row.user_id == uid


def test_audit_old_new_nullable(session):
    audit(session, user_id=None, action=AuditAction.LOGIN, entity_type="User",
          entity_id="7")
    session.commit()
    row = session.query(AuditLog).one()
    assert row.old_values is None
    assert row.new_values is None


def test_audit_append_only_blocked(session):
    # Postgres rules make UPDATE/DELETE succeed silently with ZERO rows affected (DO INSTEAD NOTHING)
    uid = _seed_user(session)
    audit(session, user_id=uid, action=AuditAction.CREATE, entity_type="X",
          entity_id="1")
    session.commit()
    row_id = session.query(AuditLog).one().id
    session.execute(text(f"UPDATE audit_logs SET entity_type='Y' WHERE id={row_id}"))
    session.execute(text(f"DELETE FROM audit_logs WHERE id={row_id}"))
    session.commit()
    session.expire_all()
    row = session.get(AuditLog, row_id)
    assert row is not None and row.entity_type == "X"


def test_error_hierarchy():
    from app.core.errors import (
        AIProviderError, AppError, BadRequest, InvalidStateTransition, NotFound,
        PermissionDenied,
    )
    assert issubclass(PermissionDenied, AppError)
    assert issubclass(InvalidStateTransition, AppError)
    assert issubclass(AIProviderError, AppError)
    assert issubclass(NotFound, AppError)
    assert issubclass(BadRequest, AppError)
    assert PermissionDenied("x").status_code == 403
    assert PermissionDenied("x").code == "PERMISSION_DENIED"
    # per-instance override
    e = AppError("taken", status_code=409, code="EMAIL_TAKEN")
    assert e.status_code == 409 and e.code == "EMAIL_TAKEN" and e.detail == "taken"
