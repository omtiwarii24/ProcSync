from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import EvidenceType, ValidationStatus


class EvidenceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    pilot_id: int
    milestone_id: int | None
    kpi_id: int | None
    evidence_type: EvidenceType
    title: str
    filename: str | None = None
    uploaded_by: int
    status: ValidationStatus
    extracted_data: dict | None
    ai_confidence: float | None
    source_trace: dict | None
    safety_critical: bool
    created_at: datetime


class PaginatedEvidence(BaseModel):
    items: list[EvidenceOut]
    page: int
    size: int
    total: int


class ValidateBody(BaseModel):
    verdict: Literal["VERIFIED", "REJECTED"]
    notes: str = ""
    safety_critical: bool | None = None
