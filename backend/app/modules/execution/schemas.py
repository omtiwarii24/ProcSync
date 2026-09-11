from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import ConstraintType

try:
    from app.models.enums import MilestoneStatus
except ImportError:  # pragma: no cover - parallel-wave fallback only
    from app.modules.execution.models import MilestoneStatus


class MilestoneCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    amount: float = Field(default=0.0, ge=0)
    due_date: datetime | None = None
    safety_critical: bool = False


class MilestoneOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    pilot_id: int
    title: str
    amount: float
    due_date: datetime | None
    status: MilestoneStatus
    safety_critical: bool
    submitted_at: datetime | None
    verified_at: datetime | None
    created_at: datetime


class PaginatedMilestones(BaseModel):
    items: list[MilestoneOut]
    page: int
    size: int
    total: int


Direction = Literal["HIGHER", "LOWER"]


class KPICreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    definition: str = ""
    unit: str = ""
    baseline: float = 0.0
    target: float
    direction: Direction
    safety_critical: bool = False


class KPIPatch(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    definition: str | None = None
    unit: str | None = None
    baseline: float | None = None
    target: float | None = None
    actual: float | None = None
    direction: Direction | None = None
    safety_critical: bool | None = None


class KPIOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    pilot_id: int
    name: str
    definition: str
    unit: str
    baseline: float
    target: float
    actual: float | None
    direction: str
    safety_critical: bool
    created_at: datetime


class PaginatedKPIs(BaseModel):
    items: list[KPIOut]
    page: int
    size: int
    total: int


class RiskCreate(BaseModel):
    description: str = Field(min_length=1)
    category: str = ""
    likelihood: str = "MEDIUM"
    impact: str = "MEDIUM"
    mitigation: str = ""
    residual: str = ""
    is_critical: bool = False


class RiskPatch(BaseModel):
    description: str | None = Field(default=None, min_length=1)
    category: str | None = None
    likelihood: str | None = None
    impact: str | None = None
    mitigation: str | None = None
    residual: str | None = None
    is_critical: bool | None = None
    resolved: bool | None = None


class RiskOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    pilot_id: int
    description: str
    category: str
    likelihood: str
    impact: str
    mitigation: str
    residual: str
    is_critical: bool
    resolved: bool
    created_at: datetime


class PaginatedRisks(BaseModel):
    items: list[RiskOut]
    page: int
    size: int
    total: int


class ConstraintCreate(BaseModel):
    constraint_type: ConstraintType
    context_value: str = ""
    notes: str = ""


class ConstraintOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    pilot_id: int
    constraint_type: ConstraintType
    context_value: str
    notes: str
    created_at: datetime


class PaginatedConstraints(BaseModel):
    items: list[ConstraintOut]
    page: int
    size: int
    total: int
