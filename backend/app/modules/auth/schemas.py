from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.enums import (ConnectivityTier, ITMaturity, PowerReliability,
                              SettlementType, TerrainType, UserRole)


class DepartmentRegisterData(BaseModel):
    name: str = Field(min_length=2)
    code: str = Field(min_length=2, max_length=20)
    connectivity_tier: ConnectivityTier
    power_reliability: PowerReliability
    it_maturity: ITMaturity
    settlement_type: SettlementType
    terrain_type: TerrainType


class StartupRegisterData(BaseModel):
    name: str = Field(min_length=2)


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)
    full_name: str = Field(min_length=2)
    role: UserRole
    department: DepartmentRegisterData | None = None
    startup: StartupRegisterData | None = None


class RegisterWithInviteRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)
    full_name: str = Field(min_length=2)
    startup_name: str = Field(min_length=2)
    invite_code: str = Field(min_length=8)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    role: UserRole
    full_name: str
    is_active: bool


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
