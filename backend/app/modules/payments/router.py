from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_session
from app.core.rbac import require_any_authenticated
from app.modules.auth.models import User
from app.modules.payments import service
from app.modules.payments.schemas import (
    PaginatedPayments, PaymentOut, RejectPayment)

payments_router = APIRouter()


@payments_router.post("/milestones/{milestone_id}/invoice",
                      response_model=PaymentOut, status_code=201)
def invoice_milestone(milestone_id: int,
                      user: User = Depends(require_any_authenticated()),
                      db: Session = Depends(get_session)):
    payment = service.invoice_milestone(db, user, milestone_id)
    db.commit()
    return payment


@payments_router.post("/payments/{payment_id}/approve",
                      response_model=PaymentOut)
def approve_payment(payment_id: int,
                    user: User = Depends(require_any_authenticated()),
                    db: Session = Depends(get_session)):
    payment = service.approve_payment(db, user, payment_id)
    db.commit()
    return payment


@payments_router.post("/payments/{payment_id}/disburse",
                      response_model=PaymentOut)
def disburse_payment(payment_id: int,
                     user: User = Depends(require_any_authenticated()),
                     db: Session = Depends(get_session)):
    payment = service.disburse_payment(db, user, payment_id)
    db.commit()
    return payment


@payments_router.post("/payments/{payment_id}/reject",
                      response_model=PaymentOut)
def reject_payment(payment_id: int, payload: RejectPayment,
                   user: User = Depends(require_any_authenticated()),
                   db: Session = Depends(get_session)):
    payment = service.reject_payment(db, user, payment_id, payload)
    db.commit()
    return payment


@payments_router.get("/pilots/{pilot_id}/payments",
                     response_model=PaginatedPayments)
def list_payments(pilot_id: int, page: int = Query(1, ge=1),
                  size: int = Query(20, ge=1, le=100),
                  user: User = Depends(require_any_authenticated()),
                  db: Session = Depends(get_session)):
    return service.list_payments(db, user, pilot_id, page, size)
