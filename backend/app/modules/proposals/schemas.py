from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import CheckResult, ProposalStatus

ScoreDimension = Literal["impact", "cost_effectiveness", "technical_maturity",
                         "operational_readiness", "security_compliance",
                         "user_adoption", "scalability"]
ScoreGate = Literal["GATE1", "GATE2"]


class ProposalCreate(BaseModel):
    technical_summary: str = Field(min_length=20)
    cost_estimate: float = Field(default=0.0, ge=0)


class CheckOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    proposal_id: int
    criterion_id: int
    result: CheckResult
    checked_value: float | None
    waived_by: int | None
    waiver_justification: str | None


class ProposalOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    challenge_id: int
    startup_id: int
    status: ProposalStatus
    technical_summary: str
    cost_estimate: float
    created_at: datetime


class ProposalWithChecksOut(ProposalOut):
    checks: list[CheckOut] = []


class PaginatedProposals(BaseModel):
    items: list[ProposalOut]
    page: int
    size: int
    total: int


class WaiveRequest(BaseModel):
    justification: str = Field(min_length=10)


class PanelCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)


class PanelOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    challenge_id: int
    name: str
    created_at: datetime


class PanelMemberAdd(BaseModel):
    evaluator_user_id: int


class PanelMemberOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    panel_id: int
    evaluator_user_id: int
    created_at: datetime


class ScoreCreate(BaseModel):
    gate: ScoreGate
    dimension: ScoreDimension
    raw_score: float = Field(ge=0, le=10)


class ScoreOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    proposal_id: int
    evaluator_user_id: int
    gate: ScoreGate
    dimension: ScoreDimension
    raw_score: float
    created_at: datetime


class PaginatedScores(BaseModel):
    items: list[ScoreOut]
    page: int
    size: int
    total: int


class RankingItem(BaseModel):
    proposal_id: int
    startup_id: int
    gate1_score: float
    gate2_score: float
    total: float


class RankingOut(BaseModel):
    items: list[RankingItem]
    weights: dict[str, float]


class RejectRequest(BaseModel):
    reason: str = Field(min_length=10)


class StartEvaluationOut(BaseModel):
    moved: int
