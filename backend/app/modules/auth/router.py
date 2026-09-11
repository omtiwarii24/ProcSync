from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_session
from app.core.rbac import get_current_user
from app.modules.auth import service
from app.modules.auth.models import User
from app.modules.auth.schemas import (LoginRequest, RegisterRequest,
                                       RegisterWithInviteRequest,
                                       TokenResponse, UserOut)

auth_router = APIRouter()


@auth_router.post("/register", response_model=TokenResponse, status_code=201)
def register(payload: RegisterRequest, db: Session = Depends(get_session)):
    return service.register_user(db, payload)


@auth_router.post("/register-with-invite", response_model=TokenResponse,
                  status_code=201)
def register_with_invite(payload: RegisterWithInviteRequest,
                         db: Session = Depends(get_session)):
    return service.register_with_invite(db, payload)


@auth_router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_session)):
    return service.login(db, payload.email, payload.password)


@auth_router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return user
