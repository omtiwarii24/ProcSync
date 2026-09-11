from datetime import datetime

from sqlalchemy import JSON, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base, sa_enum
from app.models.audit import utcnow
from app.models.enums import (ConnectivityTier, ITMaturity, PowerReliability,
                              SettlementType, TerrainType)


class Department(Base):
    __tablename__ = "departments"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    code: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    connectivity_tier: Mapped[ConnectivityTier] = mapped_column(sa_enum(ConnectivityTier), nullable=False)
    power_reliability: Mapped[PowerReliability] = mapped_column(sa_enum(PowerReliability), nullable=False)
    it_maturity: Mapped[ITMaturity] = mapped_column(sa_enum(ITMaturity), nullable=False)
    settlement_type: Mapped[SettlementType] = mapped_column(sa_enum(SettlementType), nullable=False)
    terrain_type: Mapped[TerrainType] = mapped_column(sa_enum(TerrainType), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)


class Startup(Base):
    __tablename__ = "startups"

    id: Mapped[int] = mapped_column(primary_key=True)
    owner_user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", name="fk_startups_owner_user"),
        unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    dpiit_number: Mapped[str | None] = mapped_column(String(100), nullable=True)
    sectors: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    team_size: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    annual_turnover: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    runway_months: Mapped[int | None] = mapped_column(Integer, nullable=True)
    prior_deployments: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    description: Mapped[str] = mapped_column(Text, default="", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
