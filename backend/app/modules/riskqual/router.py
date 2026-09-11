from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_session
from app.core.rbac import require_any_authenticated, require_role
from app.models.enums import UserRole
from app.modules.auth.models import User
from app.modules.riskqual import service
from app.modules.riskqual.schemas import AnalysisOut, DecisionRequest

riskqual_router = APIRouter()


@riskqual_router.post("/proposals/{proposal_id}/risk-analysis",
                      response_model=list[AnalysisOut], status_code=201)
def generate_risk_analysis(proposal_id: int,
                           user: User = Depends(require_role(
                               UserRole.DEPT_OWNER, UserRole.ADMIN)),
                           db: Session = Depends(get_session)):
    rows = service.generate_for_proposal(db, user, proposal_id)
    db.commit()
    return rows


@riskqual_router.get("/proposals/{proposal_id}/risk-analysis",
                     response_model=list[AnalysisOut])
def list_risk_analyses(proposal_id: int,
                       user: User = Depends(require_any_authenticated()),
                       db: Session = Depends(get_session)):
    return service.list_analyses(db, user, proposal_id)


@riskqual_router.post("/risk-analyses/{analysis_id}/decision",
                      response_model=AnalysisOut)
def decide_risk_analysis(analysis_id: int, payload: DecisionRequest,
                         user: User = Depends(require_role(
                             UserRole.EVALUATOR, UserRole.ADMIN)),
                         db: Session = Depends(get_session)):
    row = service.decide(db, user, analysis_id,
                         payload.decision, payload.note)
    db.commit()
    return row
