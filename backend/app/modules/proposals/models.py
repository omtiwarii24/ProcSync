from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base, sa_enum
from app.models.audit import utcnow
from app.models.enums import CheckResult, GateType, ProposalStatus


class Proposal(Base):
    __tablename__ = "proposals"
    __table_args__ = (
        UniqueConstraint("challenge_id", "startup_id",
                         name="uq_proposal_challenge_startup"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    challenge_id: Mapped[int] = mapped_column(
        ForeignKey("challenges.id", name="fk_proposals_challenge"),
        nullable=False, index=True)
    startup_id: Mapped[int] = mapped_column(
        ForeignKey("startups.id", name="fk_proposals_startup"),
        nullable=False, index=True)
    status: Mapped[ProposalStatus] = mapped_column(
        sa_enum(ProposalStatus), nullable=False, default=ProposalStatus.SUBMITTED)
    technical_summary: Mapped[str] = mapped_column(Text, nullable=False)
    cost_estimate: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)


class EligibilityCheck(Base):
    __tablename__ = "eligibility_checks"

    id: Mapped[int] = mapped_column(primary_key=True)
    proposal_id: Mapped[int] = mapped_column(
        ForeignKey("proposals.id", name="fk_checks_proposal"),
        nullable=False, index=True)
    criterion_id: Mapped[int] = mapped_column(
        ForeignKey("eligibility_criteria.id", name="fk_checks_criterion"),
        nullable=False)
    result: Mapped[CheckResult] = mapped_column(sa_enum(CheckResult), nullable=False)
    checked_value: Mapped[float | None] = mapped_column(Float, nullable=True)
    waived_by: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", name="fk_checks_waived_by"), nullable=True)
    waiver_justification: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)


class EvaluationPanel(Base):
    __tablename__ = "evaluation_panels"

    id: Mapped[int] = mapped_column(primary_key=True)
    challenge_id: Mapped[int] = mapped_column(
        ForeignKey("challenges.id", name="fk_panels_challenge"),
        nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)


class EvaluationPanelMember(Base):
    __tablename__ = "evaluation_panel_members"
    __table_args__ = (
        UniqueConstraint("panel_id", "evaluator_user_id",
                         name="uq_panel_evaluator"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    panel_id: Mapped[int] = mapped_column(
        ForeignKey("evaluation_panels.id", name="fk_panelmembers_panel"),
        nullable=False, index=True)
    evaluator_user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", name="fk_panelmembers_evaluator"),
        nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)


class ProposalScore(Base):
    __tablename__ = "proposal_scores"
    __table_args__ = (
        UniqueConstraint("proposal_id", "evaluator_user_id", "gate", "dimension",
                         name="uq_score_identity"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    proposal_id: Mapped[int] = mapped_column(
        ForeignKey("proposals.id", name="fk_scores_proposal"),
        nullable=False, index=True)
    evaluator_user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", name="fk_scores_evaluator"),
        nullable=False)
    gate: Mapped[GateType] = mapped_column(sa_enum(GateType), nullable=False)
    dimension: Mapped[str] = mapped_column(String(30), nullable=False)
    raw_score: Mapped[float] = mapped_column(Float, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
