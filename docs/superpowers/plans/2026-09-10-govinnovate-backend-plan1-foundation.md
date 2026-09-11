# GovInnovate Backend — Plan 1: Foundation + Identity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the GovInnovate backend foundation (Docker Postgres + pgvector, project scaffold, config, Alembic migrations) and the complete auth identity layer (register/login/me, bcrypt, JWT, RBAC dependency system) with the audit log table and append-only guarantee in place.

**Architecture:** Modular monolith per spec §3: `app/core/` for cross-cutting infrastructure, `app/modules/<domain>/` for domain packages (models.py, schemas.py, service.py, router.py each). This plan covers spec §13 phases 1–2 only; later plans build domain modules on top of this foundation.

**Tech Stack:** Python 3.14, FastAPI, SQLAlchemy 2.x (DeclarativeBase style), Alembic, PostgreSQL 16 + pgvector, passlib[bcrypt], PyJWT, pydantic-settings, pytest + httpx.

**Spec:** `docs/superpowers/specs/2026-09-10-govinnovate-backend-design.md` — executor reads both. Sections referenced below: §2 (stack), §3 (structure), §4 (schema — users/departments/startups/audit_logs entities and all domain enums), §5 (auth & RBAC), §10 (audit), §11 (errors), §12 (testing).

## Global Constraints

- DB connection string: `postgresql://postgres:postgres@localhost:15433/govinnovate` (test DB: `govinnovate_test`, same server) — spec §2.
- JWT: HS256, 8h (480 min) expiry. Claims: `sub` (string user id), `role`, `portal` (`"A"` or `"B"`) — spec §5.
- Roles (exactly 7): `STARTUP, DEPT_OWNER, PILOT_MANAGER, EVALUATOR, PROCUREMENT_AUTHORITY, FINANCE, ADMIN` — spec §4.
- Portal map: STARTUP → `"A"`; every other role → `"B"` — spec §5.
- Password hashing: bcrypt via passlib. One user = one role — spec §4.
- audit_logs is append-only: Postgres rule blocks UPDATE/DELETE — spec §10.
- Every mutating service call writes an AuditLog via the single `audit()` helper — spec §10.
- Error envelope: `{"detail": <msg>, "code": <str>, "context": {...}?}` — spec §11.
- Domain enums (spec §4) live in `app/models/enums.py`: UserRole, Portal, AuditAction, DomainTag, ConnectivityTier, PowerReliability, ITMaturity, SettlementType, TerrainType, EvidenceType, ValidationStatus, DecisionLabel (exactly 4 values), ConstraintType.
- ADMIN users are created only via seed script (later plan) — the register endpoint must reject role=ADMIN — spec §5.
- Tests run against the mock/stub layer only; no network. Test DB schema is created via Alembic migrations run per session — spec §12.
- Commit style: conventional commits (`feat:`, `fix:`, `test:`, `chore:`, `docs:`).
- Working directory for every command: `backend/`. Shell is PowerShell 5.1 (`.\.venv\Scripts\...`).

---

### Task 1: Docker Compose + project scaffold + pinned requirements

**Files:**
- Create: `backend/docker-compose.yml`
- Create: `backend/requirements.txt`
- Create: `backend/.env.example`
- Create: `backend/.env` (gitignored, real local config)
- Create: `backend/.gitignore`
- Create: `backend/pytest.ini`
- Create: `backend/app/__init__.py`
- Create: `backend/app/main.py`
- Create: `backend/app/core/__init__.py`
- Create: `backend/scripts/__init__.py` (empty; seed.py comes in a later plan)
- Test: `backend/tests/__init__.py`
- Test: `backend/tests/test_health.py`

**Interfaces:**
- Consumes: nothing (first task).
- Produces: runnable FastAPI app with `GET /api/health` → `{"status": "ok"}`; docker-compose `db` service on host port 15433 with pgvector; installable requirements on Python 3.14.

- [ ] **Step 1: Write docker-compose.yml**

```yaml
# backend/docker-compose.yml
services:
  db:
    image: pgvector/pgvector:pg16
    container_name: govinnovate-db
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: govinnovate
    ports:
      - "15433:5432"
    volumes:
      - govinnovate_pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d govinnovate"]
      interval: 5s
      timeout: 5s
      retries: 10

volumes:
  govinnovate_pgdata:
```

`pgvector/pgvector:pg16` (not plain postgres:16) so the `vector` extension ships in the image — spec §2 requires pgvector.

- [ ] **Step 2: Write requirements.txt (pinned)**

```
# backend/requirements.txt
fastapi==0.115.12
uvicorn[standard]==0.34.2
sqlalchemy==2.0.40
alembic==1.15.2
psycopg2-binary==2.9.10
pydantic==2.11.3
pydantic-settings==2.9.1
email-validator==2.2.0
python-dotenv==1.1.0
passlib[bcrypt]==1.7.4
bcrypt==4.0.1
PyJWT==2.10.1
python-multipart==0.0.20
httpx==0.28.1
pytest==8.3.5
```

bcrypt pinned to 4.0.1: passlib 1.7.4 is incompatible with bcrypt ≥ 4.1 (version-detection `__about__` error). If resolution fails on Python 3.14, keep this exact pair and report.

- [ ] **Step 3: Write .env.example, .env, .gitignore**

```dotenv
# backend/.env.example
DATABASE_URL=postgresql://postgres:postgres@localhost:15433/govinnovate
TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:15433/govinnovate_test
JWT_SECRET=change-me-in-prod
JWT_EXPIRE_MINUTES=480
AI_PROVIDER=mock
GEMINI_API_KEY=
```

`.env`: copy of the above with `JWT_SECRET` set to a random 64-char string (PowerShell: `-join ((48..57)+(65..90)+(97..122) | Get-Random -Count 64 | % {[char]$_})`).

```gitignore
# backend/.gitignore
.env
.venv/
__pycache__/
*.pyc
.pytest_cache/
uploads/
```

- [ ] **Step 4: Write pytest.ini**

```ini
# backend/pytest.ini
[pytest]
pythonpath = .
testpaths = tests app
```

- [ ] **Step 5: Write minimal main.py**

```python
# backend/app/main.py
from fastapi import FastAPI

app = FastAPI(
    title="GovInnovate API",
    version="0.1.0",
    description="Startup-friendly innovation procurement engine — SIH26136",
)


@app.get("/api/health")
def health():
    return {"status": "ok"}
```

- [ ] **Step 6: Write the health test**

```python
# backend/tests/test_health.py
from fastapi.testclient import TestClient

from app.main import app


def test_health_ok():
    client = TestClient(app)
    resp = client.get("/api/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}
```

- [ ] **Step 7: Install deps and run the test**

```powershell
python -m venv .venv
.\.venv\Scripts\pip install -r requirements.txt
.\.venv\Scripts\python -m pytest tests/test_health.py -v
```

Expected: 1 passed.

- [ ] **Step 8: Start Postgres and verify pgvector**

```powershell
docker compose up -d db
docker exec govinnovate-db psql -U postgres -d govinnovate -c "CREATE EXTENSION IF NOT EXISTS vector; SELECT extversion FROM pg_extension WHERE extname='vector';"
docker exec govinnovate-db psql -U postgres -c "CREATE DATABASE govinnovate_test;"
```

Expected: extension version row (e.g. `0.7.x`), then `CREATE DATABASE`. (Start Docker Desktop first if the daemon isn't running.)

- [ ] **Step 9: Commit**

```powershell
git add backend/.gitignore backend/docker-compose.yml backend/requirements.txt backend/.env.example backend/pytest.ini backend/app backend/tests backend/scripts
git commit -m "chore: scaffold backend with docker postgres, health endpoint"
```

(.env is gitignored — never add it.)

---

### Task 2: Config + database engine + Alembic init

**Files:**
- Create: `backend/app/core/config.py`
- Create: `backend/app/core/database.py`
- Create: `backend/alembic.ini`
- Create: `backend/alembic/env.py`
- Create: `backend/alembic/script.py.mako` (from `alembic init`)
- Create: `backend/alembic/versions/.gitkeep`
- Test: `backend/tests/test_config_db.py`

**Interfaces:**
- Consumes: Task 1's `.env`, running Postgres.
- Produces:
  - `app.core.config.settings` — `database_url`, `test_database_url`, `jwt_secret`, `jwt_expire_minutes` (=480), `ai_provider` ("gemini"|"mock"), `gemini_api_key`.
  - `app.core.database.Base` (DeclarativeBase subclass), `engine`, `SessionLocal`, `get_session()` FastAPI dependency.
  - Alembic wired to `settings.database_url` + `Base.metadata` (`target_metadata`). Model imports accumulate in `env.py` in later tasks (audit in Task 4, auth in Task 5).

- [ ] **Step 1: Write config test**

```python
# backend/tests/test_config_db.py
from app.core.config import settings


def test_settings_loaded():
    assert settings.database_url.startswith("postgresql://")
    assert settings.jwt_secret  # non-empty
    assert settings.ai_provider in ("gemini", "mock")


def test_jwt_expire_default():
    assert settings.jwt_expire_minutes == 480  # 8h, spec §5
```

- [ ] **Step 2: Run test — expect failure**

```powershell
.\.venv\Scripts\python -m pytest tests/test_config_db.py -v
```

Expected: ModuleNotFoundError (no `app.core.config`).

- [ ] **Step 3: Write core/config.py**

```python
# backend/app/core/config.py
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "postgresql://postgres:postgres@localhost:15433/govinnovate"
    test_database_url: str = "postgresql://postgres:postgres@localhost:15433/govinnovate_test"
    jwt_secret: str = "dev-secret-change-me"
    jwt_expire_minutes: int = 480
    ai_provider: str = "mock"
    gemini_api_key: str = ""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
```

- [ ] **Step 4: Write core/database.py**

```python
# backend/app/core/database.py
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.core.config import settings

engine = create_engine(settings.database_url)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


def get_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

- [ ] **Step 5: Run config tests — expect pass**

```powershell
.\.venv\Scripts\python -m pytest tests/test_config_db.py -v
```

Expected: 2 passed.

- [ ] **Step 6: Initialize Alembic**

```powershell
.\.venv\Scripts\alembic init alembic
```

Edit `backend/alembic.ini`: set `sqlalchemy.url =` (empty — env.py supplies the URL). Then replace `backend/alembic/env.py` entirely with:

```python
# backend/alembic/env.py
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from logging.config import fileConfig

from alembic import context
from sqlalchemy import create_engine, pool

from app.core.config import settings
from app.core.database import Base

# Model imports — grows as tasks add models:
# Task 4: from app.models.audit import AuditLog  # noqa: F401
# Task 5: from app.modules.auth.models import User  # noqa: F401

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
```

Important: when the tests run migrations in-process (Task 4's conftest), `settings.database_url` must point at the test DB. conftest.py sets the `DATABASE_URL` env var BEFORE importing any `app` module, and pydantic-settings gives env vars precedence over `.env` — so `engine`/`SessionLocal` and alembic all hit `govinnovate_test` under pytest, `govinnovate` under uvicorn/CLI.

- [ ] **Step 7: Verify alembic runs**

```powershell
.\.venv\Scripts\alembic check
```

Expected: "No new upgrade operations detected." (Empty metadata vs empty DB is in sync.)

- [ ] **Step 8: Commit**

```powershell
git add backend/alembic.ini backend/alembic backend/app/core backend/tests/test_config_db.py
git commit -m "chore: config, database engine, alembic wiring"
```

---

### Task 3: Domain enums module

**Files:**
- Create: `backend/app/models/__init__.py` (empty)
- Create: `backend/app/models/enums.py`
- Test: `backend/tests/test_enums.py`

**Interfaces:**
- Consumes: stdlib only.
- Produces: `app.models.enums` members (later tables/serialization depend on every name): `UserRole`, `Portal`, `AuditAction`, `DomainTag`, `ConnectivityTier`, `PowerReliability`, `ITMaturity`, `SettlementType`, `TerrainType`, `EvidenceType`, `ValidationStatus`, `DecisionLabel`, `ConstraintType` — value sets listed in the test below (authoritative).

- [ ] **Step 1: Write enum tests**

```python
# backend/tests/test_enums.py
from app.models.enums import (
    AuditAction, ConnectivityTier, ConstraintType, DecisionLabel, DomainTag,
    EvidenceType, ITMaturity, Portal, PowerReliability, SettlementType,
    TerrainType, UserRole, ValidationStatus,
)


def test_user_roles_exactly_seven():
    vals = {r.value for r in UserRole}
    assert vals == {
        "STARTUP", "DEPT_OWNER", "PILOT_MANAGER", "EVALUATOR",
        "PROCUREMENT_AUTHORITY", "FINANCE", "ADMIN",
    }


def test_portal_values():
    assert Portal.A.value == "A"
    assert Portal.B.value == "B"


def test_decision_exactly_four():
    vals = {d.value for d in DecisionLabel}
    assert vals == {"STOP", "ADAPT", "REVALIDATE", "SCALE"}
    assert len(DecisionLabel) == 4


def test_domain_tags():
    assert DomainTag.WATER.value == "water"
    assert DomainTag.OTHER.value == "other"


def test_evidence_and_validation():
    assert EvidenceType.KPI_MEASUREMENT.value == "KPI_MEASUREMENT"
    assert ValidationStatus.UNVERIFIED.value == "UNVERIFIED"
    assert ValidationStatus.AI_EXTRACTED.value == "AI_EXTRACTED"
    assert ValidationStatus.EVALUATOR_VERIFIED.value == "EVALUATOR_VERIFIED"
    assert ValidationStatus.REJECTED.value == "REJECTED"


def test_context_profile_enums():
    assert ConnectivityTier.HIGH.value == "HIGH"
    assert PowerReliability.INTERMITTENT.value == "INTERMITTENT"
    assert ITMaturity.MEDIUM.value == "MEDIUM"
    assert SettlementType.TRIBAL.value == "TRIBAL"
    assert TerrainType.COASTAL.value == "COASTAL"
    assert ConstraintType.DATA_ACCESS.value == "DATA_ACCESS"


def test_audit_actions_nonempty():
    assert AuditAction.CREATE.value == "CREATE"
    assert AuditAction.AUTHORIZE.value == "AUTHORIZE"
    assert AuditAction.RESOLVE.value == "RESOLVE"
```

- [ ] **Step 2: Run — expect ModuleNotFoundError**

```powershell
.\.venv\Scripts\python -m pytest tests/test_enums.py -v
```

- [ ] **Step 3: Write app/models/enums.py**

```python
# backend/app/models/enums.py
from enum import Enum


class UserRole(str, Enum):
    STARTUP = "STARTUP"
    DEPT_OWNER = "DEPT_OWNER"
    PILOT_MANAGER = "PILOT_MANAGER"
    EVALUATOR = "EVALUATOR"
    PROCUREMENT_AUTHORITY = "PROCUREMENT_AUTHORITY"
    FINANCE = "FINANCE"
    ADMIN = "ADMIN"


class Portal(str, Enum):
    A = "A"
    B = "B"


class AuditAction(str, Enum):
    CREATE = "CREATE"
    UPDATE = "UPDATE"
    DELETE = "DELETE"
    LOGIN = "LOGIN"
    LOGIN_FAILED = "LOGIN_FAILED"
    WAIVE = "WAIVE"
    AUTHORIZE = "AUTHORIZE"
    REJECT = "REJECT"
    VALIDATE = "VALIDATE"
    SELECT = "SELECT"
    COMPUTE = "COMPUTE"
    PUBLISH = "PUBLISH"
    CLOSE = "CLOSE"
    INVOICE = "INVOICE"
    APPROVE = "APPROVE"
    DISBURSE = "DISBURSE"
    FINALIZE = "FINALIZE"
    RESOLVE = "RESOLVE"


class DomainTag(str, Enum):
    WATER = "water"
    AGRI = "agri"
    HEALTH = "health"
    EDUCATION = "education"
    INFRASTRUCTURE = "infrastructure"
    GOVERNANCE = "governance"
    TRANSPORT = "transport"
    ENERGY = "energy"
    OTHER = "other"


class ConnectivityTier(str, Enum):
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"
    NONE = "NONE"


class PowerReliability(str, Enum):
    STABLE = "STABLE"
    INTERMITTENT = "INTERMITTENT"
    UNRELIABLE = "UNRELIABLE"


class ITMaturity(str, Enum):
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


class SettlementType(str, Enum):
    URBAN = "URBAN"
    SEMI_URBAN = "SEMI_URBAN"
    RURAL = "RURAL"
    TRIBAL = "TRIBAL"


class TerrainType(str, Enum):
    PLAIN = "PLAIN"
    HILLY = "HILLY"
    COASTAL = "COASTAL"
    DESERT = "DESERT"
    MIXED = "MIXED"


class EvidenceType(str, Enum):
    KPI_MEASUREMENT = "KPI_MEASUREMENT"
    COST_RECORD = "COST_RECORD"
    PHOTO = "PHOTO"
    LOG = "LOG"
    REPORT = "REPORT"


class ValidationStatus(str, Enum):
    UNVERIFIED = "UNVERIFIED"
    AI_EXTRACTED = "AI_EXTRACTED"
    EVALUATOR_VERIFIED = "EVALUATOR_VERIFIED"
    REJECTED = "REJECTED"


class DecisionLabel(str, Enum):
    STOP = "STOP"
    ADAPT = "ADAPT"
    REVALIDATE = "REVALIDATE"
    SCALE = "SCALE"


class ConstraintType(str, Enum):
    CONNECTIVITY = "CONNECTIVITY"
    POWER = "POWER"
    STAFFING = "STAFFING"
    DATA_ACCESS = "DATA_ACCESS"
    OTHER = "OTHER"
```

- [ ] **Step 4: Run enum tests — expect pass**

```powershell
.\.venv\Scripts\python -m pytest tests/test_enums.py -v
```

Expected: 7 passed.

- [ ] **Step 5: Commit**

```powershell
git add backend/app/models backend/tests/test_enums.py
git commit -m "feat: domain enums for users, audit, context profiles, evidence, decisions"
```

---

### Task 4: Error hierarchy + audit log model + append-only migration + audit helper + test conftest

**Files:**
- Create: `backend/app/core/errors.py`
- Create: `backend/app/models/audit.py`
- Create: `backend/app/core/audit.py`
- Create: `backend/tests/conftest.py`
- Create: `backend/alembic/versions/<rev>_audit_logs.py` (autogenerated then edited)
- Modify: `backend/alembic/env.py` (uncomment AuditLog import)
- Test: `backend/tests/test_audit.py`

**Interfaces:**
- Consumes: `Base` (Task 2), enums (Task 3).
- Produces:
  - `app.core.errors`: `AppError(detail, context=None, status_code=None, code=None)` — per-instance overrides of class defaults; subclasses `BadRequest(400/BAD_REQUEST)`, `PermissionDenied(403/PERMISSION_DENIED)`, `NotFound(404/NOT_FOUND)`, `InvalidStateTransition(409/INVALID_STATE_TRANSITION)`, `AIProviderError(503/AI_PROVIDER_ERROR)`.
  - `app.models.audit.AuditLog` — id, user_id (nullable Integer; FK added in Task 5), action (AuditAction), entity_type (String(100)), entity_id (String(100)), old_values/new_values (JSON nullable), created_at. `app.models.audit.utcnow()` helper.
  - `app.core.audit.audit(db, user_id, action, entity_type, entity_id, old=None, new=None) -> AuditLog` — single write path; flushes, caller owns commit.
  - `tests/conftest.py`: session-scoped autouse migration fixture (runs Alembic to head against test DB) + function-scoped autouse `clean_db` (dynamically truncates ALL public tables except alembic_version — no hardcoded table list) + `session` fixture yielding a SessionLocal.

- [ ] **Step 1: Write conftest.py (needed by every subsequent test)**

```python
# backend/tests/conftest.py
import os
from pathlib import Path

os.environ["DATABASE_URL"] = "postgresql://postgres:postgres@localhost:15433/govinnovate_test"
os.environ.setdefault("ENABLE_RBAC_PROBES", "1")

import pytest
from sqlalchemy import inspect, text

from app.core.database import Base, SessionLocal, engine

BACKEND_DIR = Path(__file__).resolve().parents[1]


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
```

Notes: `clean_db` truncates AFTER each test so the first test of a session sees the fresh migration state; dynamic table discovery means later plans add tables with zero conftest changes. TRUNCATE CASCADE bypasses the append-only rule — acceptable in tests only; `test_audit_append_only_blocked` asserts plain UPDATE/DELETE stay blocked.

- [ ] **Step 2: Write audit tests**

```python
# backend/tests/test_audit.py
from sqlalchemy import text

from app.core.audit import audit
from app.models.audit import AuditLog
from app.models.enums import AuditAction


def test_audit_writes_row(session):
    audit(session, user_id=1, action=AuditAction.CREATE, entity_type="Challenge",
          entity_id="1", new={"title": "Leak detection"})
    session.commit()
    row = session.query(AuditLog).one()
    assert row.action == AuditAction.CREATE
    assert row.entity_type == "Challenge"
    assert row.new_values["title"] == "Leak detection"
    assert row.user_id == 1


def test_audit_old_new_nullable(session):
    audit(session, user_id=None, action=AuditAction.LOGIN, entity_type="User",
          entity_id="7")
    session.commit()
    row = session.query(AuditLog).one()
    assert row.old_values is None
    assert row.new_values is None


def test_audit_append_only_blocked(session):
    # Postgres rules make UPDATE/DELETE succeed silently with ZERO rows affected (DO INSTEAD NOTHING)
    audit(session, user_id=1, action=AuditAction.CREATE, entity_type="X",
          entity_id="1")
    session.commit()
    row_id = session.query(AuditLog).one().id
    session.execute(text(f"UPDATE audit_logs SET entity_type='Y' WHERE id={row_id}"))
    session.execute(text(f"DELETE FROM audit_logs WHERE id={row_id}"))
    session.commit()
    session.expire_all()
    row = session.get(AuditLog, row_id)
    assert row is not None and row.entity_type == "X"


def test_error_hierarchy():
    from app.core.errors import (
        AIProviderError, AppError, BadRequest, InvalidStateTransition, NotFound,
        PermissionDenied,
    )
    assert issubclass(PermissionDenied, AppError)
    assert issubclass(InvalidStateTransition, AppError)
    assert issubclass(AIProviderError, AppError)
    assert issubclass(NotFound, AppError)
    assert issubclass(BadRequest, AppError)
    assert PermissionDenied("x").status_code == 403
    assert PermissionDenied("x").code == "PERMISSION_DENIED"
    # per-instance override
    e = AppError("taken", status_code=409, code="EMAIL_TAKEN")
    assert e.status_code == 409 and e.code == "EMAIL_TAKEN" and e.detail == "taken"
```

- [ ] **Step 3: Run — expect ModuleNotFoundError**

```powershell
.\.venv\Scripts\python -m pytest tests/test_audit.py -v
```

- [ ] **Step 4: Write core/errors.py**

```python
# backend/app/core/errors.py
from typing import Any


class AppError(Exception):
    status_code = 500
    code = "APP_ERROR"

    def __init__(
        self,
        detail: str,
        context: dict[str, Any] | None = None,
        status_code: int | None = None,
        code: str | None = None,
    ):
        self.detail = detail
        self.context = context
        if status_code is not None:
            self.status_code = status_code
        if code is not None:
            self.code = code
        super().__init__(detail)


class BadRequest(AppError):
    status_code = 400
    code = "BAD_REQUEST"


class PermissionDenied(AppError):
    status_code = 403
    code = "PERMISSION_DENIED"


class NotFound(AppError):
    status_code = 404
    code = "NOT_FOUND"


class InvalidStateTransition(AppError):
    status_code = 409
    code = "INVALID_STATE_TRANSITION"


class AIProviderError(AppError):
    status_code = 503
    code = "AI_PROVIDER_ERROR"
```

- [ ] **Step 5: Write app/models/audit.py**

```python
# backend/app/models/audit.py
from datetime import datetime, timezone

from sqlalchemy import JSON, DateTime, Integer, String
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.enums import AuditAction


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int | None] = mapped_column(Integer, nullable=True)  # FK added in Task 5
    action: Mapped[AuditAction] = mapped_column(SAEnum(AuditAction, native_enum=False, length=50), nullable=False)
    entity_type: Mapped[str] = mapped_column(String(100), nullable=False)
    entity_id: Mapped[str] = mapped_column(String(100), nullable=False)
    old_values: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    new_values: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, nullable=False
    )
```

(`native_enum=False` stores VARCHAR + CHECK — portable and Alembic-friendly.)

- [ ] **Step 6: Write core/audit.py**

```python
# backend/app/core/audit.py
from typing import Any

from sqlalchemy.orm import Session

from app.models.audit import AuditLog
from app.models.enums import AuditAction


def audit(
    db: Session,
    user_id: int | None,
    action: AuditAction,
    entity_type: str,
    entity_id: str,
    old: dict[str, Any] | None = None,
    new: dict[str, Any] | None = None,
) -> AuditLog:
    log = AuditLog(
        user_id=user_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        old_values=old,
        new_values=new,
    )
    db.add(log)
    db.flush()
    return log
```

- [ ] **Step 7: Generate + edit migration**

In `backend/alembic/env.py` uncomment the Task 4 import line:

```python
from app.models.audit import AuditLog  # noqa: F401
```

```powershell
.\.venv\Scripts\alembic revision --autogenerate -m "audit logs table"
```

Autogenerate creates the table but does NOT know Postgres rules — append to `upgrade()` after `op.create_table(...)`:

```python
    op.execute(
        "CREATE RULE audit_logs_no_update AS ON UPDATE TO audit_logs "
        "DO INSTEAD NOTHING;"
    )
    op.execute(
        "CREATE RULE audit_logs_no_delete AS ON DELETE TO audit_logs "
        "DO INSTEAD NOTHING;"
    )
```

And in `downgrade()` (before `op.drop_table`):

```python
    op.execute("DROP RULE IF EXISTS audit_logs_no_update ON audit_logs;")
    op.execute("DROP RULE IF EXISTS audit_logs_no_delete ON audit_logs;")
```

- [ ] **Step 8: Run audit tests**

```powershell
.\.venv\Scripts\python -m pytest tests/test_audit.py -v
```

Expected: 4 passed (conftest runs the new migration against the test DB automatically).

- [ ] **Step 9: Commit**

```powershell
git add backend/app/core/errors.py backend/app/core/audit.py backend/app/models/audit.py backend/alembic backend/tests/conftest.py backend/tests/test_audit.py
git commit -m "feat: audit log model, append-only rules, error hierarchy"
```

---

### Task 5: User model + security (bcrypt/JWT) + RBAC deps + auth service/router + probes

**Files:**
- Create: `backend/app/modules/__init__.py` (empty)
- Create: `backend/app/modules/auth/__init__.py` (empty)
- Create: `backend/app/modules/auth/models.py`
- Create: `backend/app/modules/auth/schemas.py`
- Create: `backend/app/modules/auth/service.py`
- Create: `backend/app/modules/auth/router.py`
- Create: `backend/app/core/security.py`
- Create: `backend/app/core/rbac.py`
- Test: `backend/app/modules/auth/tests/__init__.py` (empty)
- Test: `backend/app/modules/auth/tests/test_auth_api.py`
- Test: `backend/app/modules/auth/tests/test_rbac.py`
- Modify: `backend/app/main.py` (final version with router + exception handler + guarded probes)
- Modify: `backend/alembic/env.py` (uncomment auth models import)
- Create: migration for users table + audit FK

**Interfaces:**
- Consumes: `Base`, `get_session`, `settings`, `AppError`, `audit()`, enums, conftest.
- Produces (exact names later plans rely on):
  - `app.modules.auth.models.User` — id, email (unique index), password_hash, role (UserRole via SAEnum native_enum=False), full_name, is_active (default True), created_at.
  - `app.core.security`: `hash_password(pw) -> str`, `verify_password(pw, hashed) -> bool`, `create_access_token(user) -> str`, `decode_token(token) -> dict`, `PORTAL_BY_ROLE: dict[UserRole, Portal]`.
  - `app.core.rbac`: `get_current_user` (dependency), `require_any_authenticated()`, `require_role(*roles)`, `require_portal(portal)` (all dependency factories).
  - `app.modules.auth.service`: `register_user(db, payload) -> dict`, `authenticate(db, email, password) -> User | None`, `login(db, email, password) -> dict`.
  - `auth_router` mounted at `/api/auth`: `POST /register` (201), `POST /login` (200), `GET /me` (200). Error envelope via AppError handler: `{"detail", "code", "context"?}`.

- [ ] **Step 1: Write failing auth API tests**

```python
# backend/app/modules/auth/tests/test_auth_api.py
import jwt as pyjwt
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def _register(role="STARTUP", email="founder@acme.in"):
    resp = client.post("/api/auth/register", json={
        "email": email,
        "password": "Passw0rd!123",
        "full_name": "Test User",
        "role": role,
    })
    assert resp.status_code == 201, resp.text
    return resp.json()


def test_register_startup():
    data = _register("STARTUP", "s1@acme.in")
    assert data["user"]["email"] == "s1@acme.in"
    assert data["user"]["role"] == "STARTUP"
    assert data["access_token"]


def test_register_rejects_admin():
    resp = client.post("/api/auth/register", json={
        "email": "evil@admin.in", "password": "Passw0rd!123",
        "full_name": "Evil", "role": "ADMIN",
    })
    assert resp.status_code == 403


def test_register_duplicate_email_409():
    _register("STARTUP", "dup@acme.in")
    resp = client.post("/api/auth/register", json={
        "email": "dup@acme.in", "password": "Passw0rd!123",
        "full_name": "Dup", "role": "STARTUP",
    })
    assert resp.status_code == 409


def test_login_success():
    _register("STARTUP", "login@acme.in")
    resp = client.post("/api/auth/login", json={
        "email": "login@acme.in", "password": "Passw0rd!123",
    })
    assert resp.status_code == 200
    body = resp.json()
    assert body["access_token"]
    assert body["user"]["email"] == "login@acme.in"


def test_login_wrong_password_401():
    _register("STARTUP", "wrongpw@acme.in")
    resp = client.post("/api/auth/login", json={
        "email": "wrongpw@acme.in", "password": "nope",
    })
    assert resp.status_code == 401


def test_me_requires_token():
    resp = client.get("/api/auth/me")
    assert resp.status_code in (401, 403)


def test_me_returns_user():
    data = _register("DEPT_OWNER", "dept@maharashtra.gov.in")
    resp = client.get("/api/auth/me",
                      headers={"Authorization": f"Bearer {data['access_token']}"})
    assert resp.status_code == 200
    assert resp.json()["email"] == "dept@maharashtra.gov.in"
    assert resp.json()["role"] == "DEPT_OWNER"


def test_token_claims_portal_a():
    data = _register("STARTUP", "claim@acme.in")
    claims = pyjwt.decode(data["access_token"], options={"verify_signature": False})
    assert claims["portal"] == "A"
    assert claims["role"] == "STARTUP"


def test_token_claims_portal_b():
    data = _register("FINANCE", "fin@maharashtra.gov.in")
    claims = pyjwt.decode(data["access_token"], options={"verify_signature": False})
    assert claims["portal"] == "B"
```

- [ ] **Step 2: Write failing RBAC tests**

```python
# backend/app/modules/auth/tests/test_rbac.py
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

GOVT_ROLES = ["DEPT_OWNER", "PILOT_MANAGER", "EVALUATOR",
              "PROCUREMENT_AUTHORITY", "FINANCE"]


def _tok(role, email):
    resp = client.post("/api/auth/register", json={
        "email": email, "password": "Passw0rd!123",
        "full_name": "R", "role": role,
    })
    assert resp.status_code == 201, resp.text
    return resp.json()["access_token"]


def test_probe_any_requires_auth():
    resp = client.get("/api/rbac-probe/any")
    assert resp.status_code in (401, 403)


def test_startup_blocked_from_portal_b():
    token = _tok("STARTUP", "rbac_s@acme.in")
    resp = client.get("/api/rbac-probe/govt",
                      headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 403
    assert resp.json()["code"] == "PERMISSION_DENIED"


def test_govt_roles_pass_portal_b():
    for role in GOVT_ROLES:
        token = _tok(role, f"rbac_{role.lower()}@gov.in")
        resp = client.get("/api/rbac-probe/govt",
                           headers={"Authorization": f"Bearer {token}"})
        assert resp.status_code == 200, f"{role} should access Portal B"


def test_role_restriction():
    token = _tok("FINANCE", "rbac_fin2@gov.in")
    resp = client.get("/api/rbac-probe/evaluator",
                      headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 403

    token = _tok("EVALUATOR", "rbac_eval@gov.in")
    resp = client.get("/api/rbac-probe/evaluator",
                      headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
```

(conftest.py already sets `ENABLE_RBAC_PROBES=1` — probes are registered.)

- [ ] **Step 3: Run both test files — expect failures**

```powershell
.\.venv\Scripts\python -m pytest app/modules/auth/tests -v
```

Expected: collection/import errors (no models/router yet).

- [ ] **Step 4: Write app/modules/auth/models.py**

```python
# backend/app/modules/auth/models.py
from datetime import datetime

from sqlalchemy import Boolean, String
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.audit import utcnow
from app.models.enums import UserRole


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(SAEnum(UserRole, native_enum=False, length=30), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(nullable=False, default=utcnow)
```

- [ ] **Step 5: Write app/core/security.py**

```python
# backend/app/core/security.py
from datetime import datetime, timedelta, timezone

import jwt
from passlib.context import CryptContext

from app.core.config import settings
from app.models.enums import Portal, UserRole

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

PORTAL_BY_ROLE: dict[UserRole, Portal] = {r: Portal.B for r in UserRole}
PORTAL_BY_ROLE[UserRole.STARTUP] = Portal.A


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, hashed: str) -> bool:
    return pwd_context.verify(password, hashed)


def create_access_token(user) -> str:
    now = datetime.now(timezone.utc)
    role = user.role if isinstance(user.role, UserRole) else UserRole(user.role)
    payload = {
        "sub": str(user.id),
        "role": role.value,
        "portal": PORTAL_BY_ROLE[role].value,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=settings.jwt_expire_minutes)).timestamp()),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm="HS256")


def decode_token(token: str) -> dict:
    return jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
```

- [ ] **Step 6: Write app/core/rbac.py**

```python
# backend/app/core/rbac.py
from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.database import get_session
from app.core.errors import PermissionDenied
from app.core.security import PORTAL_BY_ROLE, decode_token
from app.models.enums import Portal, UserRole
from app.modules.auth.models import User

bearer = HTTPBearer(auto_error=False)


def get_current_user(
    creds: HTTPAuthorizationCredentials | None = Depends(bearer),
    db: Session = Depends(get_session),
) -> User:
    if creds is None:
        raise PermissionDenied("Not authenticated")
    try:
        claims = decode_token(creds.credentials)
    except Exception:
        raise PermissionDenied("Invalid or expired token")
    user = db.get(User, int(claims["sub"]))
    if user is None or not user.is_active:
        raise PermissionDenied("User not found or inactive")
    return user


def require_any_authenticated():
    def dep(user: User = Depends(get_current_user)) -> User:
        return user
    return dep


def require_role(*allowed: UserRole):
    def dep(user: User = Depends(get_current_user)) -> User:
        if user.role not in allowed:
            raise PermissionDenied(
                f"Requires role in {[r.value for r in allowed]}",
                context={"required": [r.value for r in allowed]},
            )
        return user
    return dep


def require_portal(portal: Portal):
    def dep(user: User = Depends(get_current_user)) -> User:
        user_role = user.role if isinstance(user.role, UserRole) else UserRole(user.role)
        if PORTAL_BY_ROLE[user_role] != portal:
            raise PermissionDenied(f"Requires portal {portal.value}")
        return user
    return dep
```

- [ ] **Step 7: Write auth schemas + service**

```python
# backend/app/modules/auth/schemas.py
from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.enums import UserRole


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    full_name: str = Field(min_length=2)
    role: UserRole


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
```

```python
# backend/app/modules/auth/service.py
from fastapi import UploadFile  # noqa: F401  (placeholder import removed below)
```

NO — write the real file directly:

```python
# backend/app/modules/auth/service.py
from sqlalchemy.orm import Session

from app.core.audit import audit
from app.core.errors import AppError, PermissionDenied
from app.core.security import create_access_token, hash_password, verify_password
from app.models.enums import AuditAction, UserRole
from app.modules.auth.models import User
from app.modules.auth.schemas import RegisterRequest


def register_user(db: Session, payload: RegisterRequest) -> dict:
    if payload.role == UserRole.ADMIN:
        raise PermissionDenied("ADMIN accounts are created via seed only")
    if db.query(User).filter(User.email == payload.email).first() is not None:
        raise AppError("Email already registered",
                       context={"email": payload.email},
                       status_code=409, code="EMAIL_TAKEN")
    user = User(
        email=payload.email,
        password_hash=hash_password(payload.password),
        role=payload.role,
        full_name=payload.full_name,
    )
    db.add(user)
    db.flush()
    audit(db, user_id=None, action=AuditAction.CREATE, entity_type="User",
          entity_id=str(user.id),
          new={"email": user.email, "role": payload.role.value,
               "full_name": user.full_name})
    db.commit()
    return {"access_token": create_access_token(user), "user": user}


def authenticate(db: Session, email: str, password: str) -> User | None:
    user = db.query(User).filter(User.email == email).first()
    if user is None or not verify_password(password, user.password_hash):
        return None
    return user


def login(db: Session, email: str, password: str) -> dict:
    user = authenticate(db, email, password)
    if user is None:
        audit(db, user_id=None, action=AuditAction.LOGIN_FAILED, entity_type="User",
              entity_id=email, new={"email": email})
        db.commit()
        raise AppError("Invalid credentials", status_code=401,
                       code="INVALID_CREDENTIALS")
    audit(db, user_id=user.id, action=AuditAction.LOGIN, entity_type="User",
          entity_id=str(user.id), new={"email": user.email})
    db.commit()
    return {"access_token": create_access_token(user), "user": user}
```

- [ ] **Step 8: Write auth router + final main.py**

```python
# backend/app/modules/auth/router.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_session
from app.core.rbac import get_current_user
from app.modules.auth import service
from app.modules.auth.models import User
from app.modules.auth.schemas import (LoginRequest, RegisterRequest,
                                      TokenResponse, UserOut)

auth_router = APIRouter()


@auth_router.post("/register", response_model=TokenResponse, status_code=201)
def register(payload: RegisterRequest, db: Session = Depends(get_session)):
    return service.register_user(db, payload)


@auth_router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_session)):
    return service.login(db, payload.email, payload.password)


@auth_router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return user
```

```python
# backend/app/main.py  (final Task 5 version — replaces Task 1's)
import os

from fastapi import Depends, FastAPI, Request
from fastapi.responses import JSONResponse

from app.core.errors import AppError


def create_app() -> FastAPI:
    app = FastAPI(
        title="GovInnovate API",
        version="0.1.0",
        description="Startup-friendly innovation procurement engine — SIH26136",
    )

    from app.modules.auth.router import auth_router
    app.include_router(auth_router, prefix="/api/auth", tags=["auth"])

    @app.exception_handler(AppError)
    async def app_error_handler(request: Request, exc: AppError):
        content = {"detail": exc.detail, "code": exc.code}
        if exc.context:
            content["context"] = exc.context
        return JSONResponse(status_code=exc.status_code, content=content)

    if os.environ.get("ENABLE_RBAC_PROBES") == "1":
        from app.core.database import get_session
        from app.core.rbac import (require_any_authenticated, require_portal,
                                   require_role)
        from app.models.enums import Portal, UserRole

        @app.get("/api/rbac-probe/any", tags=["test"])
        def probe_any(user=Depends(require_any_authenticated())):
            return {"ok": True}

        @app.get("/api/rbac-probe/govt", tags=["test"])
        def probe_govt(user=Depends(require_portal(Portal.B))):
            return {"ok": True}

        @app.get("/api/rbac-probe/evaluator", tags=["test"])
        def probe_eval(user=Depends(require_role(UserRole.EVALUATOR))):
            return {"ok": True}

    @app.get("/api/health")
    def health():
        return {"status": "ok"}

    return app


app = create_app()
```

- [ ] **Step 9: Generate users migration + audit FK**

In `backend/alembic/env.py` uncomment the auth import:

```python
from app.modules.auth.models import User  # noqa: F401
```

```powershell
.\.venv\Scripts\alembic revision --autogenerate -m "users table and audit fk"
```

Autogenerate produces the `users` table. Hand-append to `upgrade()`:

```python
    op.create_foreign_key(
        "fk_audit_logs_user_id", "audit_logs", "users", ["user_id"], ["id"]
    )
```

And to `downgrade()` (before `op.drop_table("users")`):

```python
    op.drop_constraint("fk_audit_logs_user_id", "audit_logs", type_="foreignkey")
```

- [ ] **Step 10: Run full suite**

```powershell
.\.venv\Scripts\python -m pytest -v
```

Expected: 27 passed — health (1) + config (2) + enums (7) + audit (4) + auth API (9) + RBAC (4).

Then bring the dev DB to head and smoke-check:

```powershell
.\.venv\Scripts\alembic upgrade head
.\.venv\Scripts\uvicorn app.main:app --port 8000
# in another shell:
curl.exe http://localhost:8000/api/health
```

Expected: `{"status":"ok"}`. Stop the server afterwards.

- [ ] **Step 11: Commit**

```powershell
git add backend
git commit -m "feat: auth module - register/login/me, JWT, RBAC dependencies, audit integration"
```

---

### Task 6: README + plan checkbox update

**Files:**
- Create: `backend/README.md`
- Modify: `docs/superpowers/plans/2026-09-10-govinnovate-backend-plan1-foundation.md` (tick checkboxes)

**Interfaces:**
- Consumes: everything above.
- Produces: teammate onboarding doc.

- [ ] **Step 1: Write backend/README.md**

````markdown
# GovInnovate Backend

FastAPI + PostgreSQL 16 (pgvector) backend for SIH26136 — startup-friendly innovation procurement engine. Spec: `docs/superpowers/specs/2026-09-10-govinnovate-backend-design.md`.

## Quickstart

```powershell
cd backend
docker compose up -d db          # Postgres 16 + pgvector on :15433
python -m venv .venv
.\.venv\Scripts\pip install -r requirements.txt
.\.venv\Scripts\alembic upgrade head
.\.venv\Scripts\uvicorn app.main:app --reload --port 8000
```

Interactive API docs: http://localhost:8000/docs

## Tests

```powershell
.\.venv\Scripts\python -m pytest -v
```

Tests run against `govinnovate_test` (same Postgres server, `DATABASE_URL` env override in `tests/conftest.py`); migrations apply per session; tables truncate between tests.

## Roles & Portals

7 roles: STARTUP, DEPT_OWNER, PILOT_MANAGER, EVALUATOR, PROCUREMENT_AUTHORITY, FINANCE, ADMIN. STARTUP → Portal A; all others → Portal B. ADMIN is seeded (later phase) — registration rejects ADMIN.
````

- [ ] **Step 2: Tick this plan's checkboxes and commit**

```powershell
git add backend/README.md docs/superpowers/plans/2026-09-10-govinnovate-backend-plan1-foundation.md
git commit -m "docs: backend README, plan 1 progress"
```
