from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def _dept(email, code):
    resp = client.post("/api/auth/register", json={
        "email": email, "password": "Passw0rd!123", "full_name": "Dept Owner",
        "role": "DEPT_OWNER",
        "department": {"name": f"Dept {code}", "code": code,
                       "connectivity_tier": "MEDIUM", "power_reliability": "STABLE",
                       "it_maturity": "MEDIUM", "settlement_type": "URBAN",
                       "terrain_type": "PLAIN"},
    })
    assert resp.status_code == 201, resp.text
    return resp.json()["access_token"]


def _startup(email, name, profile=None):
    resp = client.post("/api/auth/register", json={
        "email": email, "password": "Passw0rd!123", "full_name": "Founder",
        "role": "STARTUP", "startup": {"name": name},
    })
    assert resp.status_code == 201, resp.text
    token = resp.json()["access_token"]
    if profile:
        resp = client.put("/api/startups/me", json=profile,
                          headers={"Authorization": f"Bearer {token}"})
        assert resp.status_code == 200, resp.text
    return token


def _evaluator(email):
    resp = client.post("/api/auth/register", json={
        "email": email, "password": "Passw0rd!123", "full_name": "Evaluator",
        "role": "EVALUATOR",
    })
    assert resp.status_code == 201, resp.text
    body = resp.json()
    return body["access_token"], body["user"]["id"]


def _admin_token():
    from app.core.database import SessionLocal
    from app.core.security import hash_password
    from app.models.enums import UserRole
    from app.modules.auth.models import User
    s = SessionLocal()
    if s.query(User).filter_by(email="admin@gov.in").first() is None:
        s.add(User(email="admin@gov.in",
                   password_hash=hash_password("Adm1nPass!23"),
                   role=UserRole.ADMIN, full_name="Admin"))
        s.commit()
    s.close()
    return client.post("/api/auth/login", json={
        "email": "admin@gov.in", "password": "Adm1nPass!23"}).json()["access_token"]


def _challenge_with_criteria(dept_token):
    resp = client.post("/api/challenges", json={
        "title": "Risk-qual challenge",
        "problem_statement": "Pilot low-cost water quality sensing for rural supply schemes.",
        "domain": "water", "budget": 1200000.0,
    }, headers={"Authorization": f"Bearer {dept_token}"})
    assert resp.status_code == 201, resp.text
    ch = resp.json()
    resp = client.post(f"/api/challenges/{ch['id']}/criteria", json={
        "criterion_type": "TURNOVER", "operator": "GTE",
        "threshold": 1000000.0, "waiver_allowed": True,
    }, headers={"Authorization": f"Bearer {dept_token}"})
    assert resp.status_code == 201, resp.text
    turnover_crit = resp.json()
    resp = client.post(f"/api/challenges/{ch['id']}/criteria", json={
        "criterion_type": "DPIIT", "operator": "GTE",
    }, headers={"Authorization": f"Bearer {dept_token}"})
    assert resp.status_code == 201, resp.text
    resp = client.post(f"/api/challenges/{ch['id']}/publish",
                       headers={"Authorization": f"Bearer {dept_token}"})
    assert resp.status_code == 200, resp.text
    return ch, turnover_crit


def _proposal(startup_token, challenge_id):
    resp = client.post(f"/api/challenges/{challenge_id}/proposals", json={
        "technical_summary": "Low-cost sensing kit with offline-first data sync for villages.",
        "cost_estimate": 400000.0,
    }, headers={"Authorization": f"Bearer {startup_token}"})
    assert resp.status_code == 201, resp.text
    return resp.json()


def _setup(tag):
    dept = _dept(f"rq-dept-{tag}@maharashtra.gov.in", f"RQ{tag}")
    ch, _ = _challenge_with_criteria(dept)
    startup = _startup(f"rq-start-{tag}@acme.in", f"RqTech{tag}", {
        "annual_turnover": 100000.0, "runway_months": 14, "team_size": 6,
        "prior_deployments": 1, "sectors": ["water"]})
    prop = _proposal(startup, ch["id"])
    assert prop["status"] == "SUBMITTED"
    assert all(c["result"] == "PENDING_MANUAL" for c in prop["checks"])
    ev_token, _ = _evaluator(f"rq-eval-{tag}@gov.in")
    return {"dept": dept, "ch": ch, "startup": startup,
            "prop": prop, "ev": ev_token}


def _generate(dept_token, proposal_id):
    return client.post(f"/api/proposals/{proposal_id}/risk-analysis",
                       headers={"Authorization": f"Bearer {dept_token}"})


def test_generate_creates_one_analysis_per_pending_check():
    ctx = _setup("gen")
    resp = _generate(ctx["dept"], ctx["prop"]["id"])
    assert resp.status_code == 201, resp.text
    items = resp.json()
    assert len(items) == 2
    by_crit = {a["criterion_id"]: a for a in items}
    assert set(by_crit) == {c["criterion_id"] for c in ctx["prop"]["checks"]}
    turnover = next(a for a in items
                    if a["underlying_risk"] == "Financial capacity to execute the contract")
    assert turnover["residual_risk"] == "HIGH"  # margin 0.9 >= 0.25
    assert turnover["safeguards"] == [
        "milestone-based contracting", "smaller initial order",
        "pilot-first validation"]
    assert any(e["type"] == "runway" for e in turnover["alternative_evidence"])
    assert all(a["human_decision"] == "PENDING" for a in items)
    assert all(a["proposal_id"] == ctx["prop"]["id"] for a in items)
    assert set(items[0]) == {"id", "proposal_id", "criterion_id",
                             "underlying_risk", "alternative_evidence",
                             "residual_risk", "safeguards", "ai_enrichment",
                             "human_decision", "decided_by", "decided_at",
                             "created_at"}


def test_generate_is_idempotent_upsert():
    ctx = _setup("idem")
    first = _generate(ctx["dept"], ctx["prop"]["id"]).json()
    second = _generate(ctx["dept"], ctx["prop"]["id"]).json()
    assert len(first) == len(second) == 2
    assert [a["id"] for a in first] == [a["id"] for a in second]


def test_generate_visibility_and_roles():
    ctx = _setup("vis")
    assert _generate(ctx["dept"], ctx["prop"]["id"]).status_code == 201
    # owning startup can view but not generate
    resp = client.get(f"/api/proposals/{ctx['prop']['id']}/risk-analysis",
                      headers={"Authorization": f"Bearer {ctx['startup']}"})
    assert resp.status_code == 200 and len(resp.json()) == 2
    resp = _generate(ctx["startup"], ctx["prop"]["id"])
    assert resp.status_code == 403
    # evaluator cannot generate
    resp = _generate(ctx["ev"], ctx["prop"]["id"])
    assert resp.status_code == 403
    # cross-dept owner cannot generate
    other = _dept("rq-vis-other@maharashtra.gov.in", "RQVO")
    resp = _generate(other, ctx["prop"]["id"])
    assert resp.status_code == 403
    # admin can generate
    resp = _generate(_admin_token(), ctx["prop"]["id"])
    assert resp.status_code == 201
    # unknown proposal 404
    resp = _generate(ctx["dept"], 999999)
    assert resp.status_code == 404
    # another startup cannot view
    s2 = _startup("rq-vis-s2@acme.in", "RqVisTwo")
    resp = client.get(f"/api/proposals/{ctx['prop']['id']}/risk-analysis",
                      headers={"Authorization": f"Bearer {s2}"})
    assert resp.status_code == 403


def test_decision_accept_promotes_to_eligible_when_last_pending():
    ctx = _setup("acc")
    items = _generate(ctx["dept"], ctx["prop"]["id"]).json()
    for i, a in enumerate(items):
        resp = client.post(f"/api/risk-analyses/{a['id']}/decision",
                           json={"decision": "ACCEPTED",
                                 "note": f"Accept analysis {i}: runway covers delivery risk."},
                           headers={"Authorization": f"Bearer {ctx['ev']}"})
        assert resp.status_code == 200, resp.text
        body = resp.json()
        assert body["human_decision"] == "ACCEPTED"
        assert body["decided_by"] is not None
        assert body["decided_at"] is not None
    # justification references the analysis id
    assert f"(analysis {items[0]['id']})" in _justification(
        ctx["prop"]["id"], items[0]["criterion_id"])
    resp = client.get(f"/api/proposals/{ctx['prop']['id']}",
                      headers={"Authorization": f"Bearer {ctx['dept']}"})
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["status"] == "ELIGIBLE"
    assert all(c["result"] == "WAIVED" for c in body["checks"])


def _justification(proposal_id, criterion_id):
    from app.core.database import SessionLocal
    from app.modules.proposals.models import EligibilityCheck
    s = SessionLocal()
    try:
        row = s.query(EligibilityCheck).filter(
            EligibilityCheck.proposal_id == proposal_id,
            EligibilityCheck.criterion_id == criterion_id).first()
        return row.waiver_justification or ""
    finally:
        s.close()


def test_decision_reject_keeps_pending_manual():
    ctx = _setup("rej")
    items = _generate(ctx["dept"], ctx["prop"]["id"]).json()
    resp = client.post(f"/api/risk-analyses/{items[0]['id']}/decision",
                       json={"decision": "REJECTED",
                             "note": "Reject: safeguards insufficient for this contract size."},
                       headers={"Authorization": f"Bearer {ctx['ev']}"})
    assert resp.status_code == 200, resp.text
    assert resp.json()["human_decision"] == "REJECTED"
    resp = client.get(f"/api/proposals/{ctx['prop']['id']}",
                      headers={"Authorization": f"Bearer {ctx['dept']}"})
    body = resp.json()
    assert body["status"] == "SUBMITTED"
    results = {c["criterion_id"]: c["result"] for c in body["checks"]}
    assert results[items[0]["criterion_id"]] == "PENDING_MANUAL"


def test_regenerate_after_reject_preserves_decided_row():
    from app.core.database import SessionLocal
    from app.modules.riskqual.models import RiskEquivalentAnalysis
    ctx = _setup("r3regen")
    items = _generate(ctx["dept"], ctx["prop"]["id"]).json()
    assert len(items) == 2
    target = items[0]
    resp = client.post(f"/api/risk-analyses/{target['id']}/decision",
                       json={"decision": "REJECTED",
                             "note": "Reject: safeguards insufficient for this contract size."},
                       headers={"Authorization": f"Bearer {ctx['ev']}"})
    assert resp.status_code == 200, resp.text
    # tamper decided row to sentinel values to detect overwrite
    sess = SessionLocal()
    try:
        row = sess.get(RiskEquivalentAnalysis, target["id"])
        row.underlying_risk = "SENTINEL_RISK_DO_NOT_OVERWRITE"
        row.residual_risk = "LOW"
        row.safeguards = ["sentinel-safeguard"]
        row.alternative_evidence = [{"type": "sentinel", "detail": "x"}]
        sess.commit()
    finally:
        sess.close()
    regen = _generate(ctx["dept"], ctx["prop"]["id"]).json()
    by_id = {a["id"]: a for a in regen}
    assert target["id"] in by_id
    after = by_id[target["id"]]
    assert after["human_decision"] == "REJECTED"
    assert after["underlying_risk"] == "SENTINEL_RISK_DO_NOT_OVERWRITE"
    assert after["residual_risk"] == "LOW"
    assert after["safeguards"] == ["sentinel-safeguard"]
    assert after["alternative_evidence"] == [{"type": "sentinel", "detail": "x"}]
    # linked check still PENDING_MANUAL
    resp = client.get(f"/api/proposals/{ctx['prop']['id']}",
                      headers={"Authorization": f"Bearer {ctx['dept']}"})
    results = {c["criterion_id"]: c["result"] for c in resp.json()["checks"]}
    assert results[after["criterion_id"]] == "PENDING_MANUAL"


def test_admin_can_redecide_rejected_to_accepted():
    ctx = _setup("r3admin")
    items = _generate(ctx["dept"], ctx["prop"]["id"]).json()
    # reject everything first via evaluator
    for a in items:
        resp = client.post(f"/api/risk-analyses/{a['id']}/decision",
                           json={"decision": "REJECTED",
                                 "note": "Reject: safeguards insufficient for this contract size."},
                           headers={"Authorization": f"Bearer {ctx['ev']}"})
        assert resp.status_code == 200, resp.text
    admin = _admin_token()
    # ADMIN re-decides each REJECTED -> ACCEPTED
    for i, a in enumerate(items):
        resp = client.post(f"/api/risk-analyses/{a['id']}/decision",
                           json={"decision": "ACCEPTED",
                                 "note": f"Admin override {i}: runway covers delivery risk."},
                           headers={"Authorization": f"Bearer {admin}"})
        assert resp.status_code == 200, resp.text
        assert resp.json()["human_decision"] == "ACCEPTED"
    resp = client.get(f"/api/proposals/{ctx['prop']['id']}",
                      headers={"Authorization": f"Bearer {ctx['dept']}"})
    body = resp.json()
    assert body["status"] == "ELIGIBLE"
    assert all(c["result"] == "WAIVED" for c in body["checks"])


def test_evaluator_redecide_on_rejected_409():
    ctx = _setup("r3eval409")
    items = _generate(ctx["dept"], ctx["prop"]["id"]).json()
    aid = items[0]["id"]
    resp = client.post(f"/api/risk-analyses/{aid}/decision",
                       json={"decision": "REJECTED",
                             "note": "Reject: safeguards insufficient for this contract size."},
                       headers={"Authorization": f"Bearer {ctx['ev']}"})
    assert resp.status_code == 200, resp.text
    resp = client.post(f"/api/risk-analyses/{aid}/decision",
                       json={"decision": "ACCEPTED",
                             "note": "Evaluator tries to re-decide rejected row."},
                       headers={"Authorization": f"Bearer {ctx['ev']}"})
    assert resp.status_code == 409, resp.text


def test_decision_validation_and_conflicts():
    ctx = _setup("conf")
    items = _generate(ctx["dept"], ctx["prop"]["id"]).json()
    aid = items[0]["id"]
    # short note -> 422
    resp = client.post(f"/api/risk-analyses/{aid}/decision",
                       json={"decision": "ACCEPTED", "note": "short"},
                       headers={"Authorization": f"Bearer {ctx['ev']}"})
    assert resp.status_code == 422
    # bad decision literal -> 422
    resp = client.post(f"/api/risk-analyses/{aid}/decision",
                       json={"decision": "MAYBE",
                             "note": "A sufficiently long note here."},
                       headers={"Authorization": f"Bearer {ctx['ev']}"})
    assert resp.status_code == 422
    # non-evaluator (DEPT_OWNER) -> 403
    resp = client.post(f"/api/risk-analyses/{aid}/decision",
                       json={"decision": "ACCEPTED",
                             "note": "Department owner must not decide."},
                       headers={"Authorization": f"Bearer {ctx['dept']}"})
    assert resp.status_code == 403
    # happy-path decision
    resp = client.post(f"/api/risk-analyses/{aid}/decision",
                       json={"decision": "ACCEPTED",
                             "note": "Accept: team and runway mitigate the gap."},
                       headers={"Authorization": f"Bearer {ctx['ev']}"})
    assert resp.status_code == 200, resp.text
    # double decision -> 409
    resp = client.post(f"/api/risk-analyses/{aid}/decision",
                       json={"decision": "REJECTED",
                             "note": "Second decision must be rejected."},
                       headers={"Authorization": f"Bearer {ctx['ev']}"})
    assert resp.status_code == 409
    # unknown analysis -> 404
    resp = client.post("/api/risk-analyses/999999/decision",
                       json={"decision": "ACCEPTED",
                             "note": "Decision on missing analysis."},
                       headers={"Authorization": f"Bearer {ctx['ev']}"})
    assert resp.status_code == 404
