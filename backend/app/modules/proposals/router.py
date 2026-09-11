from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_session
from app.core.rbac import require_any_authenticated, require_role
from app.models.enums import UserRole
from app.modules.auth.models import User
from app.modules.proposals import service
from app.modules.proposals.models import EligibilityCheck
from app.modules.proposals.schemas import (CheckOut, PaginatedProposals,
                                            PaginatedScores, PanelCreate,
                                            PanelMemberAdd, PanelMemberOut,
                                            PanelOut, ProposalCreate, ProposalOut,
                                            ProposalWithChecksOut, RankingOut,
                                            RejectRequest, ScoreCreate, ScoreOut,
                                            StartEvaluationOut, WaiveRequest)

proposals_router = APIRouter()


def _with_checks(db: Session, prop) -> ProposalWithChecksOut:
    checks = db.query(EligibilityCheck).filter(
        EligibilityCheck.proposal_id == prop.id).order_by(
        EligibilityCheck.id).all()
    out = ProposalWithChecksOut.model_validate(prop)
    out.checks = [CheckOut.model_validate(c) for c in checks]
    return out


@proposals_router.post("/challenges/{challenge_id}/proposals",
                       response_model=ProposalWithChecksOut, status_code=201)
def submit_proposal(challenge_id: int, payload: ProposalCreate,
                    user: User = Depends(require_role(UserRole.STARTUP)),
                    db: Session = Depends(get_session)):
    prop = service.submit_proposal(db, user, challenge_id, payload)
    db.commit()
    return _with_checks(db, prop)


@proposals_router.get("/proposals/mine", response_model=PaginatedProposals)
def my_proposals(page: int = Query(1, ge=1), size: int = Query(20, ge=1, le=100),
                 user: User = Depends(require_role(UserRole.STARTUP)),
                 db: Session = Depends(get_session)):
    return service.list_my_proposals(db, user, page, size)


@proposals_router.get("/challenges/{challenge_id}/proposals",
                     response_model=PaginatedProposals)
def challenge_proposals(challenge_id: int, page: int = Query(1, ge=1),
                        size: int = Query(20, ge=1, le=100),
                        user: User = Depends(require_role(UserRole.DEPT_OWNER,
                                                          UserRole.ADMIN)),
                        db: Session = Depends(get_session)):
    return service.list_challenge_proposals(db, user, challenge_id, page, size)


@proposals_router.get("/proposals/{proposal_id}", response_model=ProposalWithChecksOut)
def get_proposal(proposal_id: int,
                 user: User = Depends(require_any_authenticated()),
                 db: Session = Depends(get_session)):
    prop = service.get_proposal_for_user(db, user, proposal_id)
    return _with_checks(db, prop)


@proposals_router.post("/proposals/{proposal_id}/run-eligibility",
                       response_model=ProposalWithChecksOut)
def run_eligibility(proposal_id: int,
                    user: User = Depends(require_any_authenticated()),
                    db: Session = Depends(get_session)):
    prop = service.rerun_eligibility(db, user, proposal_id)
    db.commit()
    return _with_checks(db, prop)


@proposals_router.post("/eligibility-checks/{check_id}/waive", response_model=CheckOut)
def waive_check(check_id: int, payload: WaiveRequest,
                user: User = Depends(require_role(UserRole.ADMIN)),
                db: Session = Depends(get_session)):
    check = service.waive_check(db, user, check_id, payload.justification)
    db.commit()
    return check


@proposals_router.post("/challenges/{challenge_id}/panels",
                       response_model=PanelOut, status_code=201)
def create_panel(challenge_id: int, payload: PanelCreate,
                 user: User = Depends(require_role(UserRole.DEPT_OWNER,
                                                   UserRole.ADMIN)),
                 db: Session = Depends(get_session)):
    panel = service.create_panel(db, user, challenge_id, payload.name)
    db.commit()
    return panel


@proposals_router.post("/challenges/{challenge_id}/panels/{panel_id}/members",
                       response_model=PanelMemberOut, status_code=201)
def add_panel_member(challenge_id: int, panel_id: int, payload: PanelMemberAdd,
                     user: User = Depends(require_role(UserRole.DEPT_OWNER,
                                                       UserRole.ADMIN)),
                     db: Session = Depends(get_session)):
    member = service.add_panel_member(db, user, challenge_id, panel_id,
                                      payload.evaluator_user_id)
    db.commit()
    return member


@proposals_router.post("/proposals/{proposal_id}/scores",
                       response_model=ScoreOut, status_code=201)
def submit_score(proposal_id: int, payload: ScoreCreate,
                 user: User = Depends(require_role(UserRole.EVALUATOR,
                                                   UserRole.ADMIN)),
                 db: Session = Depends(get_session)):
    score = service.upsert_score(db, user, proposal_id, payload.gate,
                                 payload.dimension, payload.raw_score)
    db.commit()
    return score


@proposals_router.get("/proposals/{proposal_id}/scores",
                      response_model=PaginatedScores)
def get_scores(proposal_id: int, page: int = Query(1, ge=1),
               size: int = Query(20, ge=1, le=100),
               user: User = Depends(require_any_authenticated()),
               db: Session = Depends(get_session)):
    return service.list_scores(db, user, proposal_id, page, size)


@proposals_router.get("/challenges/{challenge_id}/ranking",
                       response_model=RankingOut)
def get_ranking(challenge_id: int,
                user: User = Depends(require_role(UserRole.DEPT_OWNER,
                                                  UserRole.ADMIN,
                                                  UserRole.EVALUATOR)),
                db: Session = Depends(get_session)):
    return service.get_ranking(db, user, challenge_id)


@proposals_router.post("/challenges/{challenge_id}/start-evaluation",
                       response_model=StartEvaluationOut)
def start_evaluation(challenge_id: int,
                     user: User = Depends(require_role(UserRole.DEPT_OWNER,
                                                       UserRole.ADMIN)),
                     db: Session = Depends(get_session)):
    moved = service.start_evaluation(db, user, challenge_id)
    db.commit()
    return {"moved": moved}


@proposals_router.post("/proposals/{proposal_id}/select",
                       response_model=ProposalOut)
def select_proposal(proposal_id: int,
                    user: User = Depends(require_role(UserRole.DEPT_OWNER,
                                                      UserRole.ADMIN)),
                    db: Session = Depends(get_session)):
    prop = service.select_proposal(db, user, proposal_id)
    db.commit()
    return prop


@proposals_router.post("/proposals/{proposal_id}/reject",
                       response_model=ProposalOut)
def reject_proposal(proposal_id: int, payload: RejectRequest,
                    user: User = Depends(require_role(UserRole.DEPT_OWNER,
                                                      UserRole.ADMIN)),
                    db: Session = Depends(get_session)):
    prop = service.reject_proposal(db, user, proposal_id, payload.reason)
    db.commit()
    return prop
