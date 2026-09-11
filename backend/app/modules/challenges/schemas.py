from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.models.enums import (ChallengeStatus, CriterionOperator, CriterionType,
                              DomainTag)

EVALUATION_WEIGHT_KEYS = {"impact", "cost_effectiveness", "technical_maturity",
                          "operational_readiness", "security_compliance",
                          "user_adoption", "scalability"}


def _validate_evaluation_weights(weights: dict[str, float] | None) -> dict[str, float] | None:
    if weights is None:
        return None
    bad_keys = set(weights) - EVALUATION_WEIGHT_KEYS
    if bad_keys:
        raise ValueError(
            f"evaluation_weights keys must be a subset of {sorted(EVALUATION_WEIGHT_KEYS)}; "
            f"invalid: {sorted(bad_keys)}")
    if abs(sum(weights.values()) - 100.0) > 0.01:
        raise ValueError(
            f"evaluation_weights values must sum to 100 (got {sum(weights.values())})")
    return weights


class ChallengeCreate(BaseModel):
    title: str = Field(min_length=4)
    problem_statement: str = Field(min_length=20, max_length=4000)
    baseline: str = ""
    target: str = ""
    domain: DomainTag
    budget: float = Field(default=0.0, ge=0)
    evaluation_weights: dict[str, float] | None = None
    closes_at: datetime | None = None

    @model_validator(mode="after")
    def _check_weights(self):
        _validate_evaluation_weights(self.evaluation_weights)
        return self


class ChallengeUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=4)
    problem_statement: str | None = Field(default=None, min_length=20, max_length=4000)
    baseline: str | None = None
    target: str | None = None
    domain: DomainTag | None = None
    budget: float | None = Field(default=None, ge=0)
    evaluation_weights: dict[str, float] | None = None
    closes_at: datetime | None = None

    @model_validator(mode="after")
    def _check_weights(self):
        _validate_evaluation_weights(self.evaluation_weights)
        return self


class ChallengeOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    department_id: int
    title: str
    problem_statement: str
    baseline: str
    target: str
    domain: DomainTag
    budget: float
    status: ChallengeStatus
    evaluation_weights: dict | None
    closes_at: datetime | None
    created_at: datetime


class CriterionCreate(BaseModel):
    criterion_type: CriterionType
    operator: CriterionOperator = CriterionOperator.GTE
    threshold: float | None = None
    waiver_allowed: bool = True
    description: str = ""


class CriterionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    challenge_id: int
    criterion_type: CriterionType
    operator: CriterionOperator
    threshold: float | None
    is_auto_checkable: bool
    waiver_allowed: bool
    description: str


class PaginatedChallenges(BaseModel):
    items: list[ChallengeOut]
    page: int
    size: int
    total: int


class PaginatedCriteria(BaseModel):
    items: list[CriterionOut]
    page: int
    size: int
    total: int
