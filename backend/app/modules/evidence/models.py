from datetime import datetime
from pathlib import Path

from sqlalchemy import JSON, Boolean, DateTime, Float, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base, sa_enum
from app.models.audit import utcnow
from app.models.enums import EvidenceType, ValidationStatus


class EvidenceItem(Base):
    __tablename__ = "evidence_items"

    id: Mapped[int] = mapped_column(primary_key=True)
    pilot_id: Mapped[int] = mapped_column(
        ForeignKey("pilots.id", name="fk_evidence_pilot"),
        nullable=False, index=True)
    milestone_id: Mapped[int | None] = mapped_column(
        ForeignKey("milestones.id", name="fk_evidence_milestone"),
        nullable=True)
    kpi_id: Mapped[int | None] = mapped_column(
        ForeignKey("kpis.id", name="fk_evidence_kpi"), nullable=True)
    evidence_type: Mapped[EvidenceType] = mapped_column(
        sa_enum(EvidenceType), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    file_path: Mapped[str] = mapped_column(String(512), nullable=False)
    uploaded_by: Mapped[int] = mapped_column(
        ForeignKey("users.id", name="fk_evidence_uploader"), nullable=False)
    status: Mapped[ValidationStatus] = mapped_column(
        sa_enum(ValidationStatus), nullable=False,
        default=ValidationStatus.UNVERIFIED)
    extracted_data: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    ai_confidence: Mapped[float | None] = mapped_column(Float, nullable=True)
    source_trace: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    safety_critical: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, nullable=False)

    @property
    def filename(self) -> str:
        # Basename only — the absolute server path never leaves the backend.
        return Path(self.file_path).name


class Validation(Base):
    __tablename__ = "validations"

    id: Mapped[int] = mapped_column(primary_key=True)
    evidence_item_id: Mapped[int] = mapped_column(
        ForeignKey("evidence_items.id", name="fk_validations_evidence"),
        nullable=False, index=True)
    validator_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", name="fk_validations_validator"),
        nullable=True)
    verdict: Mapped[str] = mapped_column(String(10), nullable=False)
    method: Mapped[str] = mapped_column(
        String(30), nullable=False, default="manual")
    auto_approved: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False)
    notes: Mapped[str] = mapped_column(Text, nullable=False, default="")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, nullable=False)
