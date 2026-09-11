"""Task J payments API tests (invoice -> approve -> disburse | reject).

Router is mounted by the controller at the serial gate (prefix /api);
these tests are written as if mounted.

Pilot seeding mirrors the execution tests: Pilot rows are created DIRECTLY
via SessionLocal rather than through pilot-creation routes.
"""

import itertools

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

_seq = itertools.count(1)


def _n(tag):
    return f"{tag}{next(_seq)}"


def _register_dept_owner(tag):
    email = f"{_n('pay-owner-')}@maharashtra.gov.in"
    code = f"PY{next(_seq):05d}"[:20]
    resp = client.post("/api/auth/register", json={
        "email": email, "password": "Passw0rd!123", "full_name": "Dept Owner",
        "role": "DEPT_OWNER",
        "department": {"name": f"Dept {code} {tag}", "code": code,
                       "connectivity_tier": "MEDIUM",
                       "power_reliability": "STABLE",
                       "it_maturity": "MEDIUM", "settlement_type": "URBAN",
                       "terrain_type": "PLAIN"},
    })
    assert resp.status_code == 201, resp.text
    return resp.json()["access_token"]


def _register_role(email, role):
    resp = client.post("/api/auth/register", json={
        "email": email, "password": "Passw0rd!123",
        "full_name": f"{role} User", "role": role,
    })
    assert resp.status_code == 201, resp.text
    body = resp.json()
    return body["access_token"], body["user"]["id"]


def _register_startup(tag):
    email = f"{_n('pay-startup-')}@acme.in"
    resp = client.post("/api/auth/register", json={
        "email": email, "password": "Passw0rd!123", "full_name": "Founder",
        "role": "STARTUP", "startup": {"name": f"Startup {tag} {email}"},
    })
    assert resp.status_code == 201, resp.text
    return resp.json()["access_token"]


def _pilot_status(name):
    from app.models.enums import PilotStatus
    return PilotStatus(name)


def _seed_pilot(active=True, terms=True):
    tag = _n("p-")
    owner_token = _register_dept_owner(tag)
    startup_token = _register_startup(tag)
    manager_token, manager_id = _register_role(
        f"{_n('pay-mgr-')}@gov.in", "PILOT_MANAGER")
    finance_token, _ = _register_role(
        f"{_n('pay-fin-')}@gov.in", "FINANCE")

    resp = client.post("/api/challenges", json={
        "title": f"Payments challenge {tag}",
        "problem_statement": "Reduce non-revenue water through AI leak detection in urban distribution networks.",
        "domain": "water", "budget": 1500000.0,
    }, headers={"Authorization": f"Bearer {owner_token}"})
    assert resp.status_code == 201, resp.text
    ch = resp.json()
    resp = client.post(f"/api/challenges/{ch['id']}/publish",
                       headers={"Authorization": f"Bearer {owner_token}"})
    assert resp.status_code == 200, resp.text

    resp = client.post(f"/api/challenges/{ch['id']}/proposals", json={
        "technical_summary": "Acoustic sensors plus ML models for leak prediction and localization.",
        "cost_estimate": 500000.0,
    }, headers={"Authorization": f"Bearer {startup_token}"})
    assert resp.status_code == 201, resp.text
    prop = resp.json()
    assert prop["status"] == "ELIGIBLE"

    resp = client.post(f"/api/proposals/{prop['id']}/select",
                       headers={"Authorization": f"Bearer {owner_token}"})
    assert resp.status_code == 200, resp.text

    from app.core.database import SessionLocal
    from app.modules.auth.models import User
    from app.modules.challenges.models import Challenge
    from app.modules.orgs.models import Startup
    from app.modules.pilots.models import Pilot

    s = SessionLocal()
    try:
        st = s.query(Startup).order_by(Startup.id.desc()).first()
        ch_row = s.get(Challenge, ch["id"])
        dept_owner = s.query(User).filter(
            User.department_id == ch_row.department_id,
            User.role == "DEPT_OWNER").first()
        assert dept_owner is not None and st is not None
        pilot = Pilot(
            proposal_id=prop["id"],
            department_id=ch_row.department_id,
            startup_id=st.id,
            pilot_manager_id=manager_id,
            scope="Ward-level leak detection pilot across 5 zones.",
            status=_pilot_status("ACTIVE" if active else "DRAFT"),
            terms_accepted=terms,
        )
        s.add(pilot)
        s.commit()
        pilot_id = pilot.id
    finally:
        s.close()
    return {"owner_token": owner_token, "startup_token": startup_token,
            "manager_token": manager_token, "manager_id": manager_id,
            "finance_token": finance_token, "pilot_id": pilot_id,
            "proposal_id": prop["id"]}


def _verified_milestone(ctx, amount=120000.0):
    """Create -> submit -> verify a milestone; returns the milestone body."""
    hdr_mgr = {"Authorization": f"Bearer {ctx['manager_token']}"}
    hdr_startup = {"Authorization": f"Bearer {ctx['startup_token']}"}
    pid = ctx["pilot_id"]
    resp = client.post(f"/api/pilots/{pid}/milestones",
                       json={"title": "Sensor deployment phase one",
                             "amount": amount},
                       headers=hdr_mgr)
    assert resp.status_code == 201, resp.text
    ms = resp.json()
    resp = client.post(
        f"/api/pilots/{pid}/milestones/{ms['id']}/submit",
        headers=hdr_startup)
    assert resp.status_code == 200, resp.text
    resp = client.post(
        f"/api/pilots/{pid}/milestones/{ms['id']}/verify", headers=hdr_mgr)
    assert resp.status_code == 200, resp.text
    assert resp.json()["status"] == "VERIFIED"
    return resp.json()


def _invoice(ctx, milestone_id):
    return client.post(
        f"/api/milestones/{milestone_id}/invoice",
        headers={"Authorization": f"Bearer {ctx['startup_token']}"})


# ---- Happy path ----

def test_happy_path_invoice_approve_disburse():
    ctx = _seed_pilot()
    ms = _verified_milestone(ctx, amount=120000.0)
    hdr_fin = {"Authorization": f"Bearer {ctx['finance_token']}"}
    hdr_mgr = {"Authorization": f"Bearer {ctx['manager_token']}"}

    resp = _invoice(ctx, ms["id"])
    assert resp.status_code == 201, resp.text
    payment = resp.json()
    assert payment["status"] == "INVOICED"
    assert payment["amount"] == 120000.0
    assert payment["milestone_id"] == ms["id"]
    assert payment["approved_by"] is None
    pid = payment["id"]

    resp = client.post(f"/api/payments/{pid}/approve", headers=hdr_fin)
    assert resp.status_code == 200, resp.text
    assert resp.json()["status"] == "APPROVED"

    resp = client.post(f"/api/payments/{pid}/disburse", headers=hdr_fin)
    assert resp.status_code == 200, resp.text
    assert resp.json()["status"] == "DISBURSED"

    # Milestone ends PAID.
    resp = client.get(f"/api/pilots/{ctx['pilot_id']}/milestones",
                      headers=hdr_mgr)
    assert resp.status_code == 200, resp.text
    items = resp.json()["items"]
    assert items[0]["status"] == "PAID"

    # Pilot payments list shows the disbursed record.
    resp = client.get(f"/api/pilots/{ctx['pilot_id']}/payments",
                      headers=hdr_mgr)
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["total"] == 1 and body["page"] == 1
    assert body["items"][0]["status"] == "DISBURSED"


def test_admin_approve_allowed():
    from app.core.database import SessionLocal
    from app.core.security import hash_password
    from app.models.enums import UserRole
    from app.modules.auth.models import User
    ctx = _seed_pilot()
    ms = _verified_milestone(ctx)
    payment = _invoice(ctx, ms["id"]).json()
    s = SessionLocal()
    if s.query(User).filter_by(email="payadmin@gov.in").first() is None:
        s.add(User(email="payadmin@gov.in",
                   password_hash=hash_password("Adm1nPass!23"),
                   role=UserRole.ADMIN, full_name="Admin"))
        s.commit()
    s.close()
    admin_token = client.post("/api/auth/login", json={
        "email": "payadmin@gov.in", "password": "Adm1nPass!23"}).json()["access_token"]
    resp = client.post(f"/api/payments/{payment['id']}/approve",
                       headers={"Authorization": f"Bearer {admin_token}"})
    assert resp.status_code == 200, resp.text
    assert resp.json()["status"] == "APPROVED"


def test_approve_on_invoiced_ok():
    ctx = _seed_pilot()
    ms = _verified_milestone(ctx)
    hdr_fin = {"Authorization": f"Bearer {ctx['finance_token']}"}
    payment = _invoice(ctx, ms["id"]).json()
    resp = client.post(f"/api/payments/{payment['id']}/approve",
                       headers=hdr_fin)
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["status"] == "APPROVED"
    assert body["approved_by"] is not None


# ---- Guards ----

def test_invoice_on_submitted_409():
    ctx = _seed_pilot()
    hdr_mgr = {"Authorization": f"Bearer {ctx['manager_token']}"}
    hdr_startup = {"Authorization": f"Bearer {ctx['startup_token']}"}
    pid = ctx["pilot_id"]
    ms = client.post(f"/api/pilots/{pid}/milestones",
                     json={"title": "Unverified civil works",
                           "amount": 50000.0},
                     headers=hdr_mgr).json()
    client.post(f"/api/pilots/{pid}/milestones/{ms['id']}/submit",
                headers=hdr_startup)
    resp = _invoice(ctx, ms["id"])
    assert resp.status_code == 409, resp.text
    assert resp.json()["code"] == "MILESTONE_NOT_VERIFIED"


def test_invoice_on_pending_409():
    ctx = _seed_pilot()
    hdr_mgr = {"Authorization": f"Bearer {ctx['manager_token']}"}
    ms = client.post(f"/api/pilots/{ctx['pilot_id']}/milestones",
                     json={"title": "Pending trench digging",
                           "amount": 10000.0},
                     headers=hdr_mgr).json()
    resp = _invoice(ctx, ms["id"])
    assert resp.status_code == 409, resp.text


def test_duplicate_invoice_409():
    ctx = _seed_pilot()
    ms = _verified_milestone(ctx)
    resp = _invoice(ctx, ms["id"])
    assert resp.status_code == 201, resp.text
    resp = _invoice(ctx, ms["id"])
    assert resp.status_code == 409, resp.text
    assert resp.json()["code"] == "PAYMENT_DUPLICATE"


def test_double_approve_409():
    ctx = _seed_pilot()
    ms = _verified_milestone(ctx)
    hdr_fin = {"Authorization": f"Bearer {ctx['finance_token']}"}
    payment = _invoice(ctx, ms["id"]).json()
    resp = client.post(f"/api/payments/{payment['id']}/approve",
                       headers=hdr_fin)
    assert resp.status_code == 200, resp.text
    resp = client.post(f"/api/payments/{payment['id']}/approve",
                       headers=hdr_fin)
    assert resp.status_code == 409, resp.text


def test_disburse_before_approve_409():
    ctx = _seed_pilot()
    ms = _verified_milestone(ctx)
    hdr_fin = {"Authorization": f"Bearer {ctx['finance_token']}"}
    payment = _invoice(ctx, ms["id"]).json()
    resp = client.post(f"/api/payments/{payment['id']}/disburse",
                       headers=hdr_fin)
    assert resp.status_code == 409, resp.text


def test_reject_with_reason():
    ctx = _seed_pilot()
    ms = _verified_milestone(ctx)
    hdr_fin = {"Authorization": f"Bearer {ctx['finance_token']}"}
    payment = _invoice(ctx, ms["id"]).json()
    resp = client.post(f"/api/payments/{payment['id']}/reject",
                       json={"reason": "Duplicate billing for phase one"},
                       headers=hdr_fin)
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["status"] == "REJECTED"
    assert body["rejected_reason"] == "Duplicate billing for phase one"
    # Terminal: approve after reject is rejected.
    resp = client.post(f"/api/payments/{payment['id']}/approve",
                       headers=hdr_fin)
    assert resp.status_code == 409, resp.text


def test_reject_short_reason_422():
    ctx = _seed_pilot()
    ms = _verified_milestone(ctx)
    hdr_fin = {"Authorization": f"Bearer {ctx['finance_token']}"}
    payment = _invoice(ctx, ms["id"]).json()
    resp = client.post(f"/api/payments/{payment['id']}/reject",
                       json={"reason": "nope"}, headers=hdr_fin)
    assert resp.status_code == 422, resp.text


def test_non_finance_approve_403():
    ctx = _seed_pilot()
    ms = _verified_milestone(ctx)
    payment = _invoice(ctx, ms["id"]).json()
    hdr_mgr = {"Authorization": f"Bearer {ctx['manager_token']}"}
    resp = client.post(f"/api/payments/{payment['id']}/approve",
                       headers=hdr_mgr)
    assert resp.status_code == 403, resp.text
    # Startup cannot disburse either.
    hdr_startup = {"Authorization": f"Bearer {ctx['startup_token']}"}
    resp = client.post(f"/api/payments/{payment['id']}/disburse",
                       headers=hdr_startup)
    assert resp.status_code == 403, resp.text


def test_other_startup_invoice_404():
    ctx1 = _seed_pilot()
    ctx2 = _seed_pilot()
    ms = _verified_milestone(ctx1)
    resp = client.post(
        f"/api/milestones/{ms['id']}/invoice",
        headers={"Authorization": f"Bearer {ctx2['startup_token']}"})
    assert resp.status_code in (403, 404), resp.text


def test_finance_lists_cross_department_payments_200():
    """F1: FINANCE is platform-wide — may READ another dept's pilot payments."""
    ctx1 = _seed_pilot()
    ctx2 = _seed_pilot()
    ms = _verified_milestone(ctx1)
    resp = _invoice(ctx1, ms["id"])
    assert resp.status_code == 201, resp.text
    hdr_fin2 = {"Authorization": f"Bearer {ctx2['finance_token']}"}
    resp = client.get(f"/api/pilots/{ctx1['pilot_id']}/payments",
                      headers=hdr_fin2)
    assert resp.status_code == 200, resp.text
    assert resp.json()["total"] == 1
