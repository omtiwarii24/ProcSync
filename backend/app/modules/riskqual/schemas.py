from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import RiskEquivalentDecision


class DecisionRequest(BaseModel):
    decision: Literal["ACCEPTED", "REJECTED"]
    note: str = Field(min_length=10)


class AnalysisOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    proposal_id: int
    criterion_id: int
    underlying_risk: str
    alternative_evidence: list
    residual_risk: str
    safeguards: list
    ai_enrichment: dict | None
    human_decision: RiskEquivalentDecision
    decided_by: int | None
    decided_at: datetime | None
    created_at: datetime
