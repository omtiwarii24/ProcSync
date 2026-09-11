from datetime import datetime, timedelta, timezone

import jwt
from passlib.context import CryptContext

from app.core.config import settings
from app.models.enums import Portal, UserRole

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

PORTAL_BY_ROLE: dict[UserRole, Portal] = {r: Portal.B for r in UserRole}
PORTAL_BY_ROLE[UserRole.STARTUP] = Portal.A


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, hashed: str) -> bool:
    return pwd_context.verify(password, hashed)


def create_access_token(user) -> str:
    now = datetime.now(timezone.utc)
    role = user.role if isinstance(user.role, UserRole) else UserRole(user.role)
    payload = {
        "sub": str(user.id),
        "role": role.value,
        "portal": PORTAL_BY_ROLE[role].value,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=settings.jwt_expire_minutes)).timestamp()),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm="HS256")


def decode_token(token: str) -> dict:
    return jwt.decode(token, settings.jwt_secret, algorithms=["HS256"],
                      options={"require": ["exp", "sub"]})
