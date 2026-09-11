import os
from pathlib import Path

os.environ["DATABASE_URL"] = "postgresql://postgres:postgres@localhost:15433/govinnovate_test"
os.environ.setdefault("ENABLE_RBAC_PROBES", "1")

import pytest
from sqlalchemy import inspect, text

from app.core.database import Base, SessionLocal, engine

BACKEND_DIR = Path(__file__).resolve().parent


@pytest.fixture(scope="session", autouse=True)
def _run_migrations():
    from alembic import command
    from alembic.config import Config

    cfg = Config(str(BACKEND_DIR / "alembic.ini"))
    command.upgrade(cfg, "head")
    yield


@pytest.fixture(scope="function", autouse=True)
def clean_db():
    yield
    insp = inspect(engine)
    tables = [t for t in insp.get_table_names() if t != "alembic_version"]
    if tables:
        with SessionLocal() as s:
            s.execute(text(f"TRUNCATE {', '.join(tables)} RESTART IDENTITY CASCADE"))
            s.commit()


@pytest.fixture(scope="function")
def session():
    s = SessionLocal()
    try:
        yield s
    finally:
        s.close()
