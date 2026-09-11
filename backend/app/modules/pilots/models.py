from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base, sa_enum
from app.models.audit import utcnow
from app.models.enums import PilotStatus


class Pilot(Base):
    __tablename__ = "pilots"
    __table_args__ = (
        UniqueConstraint("proposal_id", name="uq_pilot_proposal"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    proposal_id: Mapped[int] = mapped_column(
        ForeignKey("proposals.id", name="fk_pilots_proposal"),
        nullable=False, index=True)
    department_id: Mapped[int] = mapped_column(
        ForeignKey("departments.id", name="fk_pilots_department"),
        nullable=False, index=True)
    startup_id: Mapped[int] = mapped_column(
        ForeignKey("startups.id", name="fk_pilots_startup"),
        nullable=False, index=True)
    pilot_manager_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", name="fk_pilots_manager"),
        nullable=False, index=True)
    scope: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[PilotStatus] = mapped_column(
        sa_enum(PilotStatus), nullable=False, default=PilotStatus.DRAFT)
    terms_accepted: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False)
    data_ip_terms: Mapped[str] = mapped_column(
        Text, nullable=False, default="")
    starts_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True)
    ends_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True)
    failure_conditions: Mapped[str | None] = mapped_column(
        Text, nullable=True)
    lessons_draft: Mapped[str | None] = mapped_column(
        Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, nullable=False)
