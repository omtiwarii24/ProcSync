from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.audit import audit
from app.core.errors import AppError, BadRequest, PermissionDenied
from app.core.security import create_access_token, hash_password, verify_password
from app.models.enums import AuditAction, UserRole
from app.modules.auth.models import User
from app.modules.auth.schemas import (RegisterRequest,
                                       RegisterWithInviteRequest)


def register_user(db: Session, payload: RegisterRequest) -> dict:
    if payload.role == UserRole.ADMIN:
        raise PermissionDenied("ADMIN accounts are created via seed only")
    if db.query(User).filter(User.email == payload.email).first() is not None:
        raise AppError("Email already registered",
                       context={"email": payload.email},
                       status_code=409, code="EMAIL_TAKEN")
    user = User(
        email=payload.email,
        password_hash=hash_password(payload.password),
        role=payload.role,
        full_name=payload.full_name,
    )
    db.add(user)
    db.flush()
    if payload.role == UserRole.DEPT_OWNER:
        if payload.department is None:
            raise BadRequest("department details required for DEPT_OWNER")
        from app.modules.orgs.service import create_department
        dept = create_department(
            db, actor_user_id=user.id, name=payload.department.name,
            code=payload.department.code,
            context=payload.department.model_dump(exclude={"name", "code"}))
        user.department_id = dept.id
    elif payload.role == UserRole.STARTUP:
        if payload.startup is None:
            raise BadRequest("startup name required for STARTUP")
        from app.modules.orgs.models import Startup
        st = Startup(owner_user_id=user.id, name=payload.startup.name)
        db.add(st)
        db.flush()
        audit(db, user_id=user.id, action=AuditAction.CREATE, entity_type="Startup",
              entity_id=str(st.id), new={"name": st.name})
    audit(db, user_id=user.id, action=AuditAction.CREATE, entity_type="User",
          entity_id=str(user.id),
          new={"email": user.email, "role": payload.role.value,
               "full_name": user.full_name})
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise AppError("Email already registered",
                       context={"email": payload.email},
                       status_code=409, code="EMAIL_TAKEN")
    return {"access_token": create_access_token(user), "user": user}


def register_with_invite(db: Session, payload: RegisterWithInviteRequest) -> dict:
    if db.query(User).filter(User.email == payload.email).first() is not None:
        raise AppError("Email already registered",
                       context={"email": payload.email},
                       status_code=409, code="EMAIL_TAKEN")
    from app.modules.discovery.service import resolve_invitation
    from app.modules.orgs.models import Startup
    user = User(
        email=payload.email,
        password_hash=hash_password(payload.password),
        role=UserRole.STARTUP,
        full_name=payload.full_name,
    )
    db.add(user)
    db.flush()
    st = Startup(owner_user_id=user.id, name=payload.startup_name)
    db.add(st)
    db.flush()
    resolve_invitation(db, payload.invite_code, st.id)
    audit(db, user_id=user.id, action=AuditAction.CREATE, entity_type="Startup",
          entity_id=str(st.id), new={"name": st.name})
    audit(db, user_id=user.id, action=AuditAction.CREATE, entity_type="User",
          entity_id=str(user.id),
          new={"email": user.email, "role": UserRole.STARTUP.value,
               "full_name": user.full_name, "invited": True})
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise AppError("Email already registered",
                       context={"email": payload.email},
                       status_code=409, code="EMAIL_TAKEN")
    return {"access_token": create_access_token(user), "user": user}


def authenticate(db: Session, email: str, password: str) -> User | None:
    user = db.query(User).filter(User.email == email).first()
    if user is None or not user.is_active or not verify_password(password, user.password_hash):
        return None
    return user


def login(db: Session, email: str, password: str) -> dict:
    user = authenticate(db, email, password)
    if user is None:
        audit(db, user_id=None, action=AuditAction.LOGIN_FAILED, entity_type="User",
              entity_id=email, new={"email": email})
        db.commit()
        raise AppError("Invalid credentials", status_code=401,
                       code="INVALID_CREDENTIALS")
    audit(db, user_id=user.id, action=AuditAction.LOGIN, entity_type="User",
          entity_id=str(user.id), new={"email": user.email})
    db.commit()
    return {"access_token": create_access_token(user), "user": user}
