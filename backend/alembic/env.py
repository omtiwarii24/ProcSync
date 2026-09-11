import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from logging.config import fileConfig

from alembic import context
from sqlalchemy import create_engine, pool

from app.core.config import settings
from app.core.database import Base

# Model imports — grows as tasks add models:
from app.models.audit import AuditLog  # noqa: F401
from app.modules.auth.models import User  # noqa: F401
from app.modules.orgs.models import Department, Startup  # noqa: F401
from app.modules.challenges.models import Challenge, EligibilityCriterion  # noqa: F401
from app.modules.proposals.models import EligibilityCheck, Proposal  # noqa: F401
from app.modules.pilots.models import Pilot  # noqa: F401
from app.modules.execution.models import (Constraint, KPI, Milestone,  # noqa: F401
                                          Risk)
from app.modules.payments.models import PaymentRecord  # noqa: F401
from app.modules.riskqual.models import RiskEquivalentAnalysis  # noqa: F401
from app.modules.discovery.models import DiscoveredStartup, Invitation  # noqa: F401
from app.modules.evidence.models import EvidenceItem, Validation  # noqa: F401

config = context.config
config.set_main_option("sqlalchemy.url", settings.database_url)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    context.configure(
        url=settings.database_url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = create_engine(settings.database_url, poolclass=pool.NullPool)
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
