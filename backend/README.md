# PROCSYNC Backend

FastAPI + PostgreSQL 16 (pgvector) backend for SIH26136 — startup-friendly innovation procurement engine. Spec: `docs/superpowers/specs/2026-09-10-govinnovate-backend-design.md`.

## Quickstart

```powershell
cd backend
docker compose up -d db          # Postgres 16 + pgvector on :15433 (both DBs are provisioned by migrations + compose)
py -3.13 -m venv .venv
.\.venv\Scripts\pip install -r requirements.txt
.\.venv\Scripts\alembic upgrade head
.\.venv\Scripts\uvicorn app.main:app --reload --port 8000
```

Interactive API docs: http://localhost:8000/docs

Note: the venv targets Python 3.13 (`py -3.13`) because `psycopg2-binary` and `pydantic-core` do not yet publish cp314 wheels.

## Tests

```powershell
.\.venv\Scripts\python -m pytest -v
```

29 tests → now **230 + 1 skipped** (the skip is the Gemini live test, which only runs with `GEMINI_API_KEY` set). They run against `govinnovate_test` (same Postgres server — `DATABASE_URL` is overridden in `conftest.py` at the backend root, which applies to every test path). Alembic migrations apply per session; tables truncate between tests.

## Pilot execution (Plan 5)

- **Pilots** (`app/modules/pilots/`): created from SELECTED proposals (`DRAFT → ACTIVE → COMPLETED|FAILED|TERMINATED`), manager assignment, startup accept-terms gate, failure conditions recorded on FAILED (Plan 7 failure memory).
- **Execution** (`app/modules/execution/`): milestones (`PENDING → SUBMITTED → VERIFIED → PAID`, PAID only via disburse), KPIs (HIGHER/LOWER directions + actuals), risk register, constraints. `safety_critical` flaggable only by the government side (startup attempts → 400). All writes blocked on terminal pilots — the record freezes at completion/failure.
- **Payments** (`app/modules/payments/`): `INVOICED → APPROVED → DISBURSED|REJECTED`, FINANCE-or-ADMIN gated; approve requires a still-VERIFIED milestone; disburse flips the milestone to PAID atomically.

## Selection phase (Plan 4)

- **Weighted scoring** (`app/core/rules/`): deterministic `weighted_total` / `rank_proposals` on deck-§24 weights (0–100 scale); panels assign evaluators, `POST /proposals/{id}/scores` upserts by identity, `GET /challenges/{id}/ranking` returns gate-separated totals.
- **Risk-equivalent qualification** (`app/modules/riskqual/`): engine proposes (requirement → risk → alternatives → residual → safeguards), EVALUATOR/ADMIN decide; ACCEPTED flips the linked check to WAIVED.
- **Selection**: `POST /challenges/{id}/start-evaluation` → ELIGIBLE proposals move to UNDER_EVALUATION; `POST /proposals/{id}/select` sets SELECTED + rejects all live siblings (decision finality); `POST /proposals/{id}/reject` with reason. All status changes route through `assert_transition`; full audit trail incl. intermediate hops.

## Project layout

- `app/core/` — config, database, security (bcrypt/JWT), rbac, audit, errors
- `app/models/` — shared enums + audit log model
- `app/modules/<domain>/` — domain packages (models, schemas, service, router, tests)
- `alembic/` — migrations; `env.py` imports every model for autogenerate

## Roles & Portals

7 roles: STARTUP, DEPT_OWNER, PILOT_MANAGER, EVALUATOR, PROCUREMENT_AUTHORITY, FINANCE, ADMIN. STARTUP → Portal A; all others → Portal B. ADMIN is seeded (later phase) — registration rejects ADMIN.

JWT (HS256, 8h) carries `sub`, `role`, `portal` claims. Three RBAC layers: router-level `require_role`/`require_portal`, object-level ownership in services, and the portal trust-zone guard.

## AI Provider Layer & Startup Discovery

`app/ai/` is a self-contained provider layer (imports nothing from `app.core`/`app.modules` — the "AI recommends, rules constrain, humans decide" boundary is structural):

- **Provider interface** (`base.EvidenceAI`): `discover_startups`, `embed`, `extract`, `compare_contexts`, `draft_explanation`.
- **Mock provider** (default): deterministic — seed-index discovery, hash embeddings, rule-based extraction. All tests run on it; no network ever required.
- **Gemini provider**: search-grounded discovery (live web), raises a clean provider error on any failure; other methods arrive in later phases.

**Selection:** `AI_PROVIDER=mock|gemini` env var (`GEMINI_API_KEY` required for gemini). NOTE: the pinned `google-generativeai==0.8.5` SDK predates Gemini-2.0 search grounding — smoke-test discovery with a real key (or migrate to the `google-genai` SDK) before flipping to gemini mode in a demo.

**Startup Discovery flow** (your web-scraping feature): challenge published → auto-discovery runs (best-effort, never blocks publish) → ranked suggestions stored with relevance evidence (`discovered_startups`, merged: web results + curated seed index, deduped, capped 10) → DEPT_OWNER invites by email (`invitations`, 14-day expiry, `SENT → REGISTERED | EXPIRED`) → startup registers via `POST /api/auth/register-with-invite` with the invite code → linked to the challenge funnel. Gemini-mode merges the 12-entry offline seed index so the demo always has results even if the live search fails.

## Enum storage

Enum columns are stored as VARCHAR with DB-level CHECK constraints. The model-level `create_constraint=True` on `SAEnum(...)` does not retroactively emit constraints for existing tables — the CHECKs are added by explicit migrations (`ck_audit_logs_action`, `ck_users_role`) so both dev and test DBs stay in sync.
