from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_session
from app.core.rbac import require_role
from app.models.enums import UserRole
from app.modules.auth.models import User
from app.modules.discovery import service
from app.modules.discovery.schemas import (DiscoveredStartupOut, InvitationCreate,
                                           InvitationOut, PaginatedDiscoveredStartups,
                                           PaginatedInvitations)

discovery_router = APIRouter()


@discovery_router.post("/challenges/{challenge_id}/discover",
                       response_model=list[DiscoveredStartupOut])
def run_discovery(challenge_id: int,
                  user: User = Depends(require_role(UserRole.DEPT_OWNER,
                                                    UserRole.ADMIN)),
                  db: Session = Depends(get_session)):
    return service.run_discovery_for_user(db, user, challenge_id)

@discovery_router.get("/challenges/{challenge_id}/discovered",
                      response_model=PaginatedDiscoveredStartups)
def list_discovered(challenge_id: int,
                    page: int = Query(1, ge=1), size: int = Query(20, ge=1, le=100),
                    user: User = Depends(require_role(UserRole.DEPT_OWNER,
                                                      UserRole.ADMIN)),
                    db: Session = Depends(get_session)):
    return service.list_discovered(db, user, challenge_id, page, size)


@discovery_router.post("/challenges/{challenge_id}/invitations",
                       response_model=InvitationOut, status_code=201)
def create_invitation(challenge_id: int, payload: InvitationCreate,
                      user: User = Depends(require_role(UserRole.DEPT_OWNER,
                                                        UserRole.ADMIN)),
                      db: Session = Depends(get_session)):
    inv = service.create_invitation(db, user, challenge_id,
                                    payload.discovered_startup_id, payload.email)
    db.commit()
    return inv


@discovery_router.get("/challenges/{challenge_id}/invitations",
                      response_model=PaginatedInvitations)
def list_invitations(challenge_id: int,
                     page: int = Query(1, ge=1), size: int = Query(20, ge=1, le=100),
                     user: User = Depends(require_role(UserRole.DEPT_OWNER,
                                                       UserRole.ADMIN)),
                     db: Session = Depends(get_session)):
    return service.list_invitations(db, user, challenge_id, page, size)
