from datetime import datetime

from sqlalchemy import (DateTime, Float, ForeignKey, Text, UniqueConstraint)
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base, sa_enum
from app.models.audit import utcnow
from app.models.enums import PaymentStatus


class PaymentRecord(Base):
    __tablename__ = "payments"
    __table_args__ = (
        UniqueConstraint("milestone_id", name="uq_payment_milestone"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    milestone_id: Mapped[int] = mapped_column(
        ForeignKey("milestones.id", name="fk_payments_milestone"),
        nullable=False, unique=True)
    amount: Mapped[float] = mapped_column(
        Float, nullable=False, default=0.0)
    status: Mapped[PaymentStatus] = mapped_column(
        sa_enum(PaymentStatus), nullable=False,
        default=PaymentStatus.INVOICED)
    invoiced_by: Mapped[int] = mapped_column(
        ForeignKey("users.id", name="fk_payments_invoiced_by"),
        nullable=False)
    approved_by: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", name="fk_payments_approved_by"),
        nullable=True)
    rejected_reason: Mapped[str | None] = mapped_column(
        Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, nullable=False)
