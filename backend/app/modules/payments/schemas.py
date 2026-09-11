from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import PaymentStatus


class RejectPayment(BaseModel):
    reason: str = Field(min_length=10)


class PaymentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    milestone_id: int
    amount: float
    status: PaymentStatus
    invoiced_by: int
    approved_by: int | None
    rejected_reason: str | None
    created_at: datetime


class PaginatedPayments(BaseModel):
    items: list[PaymentOut]
    page: int
    size: int
    total: int
