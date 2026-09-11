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


def _startup(email, name, turnover=None, dpiit=None, deployments=None):
    payload = {"email": email, "password": "Passw0rd!123", "full_name": "Founder",
               "role": "STARTUP", "startup": {"name": name}}
    resp = client.post("/api/auth/register", json=payload)
    assert resp.status_code == 201, resp.text
    token = resp.json()["access_token"]
    upd = {}
    if turnover is not None:
        upd["annual_turnover"] = turnover
    if dpiit is not None:
        upd["dpiit_number"] = dpiit
    if deployments is not None:
        upd["prior_deployments"] = deployments
    if upd:
        client.put("/api/startups/me", json=upd,
                   headers={"Authorization": f"Bearer {token}"})
    return token


def _published_challenge(dept_token, with_criteria=True):
    resp = client.post("/api/challenges", json={
        "title": "Leak detection challenge",
        "problem_statement": "Reduce non-revenue water through AI leak detection in urban distribution networks.",
        "domain": "water", "budget": 1500000.0,
    }, headers={"Authorization": f"Bearer {dept_token}"})
    ch = resp.json()
    if with_criteria:
        client.post(f"/api/challenges/{ch['id']}/criteria", json={
            "criterion_type": "TURNOVER", "operator": "GTE",
            "threshold": 1000000.0, "waiver_allowed": True,
        }, headers={"Authorization": f"Bearer {dept_token}"})
        client.post(f"/api/challenges/{ch['id']}/criteria", json={
            "criterion_type": "DPIIT", "operator": "GTE",
        }, headers={"Authorization": f"Bearer {dept_token}"})
    client.post(f"/api/challenges/{ch['id']}/publish",
                headers={"Authorization": f"Bearer {dept_token}"})
    return ch


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


def test_submit_with_auto_eligibility_all_pass():
    dept = _dept("p1@maharashtra.gov.in", "P1")
    ch = _published_challenge(dept)
    s = _startup("strong@acme.in", "StrongTech", turnover=2500000.0,
                 dpiit="DPIIT123", deployments=2)
    resp = client.post(f"/api/challenges/{ch['id']}/proposals", json={
        "technical_summary": "Acoustic sensors plus ML models for leak prediction and localization.",
        "cost_estimate": 900000.0,
    }, headers={"Authorization": f"Bearer {s}"})
    assert resp.status_code == 201, resp.text
    body = resp.json()
    assert body["status"] == "ELIGIBLE"
    results = [c["result"] for c in body["checks"]]
    assert results == ["PASS", "PASS"]


def test_submit_fail_waivable_becomes_pending_manual():
    dept = _dept("p2@maharashtra.gov.in", "P2")
    ch = _published_challenge(dept)
    s = _startup("weak@acme.in", "WeakTech", dpiit="DPIIT1", deployments=0)
    resp = client.post(f"/api/challenges/{ch['id']}/proposals", json={
        "technical_summary": "Manual inspection workflow with basic acoustic sensors.",
        "cost_estimate": 100000.0,
    }, headers={"Authorization": f"Bearer {s}"})
    assert resp.status_code == 201
    body = resp.json()
    assert body["status"] == "SUBMITTED"
    results = [c["result"] for c in body["checks"]]
    assert "PENDING_MANUAL" in results and "PASS" in results


def test_duplicate_proposal_409():
    dept = _dept("p3@maharashtra.gov.in", "P3")
    ch = _published_challenge(dept, with_criteria=False)
    s = _startup("dup@acme.in", "DupTech")
    payload = {"technical_summary": "First submission of our solution to this problem area.",
               "cost_estimate": 1000.0}
    r1 = client.post(f"/api/challenges/{ch['id']}/proposals", json=payload,
                     headers={"Authorization": f"Bearer {s}"})
    r2 = client.post(f"/api/challenges/{ch['id']}/proposals", json=payload,
                     headers={"Authorization": f"Bearer {s}"})
    assert r1.status_code == 201 and r2.status_code == 409


def test_submit_on_draft_challenge_409():
    dept = _dept("p4@maharashtra.gov.in", "P4")
    resp = client.post("/api/challenges", json={
        "title": "Unpublished challenge",
        "problem_statement": "This challenge is not published yet so proposals must fail cleanly.",
        "domain": "water", "budget": 100.0,
    }, headers={"Authorization": f"Bearer {dept}"})
    ch = resp.json()
    s = _startup("early@acme.in", "EarlyTech")
    resp = client.post(f"/api/challenges/{ch['id']}/proposals", json={
        "technical_summary": "Trying to submit to a draft challenge should be rejected.",
    }, headers={"Authorization": f"Bearer {s}"})
    assert resp.status_code == 409


def test_mine_lists_own_proposals():
    dept = _dept("p5@maharashtra.gov.in", "P5")
    ch = _published_challenge(dept, with_criteria=False)
    s = _startup("mine@acme.in", "MineTech")
    client.post(f"/api/challenges/{ch['id']}/proposals", json={
        "technical_summary": "Our proposal for solving the stated water problem.",
    }, headers={"Authorization": f"Bearer {s}"})
    resp = client.get("/api/proposals/mine",
                      headers={"Authorization": f"Bearer {s}"})
    assert resp.json()["total"] == 1


def test_dept_lists_own_challenge_proposals():
    dept = _dept("p6@maharashtra.gov.in", "P6")
    other = _dept("p7@maharashtra.gov.in", "P7")
    ch = _published_challenge(dept, with_criteria=False)
    s = _startup("listed@acme.in", "ListedTech")
    client.post(f"/api/challenges/{ch['id']}/proposals", json={
        "technical_summary": "Proposal that the owning department should be able to list.",
    }, headers={"Authorization": f"Bearer {s}"})
    resp = client.get(f"/api/challenges/{ch['id']}/proposals",
                      headers={"Authorization": f"Bearer {dept}"})
    assert resp.status_code == 200 and resp.json()["total"] == 1
    resp = client.get(f"/api/challenges/{ch['id']}/proposals",
                      headers={"Authorization": f"Bearer {other}"})
    assert resp.status_code == 403


def test_rerun_eligibility_idempotent():
    dept = _dept("p8@maharashtra.gov.in", "P8")
    ch = _published_challenge(dept)
    s = _startup("rerun@acme.in", "RerunTech", turnover=2500000.0, dpiit="D1")
    resp = client.post(f"/api/challenges/{ch['id']}/proposals", json={
        "technical_summary": "Submitting once; the department will re-run eligibility to confirm.",
    }, headers={"Authorization": f"Bearer {s}"})
    prop = resp.json()
    resp = client.post(f"/api/proposals/{prop['id']}/run-eligibility",
                       headers={"Authorization": f"Bearer {dept}"})
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "ELIGIBLE"
    assert len(body["checks"]) == 2  # no duplicates after re-run


def test_waive_flow_makes_eligible():
    dept = _dept("p9@maharashtra.gov.in", "P9")
    ch = _published_challenge(dept)
    s = _startup("waiveme@acme.in", "WaiveTech", dpiit="D2")
    resp = client.post(f"/api/challenges/{ch['id']}/proposals", json={
        "technical_summary": "Promising but under the turnover bar; needs an admin waiver.",
    }, headers={"Authorization": f"Bearer {s}"})
    body = resp.json()
    assert body["status"] == "SUBMITTED"
    pending = [c for c in body["checks"] if c["result"] == "PENDING_MANUAL"]
    assert len(pending) == 1
    admin = _admin_token()
    # justification required
    resp = client.post(f"/api/eligibility-checks/{pending[0]['id']}/waive",
                       json={"justification": "short"},
                       headers={"Authorization": f"Bearer {admin}"})
    assert resp.status_code == 422
    resp = client.post(f"/api/eligibility-checks/{pending[0]['id']}/waive",
                       json={"justification": "Startup has strong funding runway and prior pilots."},
                       headers={"Authorization": f"Bearer {admin}"})
    assert resp.status_code == 200
    assert resp.json()["result"] == "WAIVED"
    resp = client.get(f"/api/proposals/{body['id']}",
                      headers={"Authorization": f"Bearer {s}"})
    assert resp.json()["status"] == "ELIGIBLE"


def test_waive_requires_admin():
    dept = _dept("p10@maharashtra.gov.in", "P10")
    ch = _published_challenge(dept)
    s = _startup("nowaive@acme.in", "NoWaiveTech", dpiit="D3")
    resp = client.post(f"/api/challenges/{ch['id']}/proposals", json={
        "technical_summary": "Department should not be able to waive; only admin can do that.",
    }, headers={"Authorization": f"Bearer {s}"})
    body = resp.json()
    pending = [c for c in body["checks"] if c["result"] == "PENDING_MANUAL"][0]
    resp = client.post(f"/api/eligibility-checks/{pending['id']}/waive",
                       json={"justification": "Department trying to waive this item."},
                       headers={"Authorization": f"Bearer {dept}"})
    assert resp.status_code == 403


def test_waive_non_pending_409():
    dept = _dept("p11@maharashtra.gov.in", "P11")
    ch = _published_challenge(dept)
    s = _startup("passed@acme.in", "PassTech", turnover=2500000.0, dpiit="D4")
    resp = client.post(f"/api/challenges/{ch['id']}/proposals", json={
        "technical_summary": "Everything passes; attempting to waive a PASS check must fail.",
    }, headers={"Authorization": f"Bearer {s}"})
    body = resp.json()
    passed = [c for c in body["checks"] if c["result"] == "PASS"][0]
    admin = _admin_token()
    resp = client.post(f"/api/eligibility-checks/{passed['id']}/waive",
                       json={"justification": "Attempting to waive a passing check."},
                       headers={"Authorization": f"Bearer {admin}"})
    assert resp.status_code == 409


def test_startup_cannot_rerun_eligibility():
    dept = _dept("p12@maharashtra.gov.in", "P12")
    ch = _published_challenge(dept)
    s = _startup("norun@acme.in", "NoRunTech", dpiit="D5")
    resp = client.post(f"/api/challenges/{ch['id']}/proposals", json={
        "technical_summary": "Startup should not be able to re-run its own eligibility.",
    }, headers={"Authorization": f"Bearer {s}"})
    prop = resp.json()
    resp = client.post(f"/api/proposals/{prop['id']}/run-eligibility",
                      headers={"Authorization": f"Bearer {s}"})
    assert resp.status_code == 403


def test_startup_cannot_view_others_proposals():
    dept = _dept("p13@maharashtra.gov.in", "P13")
    ch = _published_challenge(dept, with_criteria=False)
    s1 = _startup("view1@acme.in", "ViewOne")
    s2 = _startup("view2@acme.in", "ViewTwo")
    resp = client.post(f"/api/challenges/{ch['id']}/proposals", json={
        "technical_summary": "Proposal owned by startup one; startup two must not see it.",
    }, headers={"Authorization": f"Bearer {s1}"})
    prop = resp.json()
    resp = client.get(f"/api/proposals/{prop['id']}",
                      headers={"Authorization": f"Bearer {s2}"})
    assert resp.status_code == 403


def test_custom_criterion_always_pending():
    dept = _dept("p14@maharashtra.gov.in", "P14")
    resp = client.post("/api/challenges", json={
        "title": "Manual review challenge",
        "problem_statement": "This challenge includes a custom criterion needing manual review.",
        "domain": "governance", "budget": 100.0,
    }, headers={"Authorization": f"Bearer {dept}"})
    ch = resp.json()
    client.post(f"/api/challenges/{ch['id']}/criteria", json={
        "criterion_type": "CUSTOM", "operator": "EQ",
        "description": "Conflict of interest declaration",
    }, headers={"Authorization": f"Bearer {dept}"})
    client.post(f"/api/challenges/{ch['id']}/publish",
                headers={"Authorization": f"Bearer {dept}"})
    s = _startup("custom@acme.in", "CustomTech")
    resp = client.post(f"/api/challenges/{ch['id']}/proposals", json={
        "technical_summary": "Proposal that will always require manual review for the custom item.",
    }, headers={"Authorization": f"Bearer {s}"})
    body = resp.json()
    assert body["status"] == "SUBMITTED"
    assert all(c["result"] == "PENDING_MANUAL" for c in body["checks"])


def test_rerun_eligibility_other_dept_403():
    deptA = _dept("fixA@maharashtra.gov.in", "FXA")
    deptB = _dept("fixB@maharashtra.gov.in", "FXB")
    ch = _published_challenge(deptA)
    s = _startup("fixs@acme.in", "FixTech", dpiit="FX1")
    resp = client.post(f"/api/challenges/{ch['id']}/proposals", json={
        "technical_summary": "Cross-department re-run eligibility must be forbidden.",
    }, headers={"Authorization": f"Bearer {s}"})
    prop = resp.json()
    resp = client.post(f"/api/proposals/{prop['id']}/run-eligibility",
                       headers={"Authorization": f"Bearer {deptB}"})
    assert resp.status_code == 403


def test_no_criteria_challenge_auto_eligible():
    dept = _dept("fix1@maharashtra.gov.in", "FX1")
    ch = _published_challenge(dept, with_criteria=False)
    s = _startup("fixauto@acme.in", "AutoEligTech")
    resp = client.post(f"/api/challenges/{ch['id']}/proposals", json={
        "technical_summary": "No criteria on this challenge means trivially eligible.",
    }, headers={"Authorization": f"Bearer {s}"})
    assert resp.status_code == 201
    assert resp.json()["status"] == "ELIGIBLE"
    assert resp.json()["checks"] == []


def test_rerun_blocked_when_locked():
    from app.core.database import SessionLocal
    from app.models.enums import ProposalStatus
    from app.modules.proposals.models import Proposal
    dept = _dept("fix2@maharashtra.gov.in", "FX2")
    ch = _published_challenge(dept, with_criteria=False)
    s = _startup("locked@acme.in", "LockedTech")
    resp = client.post(f"/api/challenges/{ch['id']}/proposals", json={
        "technical_summary": "Locking this proposal to a later status then re-running.",
    }, headers={"Authorization": f"Bearer {s}"})
    prop = resp.json()
    sess = SessionLocal()
    p = sess.get(Proposal, prop["id"])
    p.status = ProposalStatus.UNDER_EVALUATION
    sess.commit(); sess.close()
    resp = client.post(f"/api/proposals/{prop['id']}/run-eligibility",
                      headers={"Authorization": f"Bearer {dept}"})
    assert resp.status_code == 409


def test_startup_update_audited():
    from app.core.database import SessionLocal
    from app.models.audit import AuditLog
    from app.models.enums import AuditAction
    dept = _dept("fix3@maharashtra.gov.in", "FX3")
    ch = _published_challenge(dept, with_criteria=False)
    s = _startup("audited@acme.in", "AuditTech")
    client.post(f"/api/challenges/{ch['id']}/proposals", json={
        "technical_summary": "Profile changes after this must appear in the audit log.",
    }, headers={"Authorization": f"Bearer {s}"})
    client.put("/api/startups/me", json={"annual_turnover": 9999.0},
               headers={"Authorization": f"Bearer {s}"})
    sess = SessionLocal()
    rows = sess.query(AuditLog).filter(
        AuditLog.entity_type == "Startup",
        AuditLog.action == AuditAction.UPDATE).all()
    sess.close()
    assert len(rows) == 1
    assert rows[0].new_values["annual_turnover"] == 9999.0


def test_pagination_bounds_422():
    dept = _dept("fix5@maharashtra.gov.in", "FX5")
    resp = client.get("/api/challenges",
                      headers={"Authorization": f"Bearer {dept}"})
    assert resp.status_code == 200
    assert set(resp.json()) == {"items", "page", "size", "total"}
    resp = client.get("/api/challenges", params={"page": 0},
                      headers={"Authorization": f"Bearer {dept}"})
    assert resp.status_code == 422
    resp = client.get("/api/challenges", params={"size": 1000},
                      headers={"Authorization": f"Bearer {dept}"})
    assert resp.status_code == 422
