from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

SCOPE = "Deploy 50 smart water meters across two municipal wards with ML leak detection."
TERMS = "Data stays with the department; startup retains model IP."


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


def _evaluator(email):
    resp = client.post("/api/auth/register", json={
        "email": email, "password": "Passw0rd!123", "full_name": "Evaluator",
        "role": "EVALUATOR"})
    assert resp.status_code == 201, resp.text
    return resp.json()["access_token"]


def _me_id(token):
    resp = client.get("/api/auth/me",
                      headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200, resp.text
    return resp.json()["id"]


def _challenge(dept_token):
    resp = client.post("/api/challenges", json={
        "title": "Pilot challenge",
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


def _create_pilot(proposal_id, token, manager_id, scope=SCOPE):
    return client.post(f"/api/proposals/{proposal_id}/pilot", json={
        "scope": scope, "pilot_manager_id": manager_id,
        "data_ip_terms": TERMS,
    }, headers={"Authorization": f"Bearer {token}"})


def _accept_terms(pilot_id):
    from app.core.database import SessionLocal
    from app.modules.pilots.models import Pilot
    s = SessionLocal()
    try:
        p = s.get(Pilot, pilot_id)
        p.terms_accepted = True
        s.commit()
    finally:
        s.close()


def _selected_setup(dept_email="plt-d@maharashtra.gov.in", dept_code="PLTD",
                    startup_email="plt-s@acme.in", startup_name="PltOne",
                    mgr_email="plt-m@gov.in"):
    dept = _dept(dept_email, dept_code)
    ch = _challenge(dept)
    st = _startup(startup_email, startup_name)
    mgr = _manager(mgr_email)
    prop = _submit(ch["id"], st)
    assert prop["status"] == "ELIGIBLE"
    sel = _select(prop["id"], dept)
    assert sel["status"] == "SELECTED"
    return dept, st, mgr, sel


def test_create_from_selected_ok():
    dept, st, mgr, sel = _selected_setup()
    resp = _create_pilot(sel["id"], dept, mgr["user"]["id"])
    assert resp.status_code == 201, resp.text
    body = resp.json()
    assert body["status"] == "DRAFT"
    assert body["terms_accepted"] is False
    assert body["startup_id"] is not None
    assert body["pilot_manager_id"] == mgr["user"]["id"]
    assert body["scope"] == SCOPE


def test_create_from_eligible_409():
    dept = _dept("plt-e@maharashtra.gov.in", "PLTE")
    ch = _challenge(dept)
    st = _startup("plt-es@acme.in", "PltElig")
    mgr = _manager("plt-em@gov.in")
    prop = _submit(ch["id"], st)
    assert prop["status"] == "ELIGIBLE"
    resp = _create_pilot(prop["id"], dept, mgr["user"]["id"])
    assert resp.status_code == 409, resp.text
    assert resp.json()["code"] == "PROPOSAL_NOT_SELECTED"


def test_duplicate_pilot_409():
    dept, st, mgr, sel = _selected_setup(
        "plt-d2@maharashtra.gov.in", "PLTD2",
        "plt-s2@acme.in", "PltTwo", "plt-m2@gov.in")
    assert _create_pilot(sel["id"], dept, mgr["user"]["id"]).status_code == 201
    resp = _create_pilot(sel["id"], dept, mgr["user"]["id"])
    assert resp.status_code == 409, resp.text
    assert resp.json()["code"] == "PILOT_DUPLICATE"


def test_non_owner_dept_403():
    dept, st, mgr, sel = _selected_setup(
        "plt-d3@maharashtra.gov.in", "PLTD3",
        "plt-s3@acme.in", "PltThree", "plt-m3@gov.in")
    other = _dept("plt-d3b@maharashtra.gov.in", "PLTD3B")
    resp = _create_pilot(sel["id"], other, mgr["user"]["id"])
    assert resp.status_code == 403, resp.text


def test_startup_cannot_create_403():
    dept, st, mgr, sel = _selected_setup(
        "plt-d4@maharashtra.gov.in", "PLTD4",
        "plt-s4@acme.in", "PltFour", "plt-m4@gov.in")
    resp = _create_pilot(sel["id"], st, mgr["user"]["id"])
    assert resp.status_code == 403, resp.text


def test_create_with_non_manager_400():
    dept, st, mgr, sel = _selected_setup(
        "plt-d5@maharashtra.gov.in", "PLTD5",
        "plt-s5@acme.in", "PltFive", "plt-m5@gov.in")
    owner_id = _me_id(dept)
    resp = _create_pilot(sel["id"], dept, owner_id)
    assert resp.status_code == 400, resp.text


def test_activate_without_terms_409():
    dept, st, mgr, sel = _selected_setup(
        "plt-d6@maharashtra.gov.in", "PLTD6",
        "plt-s6@acme.in", "PltSix", "plt-m6@gov.in")
    pilot = _create_pilot(sel["id"], dept, mgr["user"]["id"]).json()
    mgr_token = client.post("/api/auth/login", json={
        "email": "plt-m6@gov.in", "password": "Passw0rd!123"}).json()["access_token"]
    resp = client.post(f"/api/pilots/{pilot['id']}/activate",
                       headers={"Authorization": f"Bearer {mgr_token}"})
    assert resp.status_code == 409, resp.text
    assert resp.json()["code"] == "TERMS_NOT_ACCEPTED"


def test_activate_then_complete_happy():
    dept, st, mgr, sel = _selected_setup(
        "plt-d7@maharashtra.gov.in", "PLTD7",
        "plt-s7@acme.in", "PltSeven", "plt-m7@gov.in")
    pilot = _create_pilot(sel["id"], dept, mgr["user"]["id"]).json()
    _accept_terms(pilot["id"])
    mgr_token = client.post("/api/auth/login", json={
        "email": "plt-m7@gov.in", "password": "Passw0rd!123"}).json()["access_token"]
    resp = client.post(f"/api/pilots/{pilot['id']}/activate",
                       headers={"Authorization": f"Bearer {mgr_token}"})
    assert resp.status_code == 200, resp.text
    assert resp.json()["status"] == "ACTIVE"
    resp = client.post(f"/api/pilots/{pilot['id']}/complete",
                       headers={"Authorization": f"Bearer {mgr_token}"})
    assert resp.status_code == 200, resp.text
    assert resp.json()["status"] == "COMPLETED"


def test_complete_on_draft_409():
    dept, st, mgr, sel = _selected_setup(
        "plt-d8@maharashtra.gov.in", "PLTD8",
        "plt-s8@acme.in", "PltEight", "plt-m8@gov.in")
    pilot = _create_pilot(sel["id"], dept, mgr["user"]["id"]).json()
    mgr_token = client.post("/api/auth/login", json={
        "email": "plt-m8@gov.in", "password": "Passw0rd!123"}).json()["access_token"]
    resp = client.post(f"/api/pilots/{pilot['id']}/complete",
                       headers={"Authorization": f"Bearer {mgr_token}"})
    assert resp.status_code == 409, resp.text


def test_manager_lists_assigned_only():
    dept = _dept("plt-d9@maharashtra.gov.in", "PLTD9")
    ch = _challenge(dept)
    s1 = _startup("plt-s9a@acme.in", "PltNineA")
    s2 = _startup("plt-s9b@acme.in", "PltNineB")
    m1 = _manager("plt-m9a@gov.in")
    m2 = _manager("plt-m9b@gov.in")
    p1 = _select(_submit(ch["id"], s1)["id"], dept)
    ch2 = _challenge(dept)
    p2 = _select(_submit(ch2["id"], s2)["id"], dept)
    assert _create_pilot(p1["id"], dept, m1["user"]["id"]).status_code == 201
    assert _create_pilot(p2["id"], dept, m2["user"]["id"]).status_code == 201
    t1 = client.post("/api/auth/login", json={
        "email": "plt-m9a@gov.in", "password": "Passw0rd!123"}).json()["access_token"]
    resp = client.get("/api/pilots",
                      headers={"Authorization": f"Bearer {t1}"})
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["total"] == 1
    assert body["items"][0]["pilot_manager_id"] == m1["user"]["id"]


def test_startup_sees_own_pilot_only():
    dept, st, mgr, sel = _selected_setup(
        "plt-d10@maharashtra.gov.in", "PLTD10",
        "plt-s10@acme.in", "PltTen", "plt-m10@gov.in")
    pilot = _create_pilot(sel["id"], dept, mgr["user"]["id"]).json()
    resp = client.get(f"/api/pilots/{pilot['id']}",
                      headers={"Authorization": f"Bearer {st}"})
    assert resp.status_code == 200, resp.text
    assert resp.json()["id"] == pilot["id"]
    other = _startup("plt-s10b@acme.in", "PltTenB")
    resp = client.get(f"/api/pilots/{pilot['id']}",
                      headers={"Authorization": f"Bearer {other}"})
    assert resp.status_code == 404, resp.text


def test_evaluator_get_404():
    dept, st, mgr, sel = _selected_setup(
        "plt-d11@maharashtra.gov.in", "PLTD11",
        "plt-s11@acme.in", "PltEleven", "plt-m11@gov.in")
    pilot = _create_pilot(sel["id"], dept, mgr["user"]["id"]).json()
    ev = _evaluator("plt-ev11@gov.in")
    resp = client.get(f"/api/pilots/{pilot['id']}",
                      headers={"Authorization": f"Bearer {ev}"})
    assert resp.status_code == 404, resp.text


def test_unassigned_manager_activate_403():
    dept, st, mgr, sel = _selected_setup(
        "plt-d12@maharashtra.gov.in", "PLTD12",
        "plt-s12@acme.in", "PltTwelve", "plt-m12@gov.in")
    pilot = _create_pilot(sel["id"], dept, mgr["user"]["id"]).json()
    _accept_terms(pilot["id"])
    outsider = _manager("plt-m12b@gov.in")
    out_token = client.post("/api/auth/login", json={
        "email": "plt-m12b@gov.in", "password": "Passw0rd!123"}).json()["access_token"]
    assert outsider["user"]["id"] != mgr["user"]["id"]
    resp = client.post(f"/api/pilots/{pilot['id']}/activate",
                       headers={"Authorization": f"Bearer {out_token}"})
    assert resp.status_code == 404, resp.text
