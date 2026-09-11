from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr

from app.models.enums import DiscoverySource, InvitationStatus


class DiscoveredStartupOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    challenge_id: int
    name: str
    website: str
    sector: str
    location: str
    source: DiscoverySource
    relevance_score: float
    relevance_evidence: str
    created_at: datetime


class InvitationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    challenge_id: int
    discovered_startup_id: int | None
    email: str
    invite_code: str
    status: InvitationStatus
    invited_by: int
    registered_startup_id: int | None
    created_at: datetime
    expires_at: datetime


class InvitationCreate(BaseModel):
    discovered_startup_id: int
    email: EmailStr


class PaginatedDiscoveredStartups(BaseModel):
    items: list[DiscoveredStartupOut]
    page: int
    size: int
    total: int


class PaginatedInvitations(BaseModel):
    items: list[InvitationOut]
    page: int
    size: int
    total: int
