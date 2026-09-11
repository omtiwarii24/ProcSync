from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


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


def _create_challenge(token, title="AI pipeline leak detection"):
    resp = client.post("/api/challenges", json={
        "title": title,
        "problem_statement": "Detect and localize water pipeline leaks across the distribution network to reduce non-revenue water.",
        "baseline": "38% non-revenue water",
        "target": "Under 15% non-revenue water",
        "domain": "water", "budget": 1500000.0,
    }, headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 201, resp.text
    return resp.json()


def test_create_challenge_draft():
    token = _register_dept_owner("wrd@maharashtra.gov.in", "WRD")
    ch = _create_challenge(token)
    assert ch["status"] == "DRAFT"
    assert ch["domain"] == "water"


def test_update_in_draft_only():
    token = _register_dept_owner("wrd2@maharashtra.gov.in", "WRD2")
    ch = _create_challenge(token)
    resp = client.patch(f"/api/challenges/{ch['id']}", json={"budget": 2000000.0},
                        headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert resp.json()["budget"] == 2000000.0
    # publish then try to edit -> 409
    resp = client.post(f"/api/challenges/{ch['id']}/publish", headers={
        "Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    resp = client.patch(f"/api/challenges/{ch['id']}", json={"budget": 1.0},
                        headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 409


def test_publish_close_lifecycle():
    token = _register_dept_owner("wrd3@maharashtra.gov.in", "WRD3")
    ch = _create_challenge(token)
    resp = client.post(f"/api/challenges/{ch['id']}/close", headers={
        "Authorization": f"Bearer {token}"})
    assert resp.status_code == 409  # DRAFT -> CLOSED not allowed
    resp = client.post(f"/api/challenges/{ch['id']}/publish", headers={
        "Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    resp = client.post(f"/api/challenges/{ch['id']}/close", headers={
        "Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    resp = client.post(f"/api/challenges/{ch['id']}/publish", headers={
        "Authorization": f"Bearer {token}"})
    assert resp.status_code == 409  # CLOSED -> anywhere not allowed


def test_startup_browses_published_only():
    dept = _register_dept_owner("wrd4@maharashtra.gov.in", "WRD4")
    ch = _create_challenge(dept)
    s = _register_startup("browse@acme.in")
    resp = client.get("/api/challenges", headers={"Authorization": f"Bearer {s}"})
    assert resp.status_code == 200
    assert resp.json()["total"] == 0  # DRAFT invisible
    resp = client.get(f"/api/challenges/{ch['id']}", headers={
        "Authorization": f"Bearer {s}"})
    assert resp.status_code == 404  # existence-hiding
    client.post(f"/api/challenges/{ch['id']}/publish",
                headers={"Authorization": f"Bearer {dept}"})
    resp = client.get("/api/challenges", headers={"Authorization": f"Bearer {s}"})
    assert resp.json()["total"] == 1


def test_evaluator_sees_published():
    dept = _register_dept_owner("wrd5@maharashtra.gov.in", "WRD5")
    ch = _create_challenge(dept)
    client.post(f"/api/challenges/{ch['id']}/publish",
                headers={"Authorization": f"Bearer {dept}"})
    ev = client.post("/api/auth/register", json={
        "email": "eval@gov.in", "password": "Passw0rd!123",
        "full_name": "Evaluator", "role": "EVALUATOR"}).json()["access_token"]
    resp = client.get("/api/challenges", headers={"Authorization": f"Bearer {ev}"})
    assert resp.status_code == 200
    assert resp.json()["total"] == 1


def test_owner_cannot_touch_other_dept():
    a = _register_dept_owner("wrd6@maharashtra.gov.in", "WRD6")
    ch = _create_challenge(a)
    b = _register_dept_owner("wrd7@maharashtra.gov.in", "WRD7")
    resp = client.patch(f"/api/challenges/{ch['id']}", json={"budget": 1.0},
                        headers={"Authorization": f"Bearer {b}"})
    assert resp.status_code == 403
    resp = client.post(f"/api/challenges/{ch['id']}/publish",
                       headers={"Authorization": f"Bearer {b}"})
    assert resp.status_code == 403


def test_mine_lists_own_challenges():
    a = _register_dept_owner("wrd8@maharashtra.gov.in", "WRD8")
    b = _register_dept_owner("wrd9@maharashtra.gov.in", "WRD9")
    _create_challenge(a)
    _create_challenge(b)
    resp = client.get("/api/challenges/mine", headers={"Authorization": f"Bearer {a}"})
    assert resp.json()["total"] == 1


def test_criteria_added_only_in_draft_by_owner():
    a = _register_dept_owner("wrd10@maharashtra.gov.in", "WRD10")
    ch = _create_challenge(a)
    resp = client.post(f"/api/challenges/{ch['id']}/criteria", json={
        "criterion_type": "TURNOVER", "operator": "GTE", "threshold": 1000000.0,
        "waiver_allowed": True, "description": "Minimum turnover",
    }, headers={"Authorization": f"Bearer {a}"})
    assert resp.status_code == 201
    assert resp.json()["is_auto_checkable"] is True
    resp = client.post(f"/api/challenges/{ch['id']}/criteria", json={
        "criterion_type": "CUSTOM", "operator": "EQ", "threshold": None,
        "waiver_allowed": True, "description": "Manual review item",
    }, headers={"Authorization": f"Bearer {a}"})
    assert resp.status_code == 201
    assert resp.json()["is_auto_checkable"] is False
    # publish then criteria blocked
    client.post(f"/api/challenges/{ch['id']}/publish",
                headers={"Authorization": f"Bearer {a}"})
    resp = client.post(f"/api/challenges/{ch['id']}/criteria", json={
        "criterion_type": "DPIIT", "operator": "GTE",
    }, headers={"Authorization": f"Bearer {a}"})
    assert resp.status_code == 409
    # other dept blocked
    b = _register_dept_owner("wrd11@maharashtra.gov.in", "WRD11")
    ch2 = _create_challenge(b, title="Another challenge title")
    resp = client.post(f"/api/challenges/{ch2['id']}/criteria", json={
        "criterion_type": "DPIIT", "operator": "GTE",
    }, headers={"Authorization": f"Bearer {a}"})
    assert resp.status_code == 403


def test_startup_cannot_create_challenge():
    s = _register_startup("nope@acme.in")
    resp = client.post("/api/challenges", json={
        "title": "Should not work", "problem_statement": "x" * 30, "domain": "water",
    }, headers={"Authorization": f"Bearer {s}"})
    assert resp.status_code == 403


def test_criteria_visible_to_authenticated():
    a = _register_dept_owner("wrd12@maharashtra.gov.in", "WRD12")
    ch = _create_challenge(a)
    client.post(f"/api/challenges/{ch['id']}/criteria", json={
        "criterion_type": "DPIIT", "operator": "GTE",
    }, headers={"Authorization": f"Bearer {a}"})
    client.post(f"/api/challenges/{ch['id']}/publish",
                headers={"Authorization": f"Bearer {a}"})
    s = _register_startup("seecrit@acme.in")
    resp = client.get(f"/api/challenges/{ch['id']}/criteria",
                      headers={"Authorization": f"Bearer {s}"})
    assert resp.status_code == 200
    assert len(resp.json()["items"]) == 1


def test_create_requires_long_problem_statement():
    a = _register_dept_owner("wrd13@maharashtra.gov.in", "WRD13")
    resp = client.post("/api/challenges", json={
        "title": "Short problem", "problem_statement": "too short", "domain": "water",
    }, headers={"Authorization": f"Bearer {a}"})
    assert resp.status_code == 422


def test_evaluation_weights_default_and_custom():
    dept = _register_dept_owner("fix4@maharashtra.gov.in", "FX4")
    ch = _create_challenge(dept)
    client.post(f"/api/challenges/{ch['id']}/publish",
                headers={"Authorization": f"Bearer {dept}"})
    resp = client.get(f"/api/challenges/{ch['id']}",
                      headers={"Authorization": f"Bearer {dept}"})
    assert resp.status_code == 200
    assert resp.json()["evaluation_weights"]["impact"] == 35.0
    # invalid weights rejected
    resp = client.post("/api/challenges", json={
        "title": "Bad weights challenge",
        "problem_statement": "This challenge tries to submit invalid evaluation weights.",
        "domain": "water",
        "evaluation_weights": {"impact": 150.0},
    }, headers={"Authorization": f"Bearer {dept}"})
    assert resp.status_code == 422
    # custom valid weights accepted
    resp = client.post("/api/challenges", json={
        "title": "Good weights challenge",
        "problem_statement": "This challenge submits a valid custom weights mapping.",
        "domain": "water",
        "evaluation_weights": {"impact": 50.0, "scalability": 50.0},
    }, headers={"Authorization": f"Bearer {dept}"})
    assert resp.status_code == 201
    assert resp.json()["evaluation_weights"] == {"impact": 50.0, "scalability": 50.0}


def test_draft_hidden_from_other_gov_roles():
    dept = _register_dept_owner("fixwrd@maharashtra.gov.in", "FXW")
    ch = _create_challenge(dept)
    ev = client.post("/api/auth/register", json={
        "email": "fixev@gov.in", "password": "Passw0rd!123",
        "full_name": "Eval", "role": "EVALUATOR"}).json()["access_token"]
    resp = client.get("/api/challenges", headers={"Authorization": f"Bearer {ev}"})
    assert resp.json()["total"] == 0
    resp = client.get(f"/api/challenges/{ch['id']}",
                      headers={"Authorization": f"Bearer {ev}"})
    assert resp.status_code == 404
    # other dept owner also cannot see the DRAFT
    other = _register_dept_owner("fixother@maharashtra.gov.in", "FXO")
    resp = client.get(f"/api/challenges/{ch['id']}",
                      headers={"Authorization": f"Bearer {other}"})
    assert resp.status_code == 404
    # but can see PUBLISHED
    client.post(f"/api/challenges/{ch['id']}/publish",
                headers={"Authorization": f"Bearer {dept}"})
    resp = client.get(f"/api/challenges/{ch['id']}",
                      headers={"Authorization": f"Bearer {ev}"})
    assert resp.status_code == 200


def test_domain_filter():
    dept = _register_dept_owner("fixdom@maharashtra.gov.in", "FXD")
    # exactly one published water challenge
    ch = _create_challenge(dept)
    client.post(f"/api/challenges/{ch['id']}/publish",
                headers={"Authorization": f"Bearer {dept}"})
    resp = client.get("/api/challenges", params={"domain": "water"},
                      headers={"Authorization": f"Bearer {dept}"})
    assert resp.status_code == 200
    assert resp.json()["total"] == 1
    resp = client.get("/api/challenges", params={"domain": "health"},
                      headers={"Authorization": f"Bearer {dept}"})
    assert resp.json()["total"] == 0
