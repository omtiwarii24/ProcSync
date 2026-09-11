from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.database import get_session
from app.core.errors import PermissionDenied, Unauthorized
from app.core.security import PORTAL_BY_ROLE, decode_token
from app.models.enums import Portal, UserRole
from app.modules.auth.models import User

bearer = HTTPBearer(auto_error=False)


def get_current_user(
    creds: HTTPAuthorizationCredentials | None = Depends(bearer),
    db: Session = Depends(get_session),
) -> User:
    if creds is None:
        raise Unauthorized("Not authenticated")
    try:
        claims = decode_token(creds.credentials)
    except Exception:
        raise Unauthorized("Invalid or expired token")
    user = db.get(User, int(claims["sub"]))
    if user is None or not user.is_active:
        raise PermissionDenied("User not found or inactive")
    return user


def require_any_authenticated():
    def dep(user: User = Depends(get_current_user)) -> User:
        return user
    return dep


def require_role(*allowed: UserRole):
    def dep(user: User = Depends(get_current_user)) -> User:
        if user.role not in allowed:
            raise PermissionDenied(
                f"Requires role in {[r.value for r in allowed]}",
                context={"required": [r.value for r in allowed]},
            )
        return user
    return dep


def require_portal(portal: Portal):
    def dep(user: User = Depends(get_current_user)) -> User:
        user_role = user.role if isinstance(user.role, UserRole) else UserRole(user.role)
        if PORTAL_BY_ROLE[user_role] != portal:
            raise PermissionDenied(f"Requires portal {portal.value}")
        return user
    return dep
