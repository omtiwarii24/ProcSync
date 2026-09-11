from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import (ConnectivityTier, ITMaturity, PowerReliability,
                              SettlementType, TerrainType)


class DepartmentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    code: str
    connectivity_tier: ConnectivityTier
    power_reliability: PowerReliability
    it_maturity: ITMaturity
    settlement_type: SettlementType
    terrain_type: TerrainType


class DepartmentCreate(BaseModel):
    name: str = Field(min_length=2)
    code: str = Field(min_length=2, max_length=20)
    connectivity_tier: ConnectivityTier
    power_reliability: PowerReliability
    it_maturity: ITMaturity
    settlement_type: SettlementType
    terrain_type: TerrainType


class DepartmentContextUpdate(BaseModel):
    connectivity_tier: ConnectivityTier | None = None
    power_reliability: PowerReliability | None = None
    it_maturity: ITMaturity | None = None
    settlement_type: SettlementType | None = None
    terrain_type: TerrainType | None = None


class StartupOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    dpiit_number: str | None
    sectors: list
    team_size: int
    annual_turnover: float
    runway_months: int | None
    prior_deployments: int
    description: str


class StartupUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2)
    dpiit_number: str | None = None
    sectors: list[str] | None = None
    team_size: int | None = Field(default=None, ge=1)
    annual_turnover: float | None = Field(default=None, ge=0)
    runway_months: int | None = Field(default=None, ge=0)
    prior_deployments: int | None = Field(default=None, ge=0)
    description: str | None = None


class PaginatedDepartments(BaseModel):
    items: list[DepartmentOut]
    page: int
    size: int
    total: int
