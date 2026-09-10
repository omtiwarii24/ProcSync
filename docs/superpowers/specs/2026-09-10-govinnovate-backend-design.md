# GovInnovate Backend Design Spec

**Date:** 2026-09-10
**Status:** Approved design — pending user review
**Scope:** Backend only (API, database, AI/NLP, routes, auth, search, audit). Frontend to be designed separately after backend completion.

**Source of truth for domain concepts:** `GovInnovate_SIH26136_Final_Project_Documentation_CORRECTED.md` (repo root). This spec references that document's section numbers (§) throughout. Where this spec and that document could conflict, that document wins on domain vocabulary; this spec wins on implementation detail.

**Final development rules inherited from the deck (§39):**
- One Decision enum only: `STOP / ADAPT / REVALIDATE / SCALE`. No fifth value.
- One passport artifact only: `ProcurementReadinessPassport`. Never "Evidence Passport."
- Procurement Route exists only after `Decision = SCALE`.
- AI never has final unchecked authority. Architecture enforces this, policy doesn't just state it.

---

## 1. Summary

GovInnovate is a FastAPI + PostgreSQL backend implementing a startup-friendly innovation procurement engine for SIH26136. The backend serves two portals through one API (Startup & Innovation Access Portal, Government Innovation Procurement Portal) with role-based access control, and implements the full lifecycle:

```
Challenge → Proposal → Eligibility → Evaluation → Selection → Pilot
→ Evidence → AI Extraction → Validation → Passport finalized
→ Decision (deterministic) → Human Authorization → (if SCALE) Route
→ Replication: reuse vs. revalidate for future departments
```

**Core architecture principle (deck §21):** AI proposes/extracts → deterministic rules validate/score → humans authorize.

## 2. Stack & Infrastructure

| Component | Choice |
|---|---|
| Language | Python 3.14 |
| Framework | FastAPI + uvicorn |
| Database | PostgreSQL 16 with pgvector extension |
| ORM / Migrations | SQLAlchemy 2.x + Alembic |
| Auth | bcrypt (passlib) + JWT (HS256, 8h expiry) |
| AI | Google Gemini (chat: gemini-2.0-flash, embeddings: text-embedding-004) via provider interface with deterministic mock fallback |
| Container | docker-compose: `db` service on port 15433, volume-persisted |
| Tests | pytest + httpx TestClient, separate `govinnovate_test` DB |

`AI_PROVIDER=gemini|mock` env var selects the provider; tests always run on mock. Real AI usage requires `GEMINI_API_KEY` in `.env`.

## 3. Project Structure (modular monolith)

```
backend/
├── docker-compose.yml
├── requirements.txt          # pinned
├── pytest.ini
├── .env.example
├── alembic/                  # migrations from day 1
├── scripts/seed.py           # demo dataset (deck §32 scenario)
├── app/
│   ├── main.py               # app factory + router registration
│   ├── core/
│   │   ├── config.py         # Settings (pydantic-settings)
│   │   ├── database.py        # engine, session, Base
│   │   ├── security.py        # bcrypt, JWT create/decode
│   │   ├── rbac.py            # require_role, ownership, portal guard
│   │   ├── audit.py           # audit() single write path
│   │   ├── errors.py          # AppError hierarchy, handlers
│   │   └── rules/            # deterministic engines (pure Python)
│   │       ├── eligibility.py
│   │       ├── evaluation.py
│   │       ├── decision.py
│   │       ├── risk_equivalent.py
│   │       └── triage.py
│   ├── ai/
│   │   ├── base.py           # EvidenceAI protocol
│   │   ├── gemini.py
│   │   ├── mock.py
│   │   └── factory.py
│   └── modules/              # one package per domain; each has
│       │                     # models.py, schemas.py, service.py, router.py
│       ├── auth/
│       ├── orgs/            # departments, startups
│       ├── challenges/      # + eligibility criteria
│       ├── proposals/        # + eligibility checks, panels, scores, risk analyses
│       ├── pilots/           # + milestones, KPIs, risks, constraints
│       ├── evidence/         # + validations
│       ├── passports/
│       ├── decisions/        # + procurement routes
│       ├── replication/      # + context profiles, analyses
│       ├── templates/        # + template usage
│       ├── payments/
│       ├── search/
│       └── analytics/
└── tests/                    # mirrors modules; conftest with test DB
```

**Import boundary (enforced architectural guarantee):**

- `app/ai/` imports nothing from `core/rules/` or `modules/` — receives plain data, returns plain data.
- `core/rules/` imports nothing from `app/ai/`.
- `modules/*/service.py` orchestrates: AI result → rules validation → DB write → audit.

This makes "AI recommends, rules constrain, humans decide" a structural property, demonstrable to judges.

## 4. Database Schema

Enums reuse and extend the domain enums from prior work (connectivity/power/terrain/settlement tiers, evidence types, validation status, decision labels, constraint types).

### Identity & Organizations

- **users** — email (unique), password_hash, role, full_name. Roles: `STARTUP, DEPT_OWNER, PILOT_MANAGER, EVALUATOR, PROCUREMENT_AUTHORITY, FINANCE, ADMIN`. One user = one role.
- **departments** — name, code, **context profile**: connectivity_tier, power_reliability, it_maturity, settlement_type, terrain_type (drives the 5-dimension replication comparison).
- **startups** — owner_user_id, name, dpiit_number, sectors (JSON), team_size, annual_turnover, runway_months, prior_deployments (int), description.

### Challenge → Proposal → Selection

- **challenges** — department_id, title, problem_statement, baseline, target, domain (DomainTag), budget, status: `DRAFT → PUBLISHED → CLOSED`, evaluation_weights (JSON, defaults from deck §24), closes_at.
- **eligibility_criteria** — challenge_id, criterion_type: `TURNOVER / EXPERIENCE / DPIIT / CUSTOM`, operator (`GTE, LTE, EQ`), threshold (float/JSON), is_auto_checkable (bool), waiver_allowed (bool).
- **proposals** — challenge_id, startup_id, status: `SUBMITTED → ELIGIBLE → UNDER_EVALUATION → SELECTED | REJECTED`, technical_summary, cost_estimate, selected_at.
- **eligibility_checks** — proposal_id, criterion_id, result: `PASS / FAIL / PENDING_MANUAL / WAIVED`, checked_value, waived_by, waiver_justification.
- **evaluation_panels** — challenge_id, evaluator_id, gate (`GATE1 / GATE2`).
- **proposal_scores** — proposal_id, panel/evaluator, gate, dimension, raw_score (0–10), weight, rationale.
- **risk_equivalent_analyses** — proposal_id, failed_criterion_id, underlying_risk, alternative_evidence (JSON), residual_risk, safeguards (JSON), ai_enrichment (JSON, labeled), human_decision: `PENDING / ACCEPTED / REJECTED`, decided_by.

### Pilot Execution

- **pilots** — proposal_id, department_id, pilot_manager_id, scope, status: `DRAFT → ACTIVE → COMPLETED | FAILED | TERMINATED`, data_ip_terms, starts_at, ends_at.
- **milestones** — pilot_id, title, amount, due_date, status: `PENDING → SUBMITTED → VERIFIED → PAID`.
- **kpis** — pilot_id, name, baseline, target, actual, unit, direction (`HIGHER / LOWER`).
- **risks** — pilot_id, description, likelihood, impact, mitigation, residual, is_critical, resolved.
- **constraints** — pilot_id, constraint_type (`CONNECTIVITY / POWER / STAFFING / DATA_ACCESS / OTHER`), context_value, notes.

### Evidence → Validation

- **evidence_items** — pilot_id, milestone_id (nullable), type: `KPI_MEASUREMENT / COST_RECORD / PHOTO / LOG / REPORT`, file_path, uploaded_by, status: `UNVERIFIED → AI_EXTRACTED → EVALUATOR_VERIFIED | REJECTED`, extracted_data (JSON), ai_confidence (float), source_trace (JSON), safety_critical (bool — set by the Pilot Manager at milestone/KPI definition during pilot design; evidence linked to a safety-critical milestone inherits the flag; an Evaluator may escalate it to true at validation; it is never set by the uploading startup and never by AI).
- **validations** — evidence_item_id, validator_id, verdict (`VERIFIED / REJECTED`), method, auto_approved (bool).

### Passport → Decision → Route

- **passports** — pilot_id (unique, 1:1), status: `IN_PROGRESS → FINALIZED`, readiness: `READY / CONDITIONAL / NOT_READY`, sections (JSON): gate1_result, gate2_result (incl. risk-equivalent findings), kpis, results, validation_summary, cost, infrastructure_conditions, data_requirements, ip_licensing, security_compliance, risks, lessons_learned, replication_guidance, failure_conditions. Human-readable status at every stage; no opaque AI score.
- **decisions** — passport_id, value (`STOP / ADAPT / REVALIDATE / SCALE` only), score_breakdown (JSON, deterministic), explanation_draft (AI-drafted, labeled), authorization_status: `PENDING / APPROVED / REJECTED` (default PENDING), authorized_by (nullable), authorized_at (nullable), authorization_justification. **Decision has no effect until authorization_status = APPROVED.** The API always returns the computed value and its authorization status as separate fields so the frontend must render "system recommendation (pending authorization)" distinctly from "authorized decision" — a bare SCALE is never ambiguous.
- **procurement_routes** — decision_id, route: `REQUEST_MORE_EVIDENCE / SANDBOX_EXTENSION / TARGETED_FOLLOW_UP_PILOT / TRIAL_ORDER / DIRECT_PROCUREMENT / PHASED_PROCUREMENT`, justification, selected_by. **Row can only be created when decision.value = SCALE** (service-level assertion + DB check constraint).

### Replication

- **replication_requests** — department_id, problem_summary, context snapshot (JSON of dept profile at request time).
- **replication_analyses** — request_id, source_passport_id, similarity scores: problem, technology, infrastructure, data, environment (floats 0–1), reusable_evidence (JSON list), revalidate_evidence (JSON list), recommendation (`STOP / ADAPT / REVALIDATE / SCALE`), human_decision, decided_by.
- **passport_embeddings** — passport_id, chunk_text, embedding `vector(768)` (pgvector).

### Templates, Payments, Audit

- **templates** — template_type (7 categories per deck §21: problem statement, evaluation criteria, pilot agreement, data/IP clause, cybersecurity, risk management, procurement pathway), version, status: `DRAFT → LEGAL_APPROVED`, content (structured JSON).
- **template_usages** — template_id, entity_type (`CHALLENGE / PILOT`), entity_id, snapshot (JSON) — later template revisions never retroactively change issued documents.
- **payment_records** — milestone_id, amount, status: `PENDING → INVOICED → APPROVED → DISBURSED | REJECTED`, approved_by, rejected_reason.
- **audit_logs** — id, user_id, action, entity_type, entity_id, old_values (JSON), new_values (JSON), created_at. Append-only: no update/delete endpoints + Postgres rule blocking UPDATE/DELETE.

### Hard constraints (enforced in code + DB where possible)

1. Exactly one passport per pilot.
2. Decision enum is exactly 4 values; no PROCEED, no PASS/FAIL as decision values.
3. Procurement route unreachable unless decision = SCALE.
4. Decision inert until human-authorized.
5. Milestone payment approval requires milestone status = VERIFIED.
6. Passport finalization requires pilot status in (COMPLETED, FAILED, TERMINATED) — failed pilots get passports too (deck §9).

## 5. Auth & RBAC

- `POST /api/auth/register` — email + password + role + profile payload (DEPT_OWNER → department details; STARTUP → startup details; ADMIN created only via seed script).
- `POST /api/auth/login` → `{access_token, user}`. JWT claims: `sub` (user id), `role`, `portal` (`A` or `B`).
- `GET /api/auth/me`.

Three enforcement layers:

1. **Router-level** — `require_role(...)` dependency.
2. **Object-level** — ownership in services: STARTUP sees only own proposals/evidence/payments; DEPT_OWNER only own department's challenges; PILOT_MANAGER only assigned pilots.
3. **Trust-zone** — STARTUP can never reach any Portal-B endpoint, enforced via `portal` claim guard (single choke point, deck §17).

### Role capability matrix

| Role | Portal | Capabilities |
|---|---|---|
| STARTUP | A | own profile, browse challenges, submit proposals, upload evidence, accept pilot terms, own milestones/payments/outcome |
| DEPT_OWNER | B | own dept challenges, view proposals, final selection, dept analytics |
| PILOT_MANAGER | B | assigned pilots, milestones, status, dashboards |
| EVALUATOR | B | score proposals (both gates), verify/reject evidence |
| PROCUREMENT_AUTHORITY | B | authorize decisions, select route post-SCALE |
| FINANCE | B | approve payments on verified milestones |
| ADMIN | B | all + user mgmt, templates, seed, statewide analytics, audit read |

## 6. API Surface (prefix `/api`)

**auth** — register, login, me.

**orgs** — `GET/PUT /startups/me`; `GET /departments`, `GET /departments/{id}` (context profile visible — feeds replication); ADMIN: `POST /departments`, `PATCH /departments/{id}/context` (update context profile — real gap for production, low demo priority, cheap to include).

**challenges** — DEPT_OWNER: `POST /challenges`, `PATCH /challenges/{id}`, `POST /challenges/{id}/publish`, `POST /challenges/{id}/close`, `GET /challenges/{id}/proposals`; criteria CRUD `POST /challenges/{id}/criteria`; Startup: `GET /challenges` (browse, filter domain/status), `GET /challenges/{id}`.

**proposals** — Startup: `POST /challenges/{id}/proposals`, `GET /proposals/mine`, `GET /proposals/{id}`; `POST /proposals/{id}/run-eligibility` (deterministic checks; ambiguous → PENDING_MANUAL); ADMIN: `POST /eligibility-checks/{id}/waive` (justification mandatory); EVALUATOR: `POST /proposals/{id}/scores`, `GET /proposals/{id}/scores` (deterministic weighted ranking); DEPT_OWNER: `POST /proposals/{id}/select` (creates pilot + passport); risk-equivalent: `GET/POST /proposals/{id}/risk-analysis`.

**pilots** — DEPT_OWNER: `POST /proposals/{id}/pilot` (scope, milestones, KPIs, risks, constraints, data/IP); Startup: `POST /pilots/{id}/accept-terms`; PILOT_MANAGER: `GET /pilots`, `PATCH /pilots/{id}/status`, `GET /pilots/{id}/dashboard`; nested CRUD: milestones, kpis, risks, constraints.

**evidence** — Startup: `POST /pilots/{id}/evidence` (multipart), `GET /pilots/{id}/evidence`; `POST /evidence/{id}/extract` (AI extraction → fills extracted_data, ai_confidence; high-confidence non-critical auto-approves per triage); EVALUATOR: `POST /evidence/{id}/validate`.

**passports** — `GET /pilots/{id}/passport`, `GET /passports/{id}`; auto-populated as lifecycle progresses; `POST /passports/{id}/finalize`.

**decisions** — `POST /pilots/{id}/decision/compute` (deterministic engine + AI-drafted explanation, labeled); PROCUREMENT_AUTHORITY: `POST /decisions/{id}/authorize` (approve/reject + justification → immutable audit); if SCALE: `POST /decisions/{id}/route`.

**replication** — govt roles: `POST /replication/requests` (problem + context) → matched passports via semantic search; `POST /replication/requests/{id}/analyze` (5-dimension comparison + reuse/revalidate split + recommendation); `GET /replication/analyses/{id}`; `POST /replication/analyses/{id}/resolve` (human decision). **Integration point (deferred, honest-answer-if-asked):** resolving a replication analysis with ACCEPT does not yet auto-create a follow-up pilot — the natural handoff is "next integration point" wiring `replication_analyses.resolution → proposals/challenges` creation. MVP demo stops at the recommendation + human resolution screen.

**payments** — `POST /milestones/{id}/invoice` (STARTUP), `POST /payments/{id}/approve` (FINANCE, requires VERIFIED milestone), `POST /payments/{id}/disburse`, `POST /payments/{id}/reject`.

**templates** — ADMIN: CRUD + `POST /templates/{id}/approve`; `GET /templates?type=` returns latest LEGAL_APPROVED, used to pre-fill Challenge/Pilot builders.

**search** — `GET /search/pilots?q=` hybrid semantic + keyword over finalized passports.

**analytics** — `GET /analytics/pipeline` (challenges/pilots/decisions by status), `GET /analytics/replication` (reuse stats); ADMIN statewide, DEPT_OWNER dept-scoped.

**audit** — `GET /audit/logs?entity=&user=&action=&from=&to=` (ADMIN, paginated).

Cross-cutting: all list endpoints paginated; consistent error envelope; OpenAPI at `/docs` serves as the frontend contract later.

## 7. AI Layer (`app/ai/`)

Provider interface `EvidenceAI`: `extract`, `embed`, `compare_contexts`, `draft_explanation`. Implementations: `gemini.py`, `mock.py` (deterministic — hashing embeddings, rule-based extraction so the full pipeline is testable offline). `factory.py` selects via `AI_PROVIDER`.

1. **extract(evidence_item)** — structured JSON-schema prompt → `extracted_data`, `confidence` (0–1), `source_span`. Every field carries source trace (anti-hallucination, deck §26). Status: UNVERIFIED → AI_EXTRACTED only.
2. **embed(texts)** — text-embedding-004 → 768-dim. Embedded content: problem statement + tech + results + lessons per passport (chunked). Mock: deterministic hash vectors.
3. **compare_contexts(new, historical)** — dimension score = `0.6 × deterministic enum-match + 0.4 × LLM semantic similarity` (deterministic floor prevents AI swings). Enum dimensions from context profiles; narrative dimensions (problem/tech/data) LLM-scored.
4. **draft_explanation(decision_output)** — prose narrative stored with `drafted_by="AI"` label; UI shows it as a draft, never a verdict.

AI failures degrade gracefully: `AIProviderError` → evidence stays UNVERIFIED, 503 with retry hint. No AI call ever blocks a workflow's non-AI path.

## 8. Search

Hybrid over finalized passports:

- Semantic: pgvector cosine (`<=>`) on passport_embeddings.
- Keyword: Postgres tsvector on problem statement, lessons, KPI names.
- Merge: `0.7 × semantic + 0.3 × keyword`, match reasons returned.

Indexing trigger: passport finalization → embedding runs synchronously (no queue needed for one Gemini call).

## 9. Deterministic Rules Engines (`core/rules/`, pure Python)

**eligibility.py** — checkers per criterion type: TURNOVER (startup.annual_turnover op threshold), EXPERIENCE (prior_deployments), DPIIT (registered), CUSTOM (admin-reviewed → PENDING_MANUAL). FAIL + waiver_allowed → PENDING_MANUAL queue. Waivers require justification; recorded on check row + audit log.

**evaluation.py** — weighted scoring: raw 0–10 per dimension × weight → gate score → overall deterministic ranking. Weights configurable per challenge; defaults: Impact 35, Cost 20, Maturity 15, Ops 10, Security 10, Adoption 5, Scalability 5 (deck §24). Engine ranks; humans select.

**decision.py** — inputs: verified KPI attainment (per-KPI actual vs target with direction), validation coverage, cost performance, unresolved critical risks. Thresholds env-configurable:

- SCALE: KPI attainment ≥ 80% AND validation coverage ≥ 90% AND no unresolved critical risks
- ADAPT: attainment ≥ 60% (but below SCALE bar)
- REVALIDATE: context changed OR validation coverage < 60%
- STOP: attainment < 40% OR unresolved critical risk OR cost > 2× estimate

Output: score_breakdown JSON (the "why") + 4-value decision. Precedence: STOP > REVALIDATE > SCALE > ADAPT.

**risk_equivalent.py** — input: failed criterion + startup profile. Static safeguards matrix (requirement type → underlying risk → alternative evidence → standard safeguards: milestone-based contract, phased deployment, smaller initial order, performance checkpoints). LLM may enrich alternative-evidence suggestions; matrix constrains proposals. Output → human reviewer, decision PENDING. Never grants exemptions.

**triage.py** — `ai_confidence ≥ 0.9` AND NOT safety_critical AND NOT cost-critical → auto-approve (EVALUATOR_VERIFIED, auto_approved=true); else evaluator queue. Thresholds in config.

## 10. Audit Trail

- Single write path: `core/audit.py :: audit(db, user, action, entity, entity_id, old, new)`.
- Capture points: auth events, eligibility + waivers, scoring, selection, all status transitions, evidence validation, decision compute/authorize, route selection, payment approvals, replication resolutions — full 22-step flow traceability.
- Append-only: no endpoints + DB-level rule blocking UPDATE/DELETE.
- Admin-only paginated read with filters.

## 11. Error Handling

- Envelope: `{detail, code, context?}`. Hierarchy: `AppError` → `PermissionDenied`, `InvalidStateTransition`, `AIProviderError`, `NotFound`, `ValidationError`.
- Centralized `assert_transition(current, allowed_map)` for state machines (challenges, proposals, pilots, milestones, payments, passports, templates) — the #1 bug class.
- Pydantic schemas reject payloads at boundary (422); services assume clean input.

## 12. Testing Strategy

- pytest + httpx TestClient; test Postgres = same docker container, `govinnovate_test` DB; Alembic migrations run per session.
- Tiers:
  1. **Unit (rules)** — decision engine threshold edges (79.9 vs 80), eligibility per criterion, triage boundaries, state transition tables.
  2. **Integration (workflow)** — the 22-step flow as executable code; the §32 demo scenario (3 departments: success → replication match → failed-pilot warning) as a test.
  3. **AI contract** — provider interface tests run against mock; gemini impl skipped without key.
- `scripts/seed.py` — admin, departments with context profiles, startups, the §32 water-domain dataset (clearly labeled synthetic).

## 13. Build Order

| # | Phase | Contents | Exit criteria |
|---|---|---|---|
| 1 | Foundation | docker-compose, scaffold, config, database, Alembic | health check + migration green |
| 2 | Identity | users, bcrypt, JWT, RBAC deps | auth tests green |
| 3 | Core domain | orgs, challenges, eligibility rules + checks + waivers | unit + API tests green |
| 4 | Selection | proposals, risk-equivalent engine, scoring, select→pilot | workflow test A green |
| 5 | Pilot execution | pilots, milestones, KPIs, risks, constraints, payments | workflow test B green |
| 6 | Evidence | evidence, AI extraction (mock + gemini), triage, validation | unit + API tests green |
| 7 | Passport | passport lifecycle, finalization, embeddings | workflow test C green |
| 8 | Decisions | decision engine, authorization gate, routes | workflow test D green |
| 9 | Replication | semantic search, context comparison, reuse split | §32 demo test green |
| 10 | Polish | templates, analytics, audit read, seed, README | seed runs end-to-end |

Phases 1–5 deterministic foundations; 6–9 the AI/differentiator layer. Each phase ends green before the next begins.

## 14. Explicitly Out of Scope (P2, deck §30)

Real payment automation; GeM integration; predictive milestone-risk models; failure-pattern clustering; government-wide knowledge graph; long-term post-scale monitoring; frontend (separate spec); notifications (in-app/email); AI-failure retry UI (API returns retryable 503; frontend polling/retry is a frontend concern); replication-resolve → auto pilot creation (documented as next integration point in §6).
