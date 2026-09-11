from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_session
from app.core.rbac import require_any_authenticated
from app.modules.auth.models import User
from app.modules.execution import service
from app.modules.execution.schemas import (
    ConstraintCreate, ConstraintOut, KPIOut, KPIPatch, KPICreate,
    MilestoneCreate, MilestoneOut, PaginatedConstraints, PaginatedKPIs,
    PaginatedMilestones, PaginatedRisks, RiskCreate, RiskOut, RiskPatch)

execution_router = APIRouter()


# ---- Milestones (nested under /pilots/{id}/) ----

@execution_router.post("/pilots/{pilot_id}/milestones",
                       response_model=MilestoneOut, status_code=201)
def create_milestone(pilot_id: int, payload: MilestoneCreate,
                     user: User = Depends(require_any_authenticated()),
                     db: Session = Depends(get_session)):
    ms = service.create_milestone(db, user, pilot_id, payload)
    db.commit()
    return ms


@execution_router.get("/pilots/{pilot_id}/milestones",
                      response_model=PaginatedMilestones)
def list_milestones(pilot_id: int, page: int = Query(1, ge=1),
                    size: int = Query(20, ge=1, le=100),
                    user: User = Depends(require_any_authenticated()),
                    db: Session = Depends(get_session)):
    return service.list_milestones(db, user, pilot_id, page, size)


@execution_router.post("/pilots/{pilot_id}/milestones/{milestone_id}/submit",
                       response_model=MilestoneOut)
def submit_milestone(pilot_id: int, milestone_id: int,
                     user: User = Depends(require_any_authenticated()),
                     db: Session = Depends(get_session)):
    ms = service.submit_milestone(db, user, pilot_id, milestone_id)
    db.commit()
    return ms


@execution_router.post("/pilots/{pilot_id}/milestones/{milestone_id}/verify",
                       response_model=MilestoneOut)
def verify_milestone(pilot_id: int, milestone_id: int,
                     user: User = Depends(require_any_authenticated()),
                     db: Session = Depends(get_session)):
    ms = service.verify_milestone(db, user, pilot_id, milestone_id)
    db.commit()
    return ms


# ---- KPIs ----

@execution_router.post("/pilots/{pilot_id}/kpis",
                       response_model=KPIOut, status_code=201)
def create_kpi(pilot_id: int, payload: KPICreate,
               user: User = Depends(require_any_authenticated()),
               db: Session = Depends(get_session)):
    kpi = service.create_kpi(db, user, pilot_id, payload)
    db.commit()
    return kpi


@execution_router.get("/pilots/{pilot_id}/kpis", response_model=PaginatedKPIs)
def list_kpis(pilot_id: int, page: int = Query(1, ge=1),
              size: int = Query(20, ge=1, le=100),
              user: User = Depends(require_any_authenticated()),
              db: Session = Depends(get_session)):
    return service.list_kpis(db, user, pilot_id, page, size)


@execution_router.patch("/pilots/{pilot_id}/kpis/{kpi_id}",
                        response_model=KPIOut)
def patch_kpi(pilot_id: int, kpi_id: int, payload: KPIPatch,
              user: User = Depends(require_any_authenticated()),
              db: Session = Depends(get_session)):
    kpi = service.patch_kpi(db, user, pilot_id, kpi_id, payload)
    db.commit()
    return kpi


# ---- Risks ----

@execution_router.post("/pilots/{pilot_id}/risks",
                       response_model=RiskOut, status_code=201)
def create_risk(pilot_id: int, payload: RiskCreate,
                user: User = Depends(require_any_authenticated()),
                db: Session = Depends(get_session)):
    risk = service.create_risk(db, user, pilot_id, payload)
    db.commit()
    return risk


@execution_router.get("/pilots/{pilot_id}/risks", response_model=PaginatedRisks)
def list_risks(pilot_id: int, page: int = Query(1, ge=1),
               size: int = Query(20, ge=1, le=100),
               user: User = Depends(require_any_authenticated()),
               db: Session = Depends(get_session)):
    return service.list_risks(db, user, pilot_id, page, size)


@execution_router.patch("/pilots/{pilot_id}/risks/{risk_id}",
                        response_model=RiskOut)
def patch_risk(pilot_id: int, risk_id: int, payload: RiskPatch,
               user: User = Depends(require_any_authenticated()),
               db: Session = Depends(get_session)):
    risk = service.patch_risk(db, user, pilot_id, risk_id, payload)
    db.commit()
    return risk


# ---- Constraints ----

@execution_router.post("/pilots/{pilot_id}/constraints",
                       response_model=ConstraintOut, status_code=201)
def create_constraint(pilot_id: int, payload: ConstraintCreate,
                      user: User = Depends(require_any_authenticated()),
                      db: Session = Depends(get_session)):
    constraint = service.create_constraint(db, user, pilot_id, payload)
    db.commit()
    return constraint


@execution_router.get("/pilots/{pilot_id}/constraints",
                      response_model=PaginatedConstraints)
def list_constraints(pilot_id: int, page: int = Query(1, ge=1),
                     size: int = Query(20, ge=1, le=100),
                     user: User = Depends(require_any_authenticated()),
                     db: Session = Depends(get_session)):
    return service.list_constraints(db, user, pilot_id, page, size)
