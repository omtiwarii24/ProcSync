from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.models.enums import PilotStatus


class PilotCreate(BaseModel):
    scope: str = Field(min_length=10)
    pilot_manager_id: int
    data_ip_terms: str = ""
    starts_at: datetime | None = None
    ends_at: datetime | None = None

    @model_validator(mode="after")
    def _check_dates(self):
        if self.starts_at is not None and self.ends_at is not None:
            if self.ends_at < self.starts_at:
                raise ValueError("ends_at must be on or after starts_at")
        return self


class PilotOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    proposal_id: int
    department_id: int
    startup_id: int
    pilot_manager_id: int
    scope: str
    status: PilotStatus
    terms_accepted: bool
    data_ip_terms: str
    starts_at: datetime | None
    ends_at: datetime | None
    failure_conditions: str | None
    lessons_draft: str | None
    created_at: datetime


class PaginatedPilots(BaseModel):
    items: list[PilotOut]
    page: int
    size: int
    total: int


# ---- Task K: pilot workflow extras (fail/terminate bodies + summary) ----

class FailRequest(BaseModel):
    failure_conditions: str = Field(min_length=20)


class TerminateRequest(BaseModel):
    reason: str = Field(min_length=10)


class PilotSummaryKPI(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    baseline: float
    target: float
    actual: float | None
    direction: str


class PilotSummaryMilestones(BaseModel):
    total: int
    by_status: dict[str, int]


class PilotSummaryPayments(BaseModel):
    total_amount: float
    disbursed_amount: float


class PilotSummaryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    pilot: PilotOut
    milestones: PilotSummaryMilestones
    kpis: list[PilotSummaryKPI]
    open_risks: int
    payments: PilotSummaryPayments
