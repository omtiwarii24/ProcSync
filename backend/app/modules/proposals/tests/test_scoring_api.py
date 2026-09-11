from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

DEFAULT_WEIGHTS = {
    "impact": 35.0, "cost_effectiveness": 20.0, "technical_maturity": 15.0,
    "operational_readiness": 10.0, "security_compliance": 10.0,
    "user_adoption": 5.0, "scalability": 5.0,
}


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
        "role": "STARTUP", "startup": {"name": name},
    })
    assert resp.status_code == 201, resp.text
    return resp.json()["access_token"]


def _evaluator(email):
    resp = client.post("/api/auth/register", json={
        "email": email, "password": "Passw0rd!123", "full_name": "Evaluator",
        "role": "EVALUATOR",
    })
    assert resp.status_code == 201, resp.text
    body = resp.json()
    return body["access_token"], body["user"]["id"]


def _user_id(email):
    from app.core.database import SessionLocal
    from app.modules.auth.models import User
    s = SessionLocal()
    uid = s.query(User).filter_by(email=email).first().id
    s.close()
    return uid


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


def _published_challenge(dept_token):
    resp = client.post("/api/challenges", json={
        "title": "Scoring challenge",
        "problem_statement": "Reduce non-revenue water through AI leak detection in urban distribution networks.",
        "domain": "water", "budget": 1500000.0,
    }, headers={"Authorization": f"Bearer {dept_token}"})
    assert resp.status_code == 201, resp.text
    ch = resp.json()
    client.post(f"/api/challenges/{ch['id']}/publish",
                headers={"Authorization": f"Bearer {dept_token}"})
    return ch


def _proposal(startup_token, challenge_id, summary="A strong technical proposal for evaluation purposes."):
    resp = client.post(f"/api/challenges/{challenge_id}/proposals", json={
        "technical_summary": summary, "cost_estimate": 500000.0,
    }, headers={"Authorization": f"Bearer {startup_token}"})
    assert resp.status_code == 201, resp.text
    return resp.json()


def _panel(dept_token, challenge_id, name="Panel A"):
    resp = client.post(f"/api/challenges/{challenge_id}/panels", json={"name": name},
                       headers={"Authorization": f"Bearer {dept_token}"})
    assert resp.status_code == 201, resp.text
    return resp.json()


def _add_member(dept_token, challenge_id, panel_id, evaluator_user_id):
    return client.post(
        f"/api/challenges/{challenge_id}/panels/{panel_id}/members",
        json={"evaluator_user_id": evaluator_user_id},
        headers={"Authorization": f"Bearer {dept_token}"})


def _score(eval_token, proposal_id, gate="GATE1", dimension="impact", raw_score=8.0):
    return client.post(f"/api/proposals/{proposal_id}/scores",
                       json={"gate": gate, "dimension": dimension,
                             "raw_score": raw_score},
                       headers={"Authorization": f"Bearer {eval_token}"})


def _setup_basic(tag):
    dept = _dept(f"sc-dept-{tag}@maharashtra.gov.in", f"SC{tag}")
    ch = _published_challenge(dept)
    s = _startup(f"sc-start-{tag}@acme.in", f"ScTech{tag}")
    prop = _proposal(s, ch["id"])
    ev_token, ev_id = _evaluator(f"sc-eval-{tag}@gov.in")
    panel = _panel(dept, ch["id"])
    resp = _add_member(dept, ch["id"], panel["id"], ev_id)
    assert resp.status_code == 201, resp.text
    return {"dept": dept, "ch": ch, "startup": s, "prop": prop,
            "ev": ev_token, "ev_id": ev_id, "panel": panel}


def test_panel_create_and_member_validation():
    dept = _dept("sc-p1@maharashtra.gov.in", "SCP1")
    ch = _published_challenge(dept)
    panel = _panel(dept, ch["id"])
    assert panel["challenge_id"] == ch["id"]
    _, ev_id = _evaluator("sc-p1-eval@gov.in")
    resp = _add_member(dept, ch["id"], panel["id"], ev_id)
    assert resp.status_code == 201, resp.text
    # duplicate member -> 409
    resp = _add_member(dept, ch["id"], panel["id"], ev_id)
    assert resp.status_code == 409
    # startup user as member -> 400
    _startup("sc-p1-start@acme.in", "ScP1Tech")
    resp = _add_member(dept, ch["id"], panel["id"], _user_id("sc-p1-start@acme.in"))
    assert resp.status_code == 400
    # unknown user -> 404
    resp = _add_member(dept, ch["id"], panel["id"], 999999)
    assert resp.status_code == 404
    # cross-dept panel create -> 403
    other = _dept("sc-p1-other@maharashtra.gov.in", "SCP1O")
    resp = client.post(f"/api/challenges/{ch['id']}/panels", json={"name": "X"},
                       headers={"Authorization": f"Bearer {other}"})
    assert resp.status_code == 403


def test_evaluator_scoring_happy_path_and_upsert_no_dupes():
    ctx = _setup_basic("happy")
    resp = _score(ctx["ev"], ctx["prop"]["id"])
    assert resp.status_code == 201, resp.text
    assert resp.json()["raw_score"] == 8.0
    # upsert same identity updates in place
    resp = _score(ctx["ev"], ctx["prop"]["id"], raw_score=9.0)
    assert resp.status_code == 201, resp.text
    assert resp.json()["raw_score"] == 9.0
    resp = client.get(f"/api/proposals/{ctx['prop']['id']}/scores",
                      headers={"Authorization": f"Bearer {ctx['ev']}"})
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["total"] == 1
    assert body["items"][0]["raw_score"] == 9.0
    assert set(body) == {"items", "page", "size", "total"}


def test_non_member_evaluator_403():
    ctx = _setup_basic("nonmem")
    outsider_token, _ = _evaluator("sc-outsider@gov.in")
    resp = _score(outsider_token, ctx["prop"]["id"])
    assert resp.status_code == 403


def test_dept_owner_and_startup_scoring_403():
    ctx = _setup_basic("roles403")
    resp = _score(ctx["dept"], ctx["prop"]["id"])
    assert resp.status_code == 403
    resp = _score(ctx["startup"], ctx["prop"]["id"])
    assert resp.status_code == 403


def test_score_validation_422():
    ctx = _setup_basic("v422")
    pid = ctx["prop"]["id"]
    resp = _score(ctx["ev"], pid, dimension="vibes")
    assert resp.status_code == 422
    resp = _score(ctx["ev"], pid, gate="GATE9")
    assert resp.status_code == 422
    resp = _score(ctx["ev"], pid, raw_score=11.0)
    assert resp.status_code == 422
    resp = _score(ctx["ev"], pid, raw_score=-1.0)
    assert resp.status_code == 422


def test_ranking_order_matches_hand_computation_and_weights_echo():
    dept = _dept("sc-rk@maharashtra.gov.in", "SCRK")
    ch = _published_challenge(dept)
    s1 = _startup("sc-rk1@acme.in", "ScRkOne")
    s2 = _startup("sc-rk2@acme.in", "ScRkTwo")
    p1 = _proposal(s1, ch["id"])
    p2 = _proposal(s2, ch["id"])
    ev_token, ev_id = _evaluator("sc-rk-eval@gov.in")
    panel = _panel(dept, ch["id"])
    assert _add_member(dept, ch["id"], panel["id"], ev_id).status_code == 201
    # P1: GATE1 impact 8 -> 28.0 ; GATE2 impact 6 -> 21.0 ; total 49.0
    assert _score(ev_token, p1["id"], "GATE1", "impact", 8.0).status_code == 201
    assert _score(ev_token, p1["id"], "GATE2", "impact", 6.0).status_code == 201
    # P2: GATE1 impact 10 -> 35.0 ; GATE2 impact 2 -> 7.0 ; total 42.0
    assert _score(ev_token, p2["id"], "GATE1", "impact", 10.0).status_code == 201
    assert _score(ev_token, p2["id"], "GATE2", "impact", 2.0).status_code == 201
    resp = client.get(f"/api/challenges/{ch['id']}/ranking",
                      headers={"Authorization": f"Bearer {dept}"})
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["weights"] == DEFAULT_WEIGHTS
    assert [i["proposal_id"] for i in body["items"]] == [p1["id"], p2["id"]]
    assert body["items"][0]["gate1_score"] == 28.0
    assert body["items"][0]["gate2_score"] == 21.0
    assert body["items"][0]["total"] == 49.0
    assert body["items"][1]["total"] == 42.0


def test_ranking_tie_break_by_proposal_id():
    dept = _dept("sc-tie@maharashtra.gov.in", "SCTIE")
    ch = _published_challenge(dept)
    s1 = _startup("sc-tie1@acme.in", "ScTieOne")
    s2 = _startup("sc-tie2@acme.in", "ScTieTwo")
    p1 = _proposal(s1, ch["id"])
    p2 = _proposal(s2, ch["id"])
    ev_token, ev_id = _evaluator("sc-tie-eval@gov.in")
    panel = _panel(dept, ch["id"])
    assert _add_member(dept, ch["id"], panel["id"], ev_id).status_code == 201
    for p in (p1, p2):
        assert _score(ev_token, p["id"], "GATE1", "impact", 6.0).status_code == 201
    resp = client.get(f"/api/challenges/{ch['id']}/ranking",
                      headers={"Authorization": f"Bearer {dept}"})
    assert resp.status_code == 200, resp.text
    items = resp.json()["items"]
    assert items[0]["total"] == items[1]["total"]
    assert [i["proposal_id"] for i in items] == sorted([p1["id"], p2["id"]])


def test_ranking_visibility():
    ctx = _setup_basic("vis")
    ch_id = ctx["ch"]["id"]
    # panel-member evaluator sees ranking
    resp = client.get(f"/api/challenges/{ch_id}/ranking",
                      headers={"Authorization": f"Bearer {ctx['ev']}"})
    assert resp.status_code == 200, resp.text
    # admin sees ranking
    admin = _admin_token()
    resp = client.get(f"/api/challenges/{ch_id}/ranking",
                      headers={"Authorization": f"Bearer {admin}"})
    assert resp.status_code == 200, resp.text
    # non-member evaluator 403
    outsider, _ = _evaluator("sc-vis-out@gov.in")
    resp = client.get(f"/api/challenges/{ch_id}/ranking",
                      headers={"Authorization": f"Bearer {outsider}"})
    assert resp.status_code == 403
    # cross-dept dept owner 403
    other = _dept("sc-vis-other@maharashtra.gov.in", "SCVO")
    resp = client.get(f"/api/challenges/{ch_id}/ranking",
                      headers={"Authorization": f"Bearer {other}"})
    assert resp.status_code == 403
    # startup cannot see ranking
    resp = client.get(f"/api/challenges/{ch_id}/ranking",
                      headers={"Authorization": f"Bearer {ctx['startup']}"})
    assert resp.status_code == 403


def _finance(email):
    resp = client.post("/api/auth/register", json={
        "email": email, "password": "Passw0rd!123", "full_name": "Finance",
        "role": "FINANCE",
    })
    assert resp.status_code == 201, resp.text
    return resp.json()["access_token"]


def test_scores_read_evaluator_gating_member_vs_nonmember():
    ctx = _setup_basic("r1eval")
    pid = ctx["prop"]["id"]
    assert _score(ctx["ev"], pid).status_code == 201
    # member evaluator -> 200
    resp = client.get(f"/api/proposals/{pid}/scores",
                      headers={"Authorization": f"Bearer {ctx['ev']}"})
    assert resp.status_code == 200, resp.text
    # registered evaluator with no panel -> 403
    outsider_token, _ = _evaluator("sc-r1-outsider@gov.in")
    resp = client.get(f"/api/proposals/{pid}/scores",
                      headers={"Authorization": f"Bearer {outsider_token}"})
    assert resp.status_code == 403, resp.text
    # evaluator on a DIFFERENT challenge's panel -> 403
    other_dept = _dept("sc-r1-other@maharashtra.gov.in", "SCR1O")
    other_ch = _published_challenge(other_dept)
    other_panel = _panel(other_dept, other_ch["id"])
    diff_token, diff_id = _evaluator("sc-r1-diff@gov.in")
    assert _add_member(other_dept, other_ch["id"], other_panel["id"],
                       diff_id).status_code == 201
    resp = client.get(f"/api/proposals/{pid}/scores",
                      headers={"Authorization": f"Bearer {diff_token}"})
    assert resp.status_code == 403, resp.text


def test_scores_read_finance_admin_crossdept():
    ctx = _setup_basic("r1fin")
    pid = ctx["prop"]["id"]
    assert _score(ctx["ev"], pid).status_code == 201
    # FINANCE -> 403
    fin = _finance("sc-r1-fin@gov.in")
    resp = client.get(f"/api/proposals/{pid}/scores",
                      headers={"Authorization": f"Bearer {fin}"})
    assert resp.status_code == 403, resp.text
    # cross-dept DEPT_OWNER -> 403
    other = _dept("sc-r1-xd@maharashtra.gov.in", "SCR1X")
    resp = client.get(f"/api/proposals/{pid}/scores",
                      headers={"Authorization": f"Bearer {other}"})
    assert resp.status_code == 403, resp.text
    # ADMIN -> 200
    admin = _admin_token()
    resp = client.get(f"/api/proposals/{pid}/scores",
                      headers={"Authorization": f"Bearer {admin}"})
    assert resp.status_code == 200, resp.text


def test_scores_visibility_follows_proposal_rules():
    ctx = _setup_basic("scorevis")
    pid = ctx["prop"]["id"]
    assert _score(ctx["ev"], pid).status_code == 201
    # owning dept sees scores
    resp = client.get(f"/api/proposals/{pid}/scores",
                      headers={"Authorization": f"Bearer {ctx['dept']}"})
    assert resp.status_code == 200 and resp.json()["total"] == 1
    # owning startup sees own scores
    resp = client.get(f"/api/proposals/{pid}/scores",
                      headers={"Authorization": f"Bearer {ctx['startup']}"})
    assert resp.status_code == 200
    # another startup forbidden
    s2 = _startup("sc-scorevis2@acme.in", "ScSvTwo")
    resp = client.get(f"/api/proposals/{pid}/scores",
                      headers={"Authorization": f"Bearer {s2}"})
    assert resp.status_code == 403
