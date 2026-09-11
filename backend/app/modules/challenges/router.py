from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_session
from app.core.rbac import require_any_authenticated, require_role
from app.models.enums import ChallengeStatus, DomainTag, UserRole
from app.modules.auth.models import User
from app.modules.challenges import service
from app.modules.challenges.models import Challenge
from app.modules.challenges.schemas import (ChallengeCreate, ChallengeOut,
                                            ChallengeUpdate, CriterionCreate,
                                            CriterionOut, PaginatedChallenges,
                                            PaginatedCriteria)

challenges_router = APIRouter()


@challenges_router.post("/challenges", response_model=ChallengeOut, status_code=201)
def create_challenge(payload: ChallengeCreate,
                     user: User = Depends(require_role(UserRole.DEPT_OWNER)),
                     db: Session = Depends(get_session)):
    ch = service.create_challenge(db, user, payload)
    db.commit()
    return ch


@challenges_router.get("/challenges", response_model=PaginatedChallenges)
def list_challenges(page: int = Query(1, ge=1), size: int = Query(20, ge=1, le=100),
                     status: ChallengeStatus | None = None,
                     domain: DomainTag | None = None,
                     user: User = Depends(require_any_authenticated()),
                     db: Session = Depends(get_session)):
    return service.list_challenges(db, user, page, size, status, domain)


@challenges_router.get("/challenges/mine", response_model=PaginatedChallenges)
def my_challenges(page: int = Query(1, ge=1), size: int = Query(20, ge=1, le=100),
                  user: User = Depends(require_role(UserRole.DEPT_OWNER)),
                  db: Session = Depends(get_session)):
    q = db.query(Challenge).filter(Challenge.department_id == user.department_id)
    total = q.count()
    items = q.order_by(Challenge.id.desc()).offset((page - 1) * size).limit(size).all()
    return {"items": items, "page": page, "size": size, "total": total}


@challenges_router.get("/challenges/{challenge_id}", response_model=ChallengeOut)
def get_challenge(challenge_id: int,
                  user: User = Depends(require_any_authenticated()),
                  db: Session = Depends(get_session)):
    return service.get_challenge_for_user(db, user, challenge_id)


@challenges_router.patch("/challenges/{challenge_id}", response_model=ChallengeOut)
def update_challenge(challenge_id: int, payload: ChallengeUpdate,
                     user: User = Depends(require_role(UserRole.DEPT_OWNER)),
                     db: Session = Depends(get_session)):
    ch = service.update_challenge(db, user, challenge_id, payload)
    db.commit()
    return ch


@challenges_router.post("/challenges/{challenge_id}/publish", response_model=ChallengeOut)
def publish_challenge(challenge_id: int,
                      user: User = Depends(require_role(UserRole.DEPT_OWNER)),
                      db: Session = Depends(get_session)):
    ch = service.publish_challenge(db, user, challenge_id)
    db.commit()
    return ch


@challenges_router.post("/challenges/{challenge_id}/close", response_model=ChallengeOut)
def close_challenge(challenge_id: int,
                    user: User = Depends(require_role(UserRole.DEPT_OWNER)),
                    db: Session = Depends(get_session)):
    ch = service.close_challenge(db, user, challenge_id)
    db.commit()
    return ch


@challenges_router.post("/challenges/{challenge_id}/criteria",
                        response_model=CriterionOut, status_code=201)
def add_criterion(challenge_id: int, payload: CriterionCreate,
                  user: User = Depends(require_role(UserRole.DEPT_OWNER)),
                  db: Session = Depends(get_session)):
    crit = service.add_criterion(db, user, challenge_id, payload)
    db.commit()
    return crit


@challenges_router.get("/challenges/{challenge_id}/criteria",
                       response_model=PaginatedCriteria)
def list_criteria(challenge_id: int,
                 page: int = Query(1, ge=1), size: int = Query(20, ge=1, le=100),
                 user: User = Depends(require_any_authenticated()),
                 db: Session = Depends(get_session)):
    from app.modules.challenges.models import EligibilityCriterion
    ch = service.get_challenge_for_user(db, user, challenge_id)
    q = db.query(EligibilityCriterion).filter(
        EligibilityCriterion.challenge_id == ch.id)
    total = q.count()
    items = q.order_by(EligibilityCriterion.id).offset(
        (page - 1) * size).limit(size).all()
    return {"items": items, "page": page, "size": size, "total": total}
