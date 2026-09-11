from datetime import datetime

from sqlalchemy import JSON, DateTime, ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base, sa_enum
from app.models.audit import utcnow
from app.models.enums import RiskEquivalentDecision


class RiskEquivalentAnalysis(Base):
    __tablename__ = "risk_equivalent_analyses"
    __table_args__ = (
        UniqueConstraint("proposal_id", "criterion_id",
                         name="uq_riskqual_proposal_criterion"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    proposal_id: Mapped[int] = mapped_column(
        ForeignKey("proposals.id", name="fk_riskqual_proposal"),
        nullable=False, index=True)
    criterion_id: Mapped[int] = mapped_column(
        ForeignKey("eligibility_criteria.id", name="fk_riskqual_criterion"),
        nullable=False)
    underlying_risk: Mapped[str] = mapped_column(Text, nullable=False)
    alternative_evidence: Mapped[list] = mapped_column(
        JSON, default=list, nullable=False)
    residual_risk: Mapped[str] = mapped_column(String(10), nullable=False)
    safeguards: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    ai_enrichment: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    human_decision: Mapped[RiskEquivalentDecision] = mapped_column(
        sa_enum(RiskEquivalentDecision), nullable=False,
        default=RiskEquivalentDecision.PENDING)
    decided_by: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", name="fk_riskqual_decider"), nullable=True)
    decided_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, nullable=False)
