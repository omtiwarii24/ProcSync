from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_session
from app.core.rbac import require_any_authenticated, require_role
from app.models.enums import PilotStatus, UserRole
from app.modules.auth.models import User
from app.modules.pilots import service
from app.modules.pilots.schemas import (
    FailRequest, PaginatedPilots, PilotCreate, PilotOut, PilotSummaryOut,
    TerminateRequest)

pilots_router = APIRouter()


@pilots_router.post("/proposals/{proposal_id}/pilot",
                    response_model=PilotOut, status_code=201)
def create_pilot(proposal_id: int, payload: PilotCreate,
                 user: User = Depends(require_role(UserRole.DEPT_OWNER,
                                                   UserRole.ADMIN)),
                 db: Session = Depends(get_session)):
    pilot = service.create_pilot(db, user, proposal_id, payload)
    db.commit()
    return pilot


@pilots_router.get("/pilots", response_model=PaginatedPilots)
def list_pilots(page: int = Query(1, ge=1), size: int = Query(20, ge=1, le=100),
                user: User = Depends(require_any_authenticated()),
                db: Session = Depends(get_session)):
    return service.list_pilots(db, user, page, size)


@pilots_router.get("/pilots/{pilot_id}", response_model=PilotOut)
def get_pilot(pilot_id: int,
              user: User = Depends(require_any_authenticated()),
              db: Session = Depends(get_session)):
    return service.get_pilot_for_user(db, user, pilot_id)


@pilots_router.post("/pilots/{pilot_id}/activate", response_model=PilotOut)
def activate_pilot(pilot_id: int,
                   user: User = Depends(require_any_authenticated()),
                   db: Session = Depends(get_session)):
    pilot = service.transition_pilot(db, user, pilot_id, PilotStatus.ACTIVE)
    db.commit()
    return pilot


@pilots_router.post("/pilots/{pilot_id}/complete", response_model=PilotOut)
def complete_pilot(pilot_id: int,
                   user: User = Depends(require_any_authenticated()),
                   db: Session = Depends(get_session)):
    pilot = service.transition_pilot(db, user, pilot_id, PilotStatus.COMPLETED)
    db.commit()
    return pilot


# ---- Task K: pilot workflow extras ----

@pilots_router.post("/pilots/{pilot_id}/accept-terms", response_model=PilotOut)
def accept_terms(pilot_id: int,
                 user: User = Depends(require_any_authenticated()),
                 db: Session = Depends(get_session)):
    pilot = service.accept_terms(db, user, pilot_id)
    db.commit()
    return pilot


@pilots_router.post("/pilots/{pilot_id}/fail", response_model=PilotOut)
def fail_pilot(pilot_id: int, payload: FailRequest,
               user: User = Depends(require_any_authenticated()),
               db: Session = Depends(get_session)):
    pilot = service.fail_pilot(db, user, pilot_id,
                               payload.failure_conditions)
    db.commit()
    return pilot


@pilots_router.post("/pilots/{pilot_id}/terminate", response_model=PilotOut)
def terminate_pilot(pilot_id: int, payload: TerminateRequest,
                    user: User = Depends(require_any_authenticated()),
                    db: Session = Depends(get_session)):
    pilot = service.terminate_pilot(db, user, pilot_id, payload.reason)
    db.commit()
    return pilot


@pilots_router.get("/pilots/{pilot_id}/summary", response_model=PilotSummaryOut)
def get_pilot_summary(pilot_id: int,
                      user: User = Depends(require_any_authenticated()),
                      db: Session = Depends(get_session)):
    return service.get_pilot_summary(db, user, pilot_id)
