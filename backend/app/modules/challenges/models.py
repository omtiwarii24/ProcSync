from datetime import datetime

from sqlalchemy import JSON, DateTime, Float, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base, sa_enum
from app.models.audit import utcnow
from app.models.enums import (ChallengeStatus, CriterionOperator, CriterionType,
                              DomainTag)


class Challenge(Base):
    __tablename__ = "challenges"

    id: Mapped[int] = mapped_column(primary_key=True)
    department_id: Mapped[int] = mapped_column(
        ForeignKey("departments.id", name="fk_challenges_department"),
        nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    problem_statement: Mapped[str] = mapped_column(Text, nullable=False)
    baseline: Mapped[str] = mapped_column(Text, nullable=False, default="")
    target: Mapped[str] = mapped_column(Text, nullable=False, default="")
    domain: Mapped[DomainTag] = mapped_column(sa_enum(DomainTag), nullable=False)
    budget: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    status: Mapped[ChallengeStatus] = mapped_column(
        sa_enum(ChallengeStatus), nullable=False, default=ChallengeStatus.DRAFT)
    evaluation_weights: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    closes_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)


class EligibilityCriterion(Base):
    __tablename__ = "eligibility_criteria"

    id: Mapped[int] = mapped_column(primary_key=True)
    challenge_id: Mapped[int] = mapped_column(
        ForeignKey("challenges.id", name="fk_criteria_challenge"),
        nullable=False, index=True)
    criterion_type: Mapped[CriterionType] = mapped_column(sa_enum(CriterionType), nullable=False)
    operator: Mapped[CriterionOperator] = mapped_column(sa_enum(CriterionOperator), nullable=False)
    threshold: Mapped[float | None] = mapped_column(Float, nullable=True)
    is_auto_checkable: Mapped[bool] = mapped_column(default=True, nullable=False)
    waiver_allowed: Mapped[bool] = mapped_column(default=True, nullable=False)
    description: Mapped[str] = mapped_column(String(255), nullable=False, default="")
