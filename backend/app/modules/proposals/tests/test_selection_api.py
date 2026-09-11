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
        "title": "Selection challenge",
        "problem_statement": "Reduce non-revenue water through AI leak detection in urban distribution networks.",
        "domain": "water", "budget": 1500000.0,
    }, headers={"Authorization": f"Bearer {dept_token}"})
    assert resp.status_code == 201, resp.text
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


def _submit_on(challenge_id, startup_token, cost=1000.0):
    resp = client.post(f"/api/challenges/{challenge_id}/proposals", json={
        "technical_summary": "Acoustic sensors plus ML models for leak prediction and localization.",
        "cost_estimate": cost,
    }, headers={"Authorization": f"Bearer {startup_token}"})
    assert resp.status_code == 201, resp.text
    return resp.json()


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


def _set_status(proposal_id, status):
    from app.core.database import SessionLocal
    from app.modules.proposals.models import Proposal
    sess = SessionLocal()
    p = sess.get(Proposal, proposal_id)
    p.status = status
    sess.commit()
    sess.close()


def test_start_evaluation_moves_only_eligible():
    dept = _dept("sel-se1@maharashtra.gov.in", "SELSE1")
    ch = _published_challenge(dept, with_criteria=True)
    strong = _startup("sel-se1-strong@acme.in", "SelSeOneStrong",
                      turnover=2500000.0, dpiit="SELD1", deployments=2)
    weak = _startup("sel-se1-weak@acme.in", "SelSeOneWeak", dpiit="SELD2")
    elig = _submit_on(ch["id"], strong)
    subm = _submit_on(ch["id"], weak)
    assert elig["status"] == "ELIGIBLE"
    assert subm["status"] == "SUBMITTED"
    resp = client.post(f"/api/challenges/{ch['id']}/start-evaluation",
                       headers={"Authorization": f"Bearer {dept}"})
    assert resp.status_code == 200, resp.text
    assert resp.json() == {"moved": 1}
    assert client.get(f"/api/proposals/{elig['id']}",
                      headers={"Authorization": f"Bearer {dept}"}).json()["status"] == "UNDER_EVALUATION"
    assert client.get(f"/api/proposals/{subm['id']}",
                      headers={"Authorization": f"Bearer {dept}"}).json()["status"] == "SUBMITTED"


def test_select_flips_mixed_status_siblings():
    from app.models.enums import ProposalStatus
    dept = _dept("sel-mix@maharashtra.gov.in", "SELMIX")
    ch = _published_challenge(dept, with_criteria=False)
    s1 = _startup("sel-mix1@acme.in", "SelMixOne")
    s2 = _startup("sel-mix2@acme.in", "SelMixTwo")
    s3 = _startup("sel-mix3@acme.in", "SelMixThree")
    s4 = _startup("sel-mix4@acme.in", "SelMixFour")
    s5 = _startup("sel-mix5@acme.in", "SelMixFive")
    p1 = _submit_on(ch["id"], s1)
    p2 = _submit_on(ch["id"], s2)
    p3 = _submit_on(ch["id"], s3)
    p4 = _submit_on(ch["id"], s4)
    p5 = _submit_on(ch["id"], s5)
    # full finality: UNDER_EVALUATION, SUBMITTED, ELIGIBLE siblings all flip
    # to REJECTED; already-REJECTED stays REJECTED (finality, untouched).
    _set_status(p2["id"], ProposalStatus.UNDER_EVALUATION)
    _set_status(p3["id"], ProposalStatus.SUBMITTED)
    _set_status(p4["id"], ProposalStatus.ELIGIBLE)
    _set_status(p5["id"], ProposalStatus.REJECTED)
    resp = client.post(f"/api/proposals/{p1['id']}/select",
                       headers={"Authorization": f"Bearer {dept}"})
    assert resp.status_code == 200, resp.text
    assert resp.json()["status"] == "SELECTED"
    get = lambda pid: client.get(
        f"/api/proposals/{pid}",
        headers={"Authorization": f"Bearer {dept}"}).json()["status"]
    assert get(p1["id"]) == "SELECTED"
    assert get(p2["id"]) == "REJECTED"
    assert get(p3["id"]) == "REJECTED"
    assert get(p4["id"]) == "REJECTED"
    assert get(p5["id"]) == "REJECTED"
    # nothing left in a non-final sibling state
    for pid in (p2["id"], p3["id"], p4["id"]):
        assert get(pid) not in ("SUBMITTED", "ELIGIBLE", "UNDER_EVALUATION")


def test_second_select_409_finality():
    dept = _dept("sel-fin@maharashtra.gov.in", "SELFIN")
    ch = _published_challenge(dept, with_criteria=False)
    s1 = _startup("sel-fin1@acme.in", "SelFinOne")
    s2 = _startup("sel-fin2@acme.in", "SelFinTwo")
    p1 = _submit_on(ch["id"], s1)
    p2 = _submit_on(ch["id"], s2)
    resp = client.post(f"/api/proposals/{p1['id']}/select",
                       headers={"Authorization": f"Bearer {dept}"})
    assert resp.status_code == 200, resp.text
    resp = client.post(f"/api/proposals/{p2['id']}/select",
                       headers={"Authorization": f"Bearer {dept}"})
    assert resp.status_code == 409, resp.text


def test_reject_happy_path():
    dept = _dept("sel-rej@maharashtra.gov.in", "SELREJ")
    ch = _published_challenge(dept, with_criteria=False)
    s = _startup("sel-rej1@acme.in", "SelRejOne")
    p = _submit_on(ch["id"], s)
    resp = client.post(f"/api/proposals/{p['id']}/reject",
                       json={"reason": "Pilot capacity already allocated elsewhere."},
                       headers={"Authorization": f"Bearer {dept}"})
    assert resp.status_code == 200, resp.text
    assert resp.json()["status"] == "REJECTED"


def test_reject_validation_422():
    dept = _dept("sel-rejv@maharashtra.gov.in", "SELREJV")
    ch = _published_challenge(dept, with_criteria=False)
    s = _startup("sel-rejv1@acme.in", "SelRejVOne")
    p = _submit_on(ch["id"], s)
    resp = client.post(f"/api/proposals/{p['id']}/reject",
                       json={"reason": "short"},
                       headers={"Authorization": f"Bearer {dept}"})
    assert resp.status_code == 422, resp.text
    resp = client.post(f"/api/proposals/{p['id']}/reject",
                       json={},
                       headers={"Authorization": f"Bearer {dept}"})
    assert resp.status_code == 422, resp.text


def test_select_on_submitted_409():
    dept = _dept("sel-sub@maharashtra.gov.in", "SELSUB")
    ch = _published_challenge(dept, with_criteria=True)
    weak = _startup("sel-sub-weak@acme.in", "SelSubWeak", dpiit="SELSUB1")
    p = _submit_on(ch["id"], weak)
    assert p["status"] == "SUBMITTED"
    resp = client.post(f"/api/proposals/{p['id']}/select",
                       headers={"Authorization": f"Bearer {dept}"})
    assert resp.status_code == 409, resp.text


def test_cross_dept_select_403():
    deptA = _dept("sel-xd1@maharashtra.gov.in", "SELXD1")
    deptB = _dept("sel-xd2@maharashtra.gov.in", "SELXD2")
    ch = _published_challenge(deptA, with_criteria=False)
    s = _startup("sel-xd1@acme.in", "SelXdOne")
    p = _submit_on(ch["id"], s)
    resp = client.post(f"/api/proposals/{p['id']}/select",
                       headers={"Authorization": f"Bearer {deptB}"})
    assert resp.status_code in (403, 404), resp.text
    resp = client.post(f"/api/challenges/{ch['id']}/start-evaluation",
                       headers={"Authorization": f"Bearer {deptB}"})
    assert resp.status_code in (403, 404), resp.text


def test_admin_views_selection_state():
    dept = _dept("sel-adm@maharashtra.gov.in", "SELADM")
    ch = _published_challenge(dept, with_criteria=False)
    s = _startup("sel-adm1@acme.in", "SelAdmOne")
    p = _submit_on(ch["id"], s)
    assert client.post(f"/api/proposals/{p['id']}/select",
                       headers={"Authorization": f"Bearer {dept}"}).status_code == 200
    admin = _admin_token()
    resp = client.get(f"/api/proposals/{p['id']}",
                      headers={"Authorization": f"Bearer {admin}"})
    assert resp.status_code == 200, resp.text
    assert resp.json()["status"] == "SELECTED"


def test_select_audited_with_sibling_rejects():
    from app.core.database import SessionLocal
    from app.models.audit import AuditLog
    from app.models.enums import AuditAction
    dept = _dept("sel-aud@maharashtra.gov.in", "SELAUD")
    ch = _published_challenge(dept, with_criteria=False)
    s1 = _startup("sel-aud1@acme.in", "SelAudOne")
    s2 = _startup("sel-aud2@acme.in", "SelAudTwo")
    p1 = _submit_on(ch["id"], s1)
    p2 = _submit_on(ch["id"], s2)
    client.post(f"/api/challenges/{ch['id']}/start-evaluation",
                headers={"Authorization": f"Bearer {dept}"})
    assert client.post(f"/api/proposals/{p1['id']}/select",
                       headers={"Authorization": f"Bearer {dept}"}).status_code == 200
    sess = SessionLocal()
    sel_rows = sess.query(AuditLog).filter(
        AuditLog.entity_type == "Proposal",
        AuditLog.entity_id == str(p1["id"]),
        AuditLog.action == AuditAction.SELECT).all()
    rej_rows = sess.query(AuditLog).filter(
        AuditLog.entity_type == "Proposal",
        AuditLog.entity_id == str(p2["id"]),
        AuditLog.action == AuditAction.REJECT).all()
    sess.close()
    assert len(sel_rows) == 1
    assert sel_rows[0].new_values["challenge_id"] == ch["id"]
    assert len(rej_rows) == 1
    assert rej_rows[0].new_values["reason"] == "superseded by selection"
    assert rej_rows[0].new_values["selected_proposal_id"] == p1["id"]


def test_select_eligible_emits_two_audits():
    from app.core.database import SessionLocal
    from app.models.audit import AuditLog
    from app.models.enums import AuditAction
    dept = _dept("sel-r2sel@maharashtra.gov.in", "SELR2S")
    ch = _published_challenge(dept, with_criteria=False)
    s = _startup("sel-r2sel1@acme.in", "SelR2SelOne")
    p = _submit_on(ch["id"], s)
    assert p["status"] == "ELIGIBLE"
    resp = client.post(f"/api/proposals/{p['id']}/select",
                       headers={"Authorization": f"Bearer {dept}"})
    assert resp.status_code == 200, resp.text
    sess = SessionLocal()
    try:
        rows = sess.query(AuditLog).filter(
            AuditLog.entity_type == "Proposal",
            AuditLog.entity_id == str(p["id"])).order_by(AuditLog.id).all()
    finally:
        sess.close()
    updates = [r for r in rows if r.action == AuditAction.UPDATE]
    selects = [r for r in rows if r.action == AuditAction.SELECT]
    assert len(updates) == 1, [ (r.action, r.old_values, r.new_values) for r in rows ]
    assert updates[0].old_values == {"status": "ELIGIBLE"}
    assert updates[0].new_values == {"status": "UNDER_EVALUATION"}
    assert len(selects) == 1
    assert selects[0].old_values == {"status": "UNDER_EVALUATION"}
    assert selects[0].new_values["status"] == "SELECTED"


def test_reject_eligible_emits_two_audits():
    from app.core.database import SessionLocal
    from app.models.audit import AuditLog
    from app.models.enums import AuditAction
    dept = _dept("sel-r2rej@maharashtra.gov.in", "SELR2R")
    ch = _published_challenge(dept, with_criteria=False)
    s = _startup("sel-r2rej1@acme.in", "SelR2RejOne")
    p = _submit_on(ch["id"], s)
    assert p["status"] == "ELIGIBLE"
    resp = client.post(f"/api/proposals/{p['id']}/reject",
                       json={"reason": "Pilot capacity already allocated elsewhere."},
                       headers={"Authorization": f"Bearer {dept}"})
    assert resp.status_code == 200, resp.text
    sess = SessionLocal()
    try:
        rows = sess.query(AuditLog).filter(
            AuditLog.entity_type == "Proposal",
            AuditLog.entity_id == str(p["id"])).order_by(AuditLog.id).all()
    finally:
        sess.close()
    updates = [r for r in rows if r.action == AuditAction.UPDATE]
    rejects = [r for r in rows if r.action == AuditAction.REJECT]
    assert len(updates) == 1, [ (r.action, r.old_values, r.new_values) for r in rows ]
    assert updates[0].old_values == {"status": "ELIGIBLE"}
    assert updates[0].new_values == {"status": "UNDER_EVALUATION"}
    assert len(rejects) == 1
    assert rejects[0].old_values == {"status": "UNDER_EVALUATION"}
    assert rejects[0].new_values["status"] == "REJECTED"


def test_admin_select_other_dept_challenge():
    dept = _dept("sel-r5own@maharashtra.gov.in", "SELR5O")
    ch = _published_challenge(dept, with_criteria=False)
    s = _startup("sel-r5one@acme.in", "SelR5One")
    p = _submit_on(ch["id"], s)
    admin = _admin_token()
    resp = client.post(f"/api/challenges/{ch['id']}/start-evaluation",
                       headers={"Authorization": f"Bearer {admin}"})
    assert resp.status_code == 200, resp.text
    resp = client.post(f"/api/proposals/{p['id']}/select",
                       headers={"Authorization": f"Bearer {admin}"})
    assert resp.status_code == 200, resp.text
    assert resp.json()["status"] == "SELECTED"


def test_get_selected_proposal_helper():
    from app.core.database import SessionLocal
    from app.modules.proposals import service as proposal_service
    dept = _dept("sel-help@maharashtra.gov.in", "SELHELP")
    ch = _published_challenge(dept, with_criteria=False)
    s = _startup("sel-help1@acme.in", "SelHelpOne")
    p = _submit_on(ch["id"], s)
    sess = SessionLocal()
    try:
        assert proposal_service.get_selected_proposal(sess, ch["id"]) is None
    finally:
        sess.close()
    assert client.post(f"/api/proposals/{p['id']}/select",
                       headers={"Authorization": f"Bearer {dept}"}).status_code == 200
    sess = SessionLocal()
    try:
        found = proposal_service.get_selected_proposal(sess, ch["id"])
        assert found is not None and found.id == p["id"]
    finally:
        sess.close()
