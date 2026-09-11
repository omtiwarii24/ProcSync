from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

SCOPE = "Deploy 50 smart water meters across two municipal wards with ML leak detection."
TERMS = "Data stays with the department; startup retains model IP."
FAIL_CONDITIONS = "Sensor calibration drifted beyond tolerance in high humidity wards."
TERMINATE_REASON = "Department budget reallocated to flood response."


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


def _startup(email, name):
    resp = client.post("/api/auth/register", json={
        "email": email, "password": "Passw0rd!123", "full_name": "Founder",
        "role": "STARTUP", "startup": {"name": name}})
    assert resp.status_code == 201, resp.text
    return resp.json()["access_token"]


def _manager(email):
    resp = client.post("/api/auth/register", json={
        "email": email, "password": "Passw0rd!123", "full_name": "Pilot Manager",
        "role": "PILOT_MANAGER"})
    assert resp.status_code == 201, resp.text
    return resp.json()


def _login(email):
    resp = client.post("/api/auth/login", json={
        "email": email, "password": "Passw0rd!123"})
    assert resp.status_code == 200, resp.text
    return resp.json()["access_token"]


def _challenge(dept_token):
    resp = client.post("/api/challenges", json={
        "title": "Workflow challenge",
        "problem_statement": "Reduce non-revenue water through AI leak detection in urban distribution networks.",
        "domain": "water", "budget": 1500000.0,
    }, headers={"Authorization": f"Bearer {dept_token}"})
    assert resp.status_code == 201, resp.text
    ch = resp.json()
    client.post(f"/api/challenges/{ch['id']}/publish",
                headers={"Authorization": f"Bearer {dept_token}"})
    return ch


def _submit(challenge_id, startup_token):
    resp = client.post(f"/api/challenges/{challenge_id}/proposals", json={
        "technical_summary": "Acoustic sensors plus ML models for leak prediction and localization.",
        "cost_estimate": 1000.0,
    }, headers={"Authorization": f"Bearer {startup_token}"})
    assert resp.status_code == 201, resp.text
    return resp.json()


def _select(proposal_id, dept_token):
    resp = client.post(f"/api/proposals/{proposal_id}/select",
                       headers={"Authorization": f"Bearer {dept_token}"})
    assert resp.status_code == 200, resp.text
    return resp.json()


def _setup(tag, dept_code):
    dept = _dept(f"pwf-d-{tag}@maharashtra.gov.in", dept_code)
    ch = _challenge(dept)
    st = _startup(f"pwf-s-{tag}@acme.in", f"Pwf{tag}")
    mgr = _manager(f"pwf-m-{tag}@gov.in")
    sel = _select(_submit(ch["id"], st)["id"], dept)
    assert sel["status"] == "SELECTED"
    resp = client.post(f"/api/proposals/{sel['id']}/pilot", json={
        "scope": SCOPE, "pilot_manager_id": mgr["user"]["id"],
        "data_ip_terms": TERMS,
    }, headers={"Authorization": f"Bearer {dept}"})
    assert resp.status_code == 201, resp.text
    return {"dept": dept, "startup": st, "mgr": mgr,
            "mgr_token": _login(f"pwf-m-{tag}@gov.in"),
            "pilot": resp.json()}


def _activate(ctx):
    client.post(f"/api/pilots/{ctx['pilot']['id']}/accept-terms",
                headers={"Authorization": f"Bearer {ctx['startup']}"})
    resp = client.post(f"/api/pilots/{ctx['pilot']['id']}/activate",
                       headers={"Authorization": f"Bearer {ctx['mgr_token']}"})
    assert resp.status_code == 200, resp.text
    return resp.json()


def test_accept_terms_happy():
    ctx = _setup("t1A", "PWFT1A")
    resp = client.post(f"/api/pilots/{ctx['pilot']['id']}/accept-terms",
                       headers={"Authorization": f"Bearer {ctx['startup']}"})
    assert resp.status_code == 200, resp.text
    assert resp.json()["terms_accepted"] is True


def test_accept_terms_idempotent():
    ctx = _setup("t1B", "PWFT1B")
    url = f"/api/pilots/{ctx['pilot']['id']}/accept-terms"
    headers = {"Authorization": f"Bearer {ctx['startup']}"}
    assert client.post(url, headers=headers).status_code == 200
    resp = client.post(url, headers=headers)
    assert resp.status_code == 200, resp.text
    assert resp.json()["terms_accepted"] is True


def test_accept_terms_non_owner_403():
    ctx = _setup("t1C", "PWFT1C")
    other = _startup("pwf-s-t1C-other@acme.in", "PwfT1COther")
    resp = client.post(f"/api/pilots/{ctx['pilot']['id']}/accept-terms",
                       headers={"Authorization": f"Bearer {other}"})
    assert resp.status_code in (403, 404), resp.text


def test_fail_happy():
    ctx = _setup("t2A", "PWFT2A")
    _activate(ctx)
    resp = client.post(f"/api/pilots/{ctx['pilot']['id']}/fail",
                       json={"failure_conditions": FAIL_CONDITIONS},
                       headers={"Authorization": f"Bearer {ctx['mgr_token']}"})
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["status"] == "FAILED"
    assert body["failure_conditions"] == FAIL_CONDITIONS


def test_fail_short_conditions_422():
    ctx = _setup("t2B", "PWFT2B")
    _activate(ctx)
    resp = client.post(f"/api/pilots/{ctx['pilot']['id']}/fail",
                       json={"failure_conditions": "too short"},
                       headers={"Authorization": f"Bearer {ctx['mgr_token']}"})
    assert resp.status_code == 422, resp.text


def test_terminate_happy():
    ctx = _setup("t3A", "PWFT3A")
    _activate(ctx)
    resp = client.post(f"/api/pilots/{ctx['pilot']['id']}/terminate",
                       json={"reason": TERMINATE_REASON},
                       headers={"Authorization": f"Bearer {ctx['dept']}"})
    assert resp.status_code == 200, resp.text
    assert resp.json()["status"] == "TERMINATED"


def test_terminate_non_owner_403():
    ctx = _setup("t3B", "PWFT3B")
    _activate(ctx)
    resp = client.post(f"/api/pilots/{ctx['pilot']['id']}/terminate",
                       json={"reason": TERMINATE_REASON},
                       headers={"Authorization": f"Bearer {ctx['startup']}"})
    assert resp.status_code == 403, resp.text


def test_summary_shape():
    ctx = _setup("t4A", "PWFT4A")
    pid = ctx["pilot"]["id"]
    mh = {"Authorization": f"Bearer {ctx['mgr_token']}"}
    ms = client.post(f"/api/pilots/{pid}/milestones",
                     json={"title": "Install 25 meters", "amount": 50000.0},
                     headers=mh)
    assert ms.status_code == 201, ms.text
    kpi = client.post(f"/api/pilots/{pid}/kpis",
                      json={"name": "Leak reduction", "baseline": 5.0,
                            "target": 20.0, "direction": "HIGHER"},
                      headers=mh)
    assert kpi.status_code == 201, kpi.text
    risk = client.post(f"/api/pilots/{pid}/risks",
                       json={"description": "Monsoon flooding may delay installations"},
                       headers=mh)
    assert risk.status_code == 201, risk.text
    resp = client.get(f"/api/pilots/{pid}/summary", headers=mh)
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["pilot"]["id"] == pid
    assert body["milestones"]["total"] == 1
    assert body["milestones"]["by_status"] == {"PENDING": 1}
    assert len(body["kpis"]) == 1
    assert body["kpis"][0]["name"] == "Leak reduction"
    assert body["kpis"][0]["direction"] == "HIGHER"
    assert body["open_risks"] == 1
    assert body["payments"]["total_amount"] == 0.0
    assert body["payments"]["disbursed_amount"] == 0.0


def test_failed_pilot_rejects_submit_409():
    ctx = _setup("t5A", "PWFT5A")
    pid = ctx["pilot"]["id"]
    mh = {"Authorization": f"Bearer {ctx['mgr_token']}"}
    ms = client.post(f"/api/pilots/{pid}/milestones",
                     json={"title": "Install 25 meters", "amount": 50000.0},
                     headers=mh)
    assert ms.status_code == 201, ms.text
    mid = ms.json()["id"]
    _activate(ctx)
    fail = client.post(f"/api/pilots/{pid}/fail",
                       json={"failure_conditions": FAIL_CONDITIONS},
                       headers=mh)
    assert fail.status_code == 200, fail.text
    resp = client.post(f"/api/pilots/{pid}/milestones/{mid}/submit",
                       headers={"Authorization": f"Bearer {ctx['startup']}"})
    assert resp.status_code == 409, resp.text
