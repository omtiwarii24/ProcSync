from typing import Any

from sqlalchemy.orm import Session

from app.models.audit import AuditLog
from app.models.enums import AuditAction


def audit(
    db: Session,
    user_id: int | None,
    action: AuditAction,
    entity_type: str,
    entity_id: str,
    old: dict[str, Any] | None = None,
    new: dict[str, Any] | None = None,
) -> AuditLog:
    log = AuditLog(
        user_id=user_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        old_values=old,
        new_values=new,
    )
    db.add(log)
    db.flush()
    return log
