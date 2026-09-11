from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

WATER_PROBLEM = ("Detect and localize water pipeline leaks across the "
                "distribution network to reduce non-revenue water.")


def _register_dept_owner(email, code):
    resp = client.post("/api/auth/register", json={
        "email": email, "password": "Passw0rd!123", "full_name": "Dept Owner",
        "role": "DEPT_OWNER",
        "department": {
            "name": f"Dept {code}", "code": code,
            "connectivity_tier": "MEDIUM", "power_reliability": "STABLE",
            "it_maturity": "MEDIUM", "settlement_type": "URBAN",
            "terrain_type": "PLAIN",
        },
    })
    assert resp.status_code == 201, resp.text
    return resp.json()["access_token"]


def _register_startup(email):
    resp = client.post("/api/auth/register", json={
        "email": email, "password": "Passw0rd!123", "full_name": "Founder",
        "role": "STARTUP", "startup": {"name": f"Startup {email}"},
    })
    assert resp.status_code == 201, resp.text
    return resp.json()["access_token"]


def _create_challenge(token, problem_statement=WATER_PROBLEM, title="AI pipeline leak detection"):
    resp = client.post("/api/challenges", json={
        "title": title,
        "problem_statement": problem_statement,
        "baseline": "38% non-revenue water",
        "target": "Under 15% non-revenue water",
        "domain": "water", "budget": 1500000.0,
    }, headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 201, resp.text
    return resp.json()


def _published_challenge(token, **kwargs):
    ch = _create_challenge(token, **kwargs)
    resp = client.post(f"/api/challenges/{ch['id']}/publish", headers={
        "Authorization": f"Bearer {token}"})
    assert resp.status_code == 200, resp.text
    return ch


def _discover(token, ch_id):
    resp = client.post(f"/api/challenges/{ch_id}/discover", headers={
        "Authorization": f"Bearer {token}"})
    assert resp.status_code == 200, resp.text
    return resp.json()


def _discovered(token, ch_id):
    resp = client.get(f"/api/challenges/{ch_id}/discovered", headers={
        "Authorization": f"Bearer {token}"})
    assert resp.status_code == 200, resp.text
    return resp.json()


def test_discovery_stores_rows_sorted_desc():
    token = _register_dept_owner("disc1@maharashtra.gov.in", "DSC1")
    ch = _published_challenge(token)
    rows = _discover(token, ch["id"])
    assert len(rows) > 0
    assert all(r["source"] == "seed_index" for r in rows)
    scores = [r["relevance_score"] for r in rows]
    assert scores == sorted(scores, reverse=True)
    assert any("hydro" in r["name"].lower() or "water" in r["sector"].lower()
               for r in rows)


def test_rerun_upserts_no_duplicates():
    token = _register_dept_owner("disc2@maharashtra.gov.in", "DSC2")
    ch = _published_challenge(token)
    first = _discover(token, ch["id"])
    second = _discover(token, ch["id"])
    assert len(first) == len(second) > 0
    names_first = sorted(r["name"] for r in first)
    names_second = sorted(r["name"] for r in second)
    assert names_first == names_second
    listing = _discovered(token, ch["id"])
    assert listing["total"] == len(first)


def test_discovery_visible_only_to_owning_dept():
    a = _register_dept_owner("disc3@maharashtra.gov.in", "DSC3")
    ch = _published_challenge(a)
    _discover(a, ch["id"])
    b = _register_dept_owner("disc4@maharashtra.gov.in", "DSC4")
    resp = client.get(f"/api/challenges/{ch['id']}/discovered", headers={
        "Authorization": f"Bearer {b}"})
    assert resp.status_code == 403
    resp = client.post(f"/api/challenges/{ch['id']}/discover", headers={
        "Authorization": f"Bearer {b}"})
    assert resp.status_code == 403
    # unknown challenge -> 404 (existence-hiding)
    resp = client.get("/api/challenges/999999/discovered", headers={
        "Authorization": f"Bearer {a}"})
    assert resp.status_code == 404


def test_startup_cannot_discover():
    token = _register_dept_owner("disc5@maharashtra.gov.in", "DSC5")
    ch = _published_challenge(token)
    s = _register_startup("discstartup@acme.in")
    resp = client.post(f"/api/challenges/{ch['id']}/discover", headers={
        "Authorization": f"Bearer {s}"})
    assert resp.status_code == 403
    resp = client.get(f"/api/challenges/{ch['id']}/discovered", headers={
        "Authorization": f"Bearer {s}"})
    assert resp.status_code == 403


def test_invitation_create_201_with_code():
    token = _register_dept_owner("disc6@maharashtra.gov.in", "DSC6")
    ch = _published_challenge(token)
    rows = _discover(token, ch["id"])
    resp = client.post(f"/api/challenges/{ch['id']}/invitations", json={
        "discovered_startup_id": rows[0]["id"],
        "email": "founder@hydrosense.example.in",
    }, headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 201, resp.text
    body = resp.json()
    assert body["invite_code"]
    assert body["status"] == "SENT"
    assert body["discovered_startup_id"] == rows[0]["id"]


def test_duplicate_active_invite_409():
    token = _register_dept_owner("disc7@maharashtra.gov.in", "DSC7")
    ch = _published_challenge(token)
    rows = _discover(token, ch["id"])
    payload = {"discovered_startup_id": rows[0]["id"],
               "email": "dupe@acme.in"}
    resp = client.post(f"/api/challenges/{ch['id']}/invitations",
                       json=payload, headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 201
    resp = client.post(f"/api/challenges/{ch['id']}/invitations",
                       json=payload, headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 409
    # a different email is fine
    resp = client.post(f"/api/challenges/{ch['id']}/invitations", json={
        "discovered_startup_id": rows[0]["id"],
        "email": "other@acme.in",
    }, headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 201


def test_invite_list_ownership():
    a = _register_dept_owner("disc8@maharashtra.gov.in", "DSC8")
    ch = _published_challenge(a)
    rows = _discover(a, ch["id"])
    client.post(f"/api/challenges/{ch['id']}/invitations", json={
        "discovered_startup_id": rows[0]["id"], "email": "who@acme.in",
    }, headers={"Authorization": f"Bearer {a}"})
    b = _register_dept_owner("disc9@maharashtra.gov.in", "DSC9")
    resp = client.get(f"/api/challenges/{ch['id']}/invitations", headers={
        "Authorization": f"Bearer {b}"})
    assert resp.status_code == 403
    resp = client.get(f"/api/challenges/{ch['id']}/invitations", headers={
        "Authorization": f"Bearer {a}"})
    assert resp.status_code == 200
    body = resp.json()
    assert body["total"] == 1
    assert body["items"][0]["status"] == "SENT"
    assert body["items"][0]["invite_code"]


def test_invitation_email_validation_422():
    token = _register_dept_owner("disc9b@maharashtra.gov.in", "DS9B")
    ch = _published_challenge(token)
    rows = _discover(token, ch["id"])
    resp = client.post(f"/api/challenges/{ch['id']}/invitations", json={
        "discovered_startup_id": rows[0]["id"], "email": "not-an-email",
    }, headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 422


def test_manual_discovery_provider_failure_503(monkeypatch):
    from app.ai.base import AIProviderUnavailable
    from app.core.database import SessionLocal
    from app.models.audit import AuditLog
    from app.models.enums import AuditAction
    from app.modules.discovery import service as discovery_service

    class _Boom:
        def discover_startups(self, problem_statement, domain,
                              location_hint="Maharashtra India"):
            raise AIProviderUnavailable("provider down (test)")

    token = _register_dept_owner("disc10@maharashtra.gov.in", "DSC10")
    ch = _published_challenge(token, problem_statement=(
        "Manage irrigation canal telemetry and groundwater flow meter data "
        "for the water resources department across river basins."))
    monkeypatch.setattr(discovery_service, "get_ai_provider", lambda: _Boom())
    resp = client.post(f"/api/challenges/{ch['id']}/discover", headers={
        "Authorization": f"Bearer {token}"})
    assert resp.status_code == 503
    assert resp.json()["code"] == "AI_PROVIDER_ERROR"
    sess = SessionLocal()
    try:
        runs = sess.query(AuditLog).filter(
            AuditLog.entity_type == "DiscoveryRun",
            AuditLog.action == AuditAction.COMPUTE,
            AuditLog.entity_id == str(ch["id"])).all()
        failed = [r for r in runs if r.new_values.get("status") == "failed"]
        assert len(failed) == 1
    finally:
        sess.close()


def test_auto_discovery_on_publish_fires():
    from app.core.database import SessionLocal
    from app.models.audit import AuditLog
    from app.models.enums import AuditAction
    from app.modules.discovery.models import DiscoveredStartup

    token = _register_dept_owner("disc11@maharashtra.gov.in", "DSC11")
    ch = _published_challenge(token)
    sess = SessionLocal()
    try:
        rows = sess.query(DiscoveredStartup).filter(
            DiscoveredStartup.challenge_id == ch["id"]).all()
        assert len(rows) > 0
        assert all(r.source.value == "seed_index" for r in rows)
        runs = sess.query(AuditLog).filter(
            AuditLog.entity_type == "DiscoveryRun",
            AuditLog.action == AuditAction.COMPUTE,
            AuditLog.entity_id == str(ch["id"])).all()
        assert len(runs) == 1
        assert runs[0].new_values["source"] == "seed_index"
        assert runs[0].new_values["count"] == len(rows)
    finally:
        sess.close()


def test_auto_discovery_failure_never_blocks_publish(monkeypatch):
    from app.core.database import SessionLocal
    from app.models.audit import AuditLog
    from app.models.enums import AuditAction
    from app.modules.discovery import service as discovery_service

    def _boom(problem_statement, domain, location_hint="Maharashtra India"):
        raise RuntimeError("SDK meltdown")

    class _FailingProvider:
        discover_startups = staticmethod(_boom)

    monkeypatch.setattr(discovery_service, "get_ai_provider",
                        lambda: _FailingProvider())
    token = _register_dept_owner("disc12@maharashtra.gov.in", "DSC12")
    ch = _create_challenge(token, problem_statement=(
        "Track student attendance and digital literacy outcomes in government "
        "schools and district education offices."))
    resp = client.post(f"/api/challenges/{ch['id']}/publish", headers={
        "Authorization": f"Bearer {token}"})
    assert resp.status_code == 200, resp.text
    assert resp.json()["status"] == "PUBLISHED"
    sess = SessionLocal()
    try:
        failures = sess.query(AuditLog).filter(
            AuditLog.entity_type == "DiscoveryRun",
            AuditLog.action == AuditAction.COMPUTE,
            AuditLog.entity_id == str(ch["id"])).all()
        assert len(failures) == 1
        assert failures[0].new_values["status"] == "failed"
        assert "SDK meltdown" in failures[0].new_values["error"]
    finally:
        sess.close()


def test_pagination_envelope_and_bounds():
    token = _register_dept_owner("disc13@maharashtra.gov.in", "DSC13")
    ch = _published_challenge(token)
    _discover(token, ch["id"])
    resp = client.get(f"/api/challenges/{ch['id']}/discovered",
                      params={"page": 1, "size": 2},
                      headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    body = resp.json()
    assert set(body) == {"items", "page", "size", "total"}
    assert body["page"] == 1 and body["size"] == 2
    assert len(body["items"]) == min(2, body["total"])
    resp = client.get(f"/api/challenges/{ch['id']}/discovered",
                      params={"page": 0},
                      headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 422
    resp = client.get(f"/api/challenges/{ch['id']}/discovered",
                      params={"size": 0},
                      headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 422
    resp = client.get(f"/api/challenges/{ch['id']}/discovered",
                      params={"size": 101},
                      headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 422


def test_discovered_endpoint_sorts_desc():
    token = _register_dept_owner("disc14@maharashtra.gov.in", "DSC14")
    ch = _published_challenge(token)
    _discover(token, ch["id"])
    body = _discovered(token, ch["id"])
    scores = [r["relevance_score"] for r in body["items"]]
    assert scores == sorted(scores, reverse=True)


def test_admin_can_run_discovery():
    token = _register_dept_owner("disc15@maharashtra.gov.in", "DSC15")
    ch = _published_challenge(token)
    admin = _admin_token()
    resp = client.post(f"/api/challenges/{ch['id']}/discover", headers={
        "Authorization": f"Bearer {admin}"})
    assert resp.status_code == 200
    resp = client.get(f"/api/challenges/{ch['id']}/discovered", headers={
        "Authorization": f"Bearer {admin}"})
    assert resp.status_code == 200


def test_publish_survives_discovery_mid_write_db_error(monkeypatch):
    """F2: discovery failing AFTER DB writes must not 500 the publish —
    rollback, re-apply publish state, and audit both events."""
    from sqlalchemy import text

    from app.core.database import SessionLocal
    from app.models.audit import AuditLog
    from app.models.enums import (AuditAction, ChallengeStatus)
    from app.modules.challenges.models import Challenge as ChallengeModel
    from app.modules.discovery import service as discovery_service

    def _db_boom(db, actor_user_id, challenge):
        # fails mid-flight INSIDE the transaction: the session executed a
        # statement that errored, so it now needs rollback before any audit
        db.execute(text("SELECT 1/0"))

    monkeypatch.setattr(discovery_service, "run_discovery", _db_boom)
    token = _register_dept_owner("disc16@maharashtra.gov.in", "DSC16")
    ch = _create_challenge(token, problem_statement=(
        "Track student attendance and digital literacy outcomes in government "
        "schools and district education offices."))
    resp = client.post(f"/api/challenges/{ch['id']}/publish", headers={
        "Authorization": f"Bearer {token}"})
    assert resp.status_code == 200, resp.text
    assert resp.json()["status"] == "PUBLISHED"
    sess = SessionLocal()
    try:
        row = sess.get(ChallengeModel, ch["id"])
        assert row.status == ChallengeStatus.PUBLISHED
        assert row.evaluation_weights is not None
        assert row.evaluation_weights["impact"] == 35.0
        publishes = sess.query(AuditLog).filter(
            AuditLog.entity_type == "Challenge",
            AuditLog.action == AuditAction.PUBLISH,
            AuditLog.entity_id == str(ch["id"])).all()
        assert len(publishes) == 1
        assert publishes[0].new_values == {"status": "PUBLISHED"}
        failures = sess.query(AuditLog).filter(
            AuditLog.entity_type == "DiscoveryRun",
            AuditLog.action == AuditAction.COMPUTE,
            AuditLog.entity_id == str(ch["id"])).all()
        assert len(failures) == 1
        assert failures[0].new_values["status"] == "failed"
    finally:
        sess.close()


def test_discovery_same_batch_duplicate_collapses_to_best_score(monkeypatch):
    """F3: two same-name items in one provider response must not blow up
    on uq_discovered_challenge_name — one row survives with the best score."""
    from app.modules.discovery import service as discovery_service

    class _DupProvider:
        def discover_startups(self, problem_statement, domain,
                              location_hint="Maharashtra India"):
            return [
                {"name": "TwinWater Analytics", "website": "https://a.example.in",
                 "sector": "Water", "location": "Pune",
                 "relevance_score": 0.2, "relevance_evidence": "first"},
                {"name": "TwinWater Analytics", "website": "https://b.example.in",
                 "sector": "Water", "location": "Pune",
                 "relevance_score": 0.9, "relevance_evidence": "second"},
            ]

    monkeypatch.setattr(discovery_service, "get_ai_provider",
                        lambda: _DupProvider())
    token = _register_dept_owner("disc17@maharashtra.gov.in", "DSC17")
    ch = _published_challenge(token)
    rows = _discover(token, ch["id"])
    twins = [r for r in rows if r["name"] == "TwinWater Analytics"]
    assert len(twins) == 1
    assert twins[0]["relevance_score"] == 0.9
    assert twins[0]["relevance_evidence"] == "second"
    assert twins[0]["website"] == "https://b.example.in"


def test_upsert_one_recovers_from_unique_race(monkeypatch):
    """F3: when the pre-check misses an already-committed row (concurrent
    INSERT race), the IntegrityError retry must land on the update path."""
    from sqlalchemy import false as sa_false

    from app.core.database import SessionLocal
    from app.models.enums import DiscoverySource
    from app.modules.challenges.models import Challenge as ChallengeModel
    from app.modules.discovery import service as discovery_service
    from app.modules.discovery.models import DiscoveredStartup

    token = _register_dept_owner("disc18@maharashtra.gov.in", "DSC18")
    ch = _create_challenge(token)

    seed = SessionLocal()
    seed.add(DiscoveredStartup(
        challenge_id=ch["id"], name="Race Winner", website="w", sector="s",
        location="l", source=DiscoverySource.SEED_INDEX,
        relevance_score=0.1, relevance_evidence="committed by another session"))
    seed.commit()
    seed.close()

    s = SessionLocal()
    try:
        challenge = s.get(ChallengeModel, ch["id"])
        real_query = s.query
        hidden = []

        def hooked_query(*entities, **kw):
            q = real_query(*entities, **kw)
            if entities and entities[0] is DiscoveredStartup and not hidden:
                hidden.append(1)  # first pre-check misses the committed row
                return q.filter(sa_false())
            return q

        monkeypatch.setattr(s, "query", hooked_query)
        discovery_service._upsert_one(
            s, challenge,
            {"name": "Race Winner", "website": "w2", "sector": "s2",
             "location": "l2", "relevance_score": 0.88,
             "relevance_evidence": "raced update"},
            DiscoverySource.GEMINI_SEARCH)
        s.commit()
        rows = s.query(DiscoveredStartup).filter_by(
            challenge_id=ch["id"], name="Race Winner").all()
        assert len(rows) == 1
        assert rows[0].relevance_score == 0.88
        assert rows[0].relevance_evidence == "raced update"
    finally:
        s.close()


def test_gemini_mode_merges_seed_index(monkeypatch):
    """F5: gemini provider results must be merged with the seed index,
    deduped by best score, capped at 10."""
    from app.ai.seed_index import SEED_INDEX
    from app.modules.discovery import service as discovery_service

    class _CannedGemini:
        def discover_startups(self, problem_statement, domain,
                              location_hint="Maharashtra India"):
            return [{
                "name": "GeminiFound Co",
                "website": "https://geminifound.example.in",
                "sector": "Water Technology",
                "location": "Mumbai, Maharashtra",
                "relevance_score": 0.97,
                "relevance_evidence": "canned gemini hit",
            }]

    monkeypatch.setenv("AI_PROVIDER", "gemini")
    monkeypatch.setattr(discovery_service, "get_ai_provider",
                        lambda: _CannedGemini())
    token = _register_dept_owner("disc19@maharashtra.gov.in", "DSC19")
    ch = _published_challenge(token)
    rows = _discover(token, ch["id"])
    names = {r["name"] for r in rows}
    assert "GeminiFound Co" in names
    seed_names = {e["name"] for e in SEED_INDEX}
    assert names & seed_names  # at least one seed-index item merged in
    assert all(r["source"] == "gemini_search" for r in rows)
    assert len(rows) <= 10
    scores = [r["relevance_score"] for r in rows]
    assert scores == sorted(scores, reverse=True)
    # every name is unique (dedupe by name)
    assert len(names) == len(rows)


def _admin_token():
    from app.core.database import SessionLocal
    from app.core.security import hash_password
    from app.models.enums import UserRole
    from app.modules.auth.models import User
    s = SessionLocal()
    if s.query(User).filter_by(email="admin-disc@gov.in").first() is None:
        s.add(User(email="admin-disc@gov.in",
                   password_hash=hash_password("Adm1nPass!23"),
                   role=UserRole.ADMIN, full_name="Admin"))
        s.commit()
    s.close()
    return client.post("/api/auth/login", json={
        "email": "admin-disc@gov.in", "password": "Adm1nPass!23"}).json()["access_token"]
