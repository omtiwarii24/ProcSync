from datetime import datetime
from enum import Enum

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base, sa_enum
from app.models.audit import utcnow
from app.models.enums import ConstraintType

try:
    # Task H owns the enums.py append (PilotStatus + MilestoneStatus).
    # Normal path once the wave lands; fallback below covers collect-only
    # time when the parallel agent has not appended it yet.
    from app.models.enums import MilestoneStatus
except ImportError:  # pragma: no cover - parallel-wave fallback only
    class MilestoneStatus(str, Enum):
        PENDING = "PENDING"
        SUBMITTED = "SUBMITTED"
        VERIFIED = "VERIFIED"
        PAID = "PAID"


class Milestone(Base):
    __tablename__ = "milestones"

    id: Mapped[int] = mapped_column(primary_key=True)
    pilot_id: Mapped[int] = mapped_column(
        ForeignKey("pilots.id", name="fk_milestones_pilot"),
        nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    amount: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    due_date: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True)
    status: Mapped[MilestoneStatus] = mapped_column(
        sa_enum(MilestoneStatus), nullable=False, default=MilestoneStatus.PENDING)
    safety_critical: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False)
    submitted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True)
    verified_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, nullable=False)


class KPI(Base):
    __tablename__ = "kpis"

    id: Mapped[int] = mapped_column(primary_key=True)
    pilot_id: Mapped[int] = mapped_column(
        ForeignKey("pilots.id", name="fk_kpis_pilot"),
        nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    definition: Mapped[str] = mapped_column(Text, nullable=False, default="")
    unit: Mapped[str] = mapped_column(String(50), nullable=False, default="")
    baseline: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    target: Mapped[float] = mapped_column(Float, nullable=False)
    actual: Mapped[float | None] = mapped_column(Float, nullable=True)
    direction: Mapped[str] = mapped_column(String(6), nullable=False)
    safety_critical: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, nullable=False)


class Risk(Base):
    __tablename__ = "risks"

    id: Mapped[int] = mapped_column(primary_key=True)
    pilot_id: Mapped[int] = mapped_column(
        ForeignKey("pilots.id", name="fk_risks_pilot"),
        nullable=False, index=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[str] = mapped_column(String(50), nullable=False, default="")
    likelihood: Mapped[str] = mapped_column(
        String(10), nullable=False, default="MEDIUM")
    impact: Mapped[str] = mapped_column(
        String(10), nullable=False, default="MEDIUM")
    mitigation: Mapped[str] = mapped_column(Text, nullable=False, default="")
    residual: Mapped[str] = mapped_column(Text, nullable=False, default="")
    is_critical: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False)
    resolved: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, nullable=False)


class Constraint(Base):
    __tablename__ = "constraints"

    id: Mapped[int] = mapped_column(primary_key=True)
    pilot_id: Mapped[int] = mapped_column(
        ForeignKey("pilots.id", name="fk_constraints_pilot"),
        nullable=False, index=True)
    constraint_type: Mapped[ConstraintType] = mapped_column(
        sa_enum(ConstraintType), nullable=False)
    context_value: Mapped[str] = mapped_column(Text, nullable=False, default="")
    notes: Mapped[str] = mapped_column(Text, nullable=False, default="")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, nullable=False)
