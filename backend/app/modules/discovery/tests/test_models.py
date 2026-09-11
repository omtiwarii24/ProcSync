"""Metadata-level tests for discovery + invitation models (no HTTP, no DB)."""
from datetime import datetime, timedelta

from sqlalchemy import CheckConstraint, UniqueConstraint
from sqlalchemy import Enum as SAEnum

from app.core.database import Base, sa_enum
from app.models.audit import utcnow
from app.models.enums import DiscoverySource, InvitationStatus
from app.modules.discovery.models import DiscoveredStartup, Invitation


def test_enums_importable_with_frozen_values():
    assert [m.value for m in InvitationStatus] == ["SENT", "REGISTERED", "EXPIRED"]
    assert [m.value for m in DiscoverySource] == ["gemini_search", "seed_index"]


def test_discovered_startup_table_in_metadata():
    assert DiscoveredStartup.__tablename__ == "discovered_startups"
    assert "discovered_startups" in Base.metadata.tables
    uq = [c for c in DiscoveredStartup.__table__.constraints
          if isinstance(c, UniqueConstraint)]
    assert any(c.name == "uq_discovered_challenge_name" for c in uq)


def test_discovered_startup_columns():
    cols = DiscoveredStartup.__table__.columns
    assert set(cols.keys()) == {"id", "challenge_id", "name", "website", "sector",
                                "location", "source", "relevance_score",
                                "relevance_evidence", "created_at"}
    assert cols["source"].nullable is False
    assert cols["relevance_score"].nullable is False
    assert isinstance(cols["source"].type, SAEnum)
    fks = list(cols["challenge_id"].foreign_keys)
    assert len(fks) == 1 and fks[0].name == "fk_discovered_challenge"
    assert cols["challenge_id"].index is True
    checks = [c for c in DiscoveredStartup.__table__.constraints
              if isinstance(c, CheckConstraint)]
    assert any(c.name == "discoverysource" for c in checks)


def test_invitation_table_in_metadata():
    assert Invitation.__tablename__ == "invitations"
    assert "invitations" in Base.metadata.tables


def test_invitation_columns():
    cols = Invitation.__table__.columns
    assert set(cols.keys()) == {"id", "challenge_id", "discovered_startup_id",
                                "email", "invite_code", "status", "invited_by",
                                "registered_startup_id", "created_at", "expires_at"}
    assert isinstance(cols["status"].type, SAEnum)
    assert cols["invite_code"].unique and cols["invite_code"].index
    assert cols["invite_code"].type.length == 64
    fks = {fk.name: (fk.target_fullname) for c in cols.values()
           for fk in c.foreign_keys}
    assert fks == {
        "fk_invitations_challenge": "challenges.id",
        "fk_invitations_discovered": "discovered_startups.id",
        "fk_invitations_invited_by": "users.id",
        "fk_invitations_registered_startup": "startups.id",
    }
    assert cols["discovered_startup_id"].nullable is True
    assert cols["registered_startup_id"].nullable is True
    checks = [c for c in Invitation.__table__.constraints
              if isinstance(c, CheckConstraint)]
    assert any(c.name == "invitationstatus" for c in checks)


def test_invitation_expiry_default_14_days():
    col = Invitation.__table__.columns["expires_at"]
    default = col.default.arg
    assert callable(default)
    delta: timedelta = default(None) - utcnow()  # None ctx — lambda ignores it
    assert timedelta(days=13, hours=23) < delta <= timedelta(days=14)


def test_sa_enum_factory_creates_check_constraints():
    col_type = sa_enum(DiscoverySource)
    assert col_type.create_constraint is True and col_type.native_enum is False
    assert col_type.enums == ["gemini_search", "seed_index"]
