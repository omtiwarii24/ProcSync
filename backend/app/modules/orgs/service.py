from sqlalchemy.orm import Session

from app.core.audit import audit
from app.core.errors import AppError, NotFound
from app.models.enums import AuditAction
from app.modules.orgs.models import Department, Startup
from app.modules.orgs.schemas import (DepartmentContextUpdate, DepartmentCreate,
                                      StartupUpdate)


def create_department(db: Session, actor_user_id: int, name: str, code: str,
                      context: dict) -> Department:
    exists = db.query(Department).filter(
        (Department.name == name) | (Department.code == code)).first()
    if exists is not None:
        raise AppError("Department name or code already registered",
                       status_code=409, code="DEPARTMENT_TAKEN")
    dept = Department(name=name, code=code, **context)
    db.add(dept)
    db.flush()
    audit(db, user_id=actor_user_id, action=AuditAction.CREATE,
          entity_type="Department", entity_id=str(dept.id),
          new={"name": name, "code": code, **context})
    return dept


def get_department(db: Session, dept_id: int) -> Department:
    dept = db.get(Department, dept_id)
    if dept is None:
        raise NotFound(f"Department {dept_id} not found")
    return dept


CONTEXT_FIELDS = ("connectivity_tier", "power_reliability", "it_maturity",
                 "settlement_type", "terrain_type")


def update_department_context(db: Session, admin_user_id: int, dept_id: int,
                              payload: DepartmentContextUpdate) -> Department:
    dept = get_department(db, dept_id)
    data = payload.model_dump(exclude_none=True)
    if data:
        old = {f: getattr(dept, f).value for f in CONTEXT_FIELDS}
        for field, value in data.items():
            setattr(dept, field, value)
        audit(db, user_id=admin_user_id, action=AuditAction.UPDATE,
              entity_type="Department", entity_id=str(dept.id), old=old,
              new={f: (v.value if hasattr(v, "value") else v)
                   for f, v in data.items()})
    return dept


def get_startup_by_owner(db: Session, user_id: int) -> Startup:
    startup = db.query(Startup).filter(Startup.owner_user_id == user_id).first()
    if startup is None:
        raise NotFound("Startup profile not found for this user")
    return startup


def update_startup(db: Session, startup: Startup, payload: StartupUpdate,
                   actor_user_id: int) -> Startup:
    data = payload.model_dump(exclude_none=True)
    if data:
        old = {"annual_turnover": startup.annual_turnover,
               "dpiit_number": startup.dpiit_number,
               "prior_deployments": startup.prior_deployments,
               "name": startup.name}
        for field, value in data.items():
            setattr(startup, field, value)
        audit(db, user_id=actor_user_id, action=AuditAction.UPDATE,
              entity_type="Startup", entity_id=str(startup.id), old=old, new=data)
    return startup
