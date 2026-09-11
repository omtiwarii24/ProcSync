from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_session
from app.core.rbac import get_current_user, require_role
from app.models.enums import UserRole
from app.modules.auth.models import User
from app.modules.orgs import service
from app.modules.orgs.models import Department
from app.modules.orgs.schemas import (DepartmentContextUpdate, DepartmentCreate,
                                      DepartmentOut, PaginatedDepartments,
                                      StartupOut, StartupUpdate)

orgs_router = APIRouter()


@orgs_router.get("/departments", response_model=PaginatedDepartments)
def list_departments(page: int = Query(1, ge=1), size: int = Query(20, ge=1, le=100),
                     user: User = Depends(get_current_user),
                     db: Session = Depends(get_session)):
    q = db.query(Department).order_by(Department.id)
    total = q.count()
    items = q.offset((page - 1) * size).limit(size).all()
    return {"items": items, "page": page, "size": size, "total": total}


@orgs_router.get("/departments/{dept_id}", response_model=DepartmentOut)
def get_department(dept_id: int, user: User = Depends(get_current_user),
                   db: Session = Depends(get_session)):
    return service.get_department(db, dept_id)


@orgs_router.post("/departments", response_model=DepartmentOut, status_code=201)
def create_department(payload: DepartmentCreate,
                     user: User = Depends(require_role(UserRole.ADMIN)),
                     db: Session = Depends(get_session)):
    dept = service.create_department(
        db, actor_user_id=user.id, name=payload.name, code=payload.code,
        context=payload.model_dump(exclude={"name", "code"}))
    db.commit()
    return dept


@orgs_router.patch("/departments/{dept_id}/context", response_model=DepartmentOut)
def update_context(dept_id: int, payload: DepartmentContextUpdate,
                   user: User = Depends(require_role(UserRole.ADMIN)),
                   db: Session = Depends(get_session)):
    dept = service.update_department_context(db, user.id, dept_id, payload)
    db.commit()
    return dept


@orgs_router.get("/startups/me", response_model=StartupOut)
def my_startup(user: User = Depends(require_role(UserRole.STARTUP)),
               db: Session = Depends(get_session)):
    return service.get_startup_by_owner(db, user.id)


@orgs_router.put("/startups/me", response_model=StartupOut)
def update_my_startup(payload: StartupUpdate,
                      user: User = Depends(require_role(UserRole.STARTUP)),
                      db: Session = Depends(get_session)):
    startup = service.get_startup_by_owner(db, user.id)
    service.update_startup(db, startup, payload, actor_user_id=user.id)
    db.commit()
    return startup
