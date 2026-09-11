from datetime import datetime, timedelta

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base, sa_enum
from app.models.audit import utcnow
from app.models.enums import DiscoverySource, InvitationStatus


class DiscoveredStartup(Base):
    __tablename__ = "discovered_startups"
    __table_args__ = (UniqueConstraint("challenge_id", "name",
                                       name="uq_discovered_challenge_name"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    challenge_id: Mapped[int] = mapped_column(
        ForeignKey("challenges.id", name="fk_discovered_challenge"),
        nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    website: Mapped[str] = mapped_column(String(255), nullable=False, default="")
    sector: Mapped[str] = mapped_column(String(100), nullable=False, default="")
    location: Mapped[str] = mapped_column(String(100), nullable=False, default="")
    source: Mapped[DiscoverySource] = mapped_column(sa_enum(DiscoverySource), nullable=False)
    relevance_score: Mapped[float] = mapped_column(Float, nullable=False)
    relevance_evidence: Mapped[str] = mapped_column(Text, nullable=False, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)


class Invitation(Base):
    __tablename__ = "invitations"

    id: Mapped[int] = mapped_column(primary_key=True)
    challenge_id: Mapped[int] = mapped_column(
        ForeignKey("challenges.id", name="fk_invitations_challenge"),
        nullable=False, index=True)
    discovered_startup_id: Mapped[int | None] = mapped_column(
        ForeignKey("discovered_startups.id", name="fk_invitations_discovered"),
        nullable=True)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    invite_code: Mapped[str] = mapped_column(String(64), nullable=False, unique=True, index=True)
    status: Mapped[InvitationStatus] = mapped_column(
        sa_enum(InvitationStatus), nullable=False, default=InvitationStatus.SENT)
    invited_by: Mapped[int] = mapped_column(
        ForeignKey("users.id", name="fk_invitations_invited_by"),
        nullable=False)
    registered_startup_id: Mapped[int | None] = mapped_column(
        ForeignKey("startups.id", name="fk_invitations_registered_startup"),
        nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: utcnow() + timedelta(days=14), nullable=False)
