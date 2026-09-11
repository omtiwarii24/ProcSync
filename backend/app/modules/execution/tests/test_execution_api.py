"""Task I execution API tests (milestones, KPIs, risks, constraints).

Router is mounted by the controller at the serial gate (prefix /api);
these tests are written as if mounted.

Pilot seeding: Pilot rows are created DIRECTLY via SessionLocal (lazy
`app.modules.pilots.models` import inside helpers) rather than through the
parallel agent's pilot-creation routes — robust to Task H's exact route
shapes. The proposal/department/startup/user chain underneath is built
through the existing green APIs.
"""

import itertools

import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

_seq = itertools.count(1)


def _n(tag):
    return f"{tag}{next(_seq)}"


def _register_dept_owner(tag):
    email = f"{_n('exec-owner-')}@maharashtra.gov.in"
    code = f"EX{next(_seq):05d}"[:20]
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
    email = f"{_n('exec-startup-')}@acme.in"
    resp = client.post("/api/auth/register", json={
        "email": email, "password": "Passw0rd!123", "full_name": "Founder",
        "role": "STARTUP", "startup": {"name": f"Startup {tag} {email}"},
    })
    assert resp.status_code == 201, resp.text
    return resp.json()["access_token"]


def _pilot_status(name):
    try:
        from app.models.enums import PilotStatus
        return PilotStatus(name)
    except (ImportError, ValueError):
        return name


def _seed_pilot(active=True, terms=True):
    """Build dept owner + startup + manager via API, challenge/proposal/select
    via API, then insert the Pilot row directly. Returns dict of tokens/ids."""
    tag = _n("p-")
    owner_token = _register_dept_owner(tag)
    startup_token = _register_startup(tag)
    manager_token, manager_id = _register_role(
        f"{_n('exec-mgr-')}@gov.in", "PILOT_MANAGER")

    resp = client.post("/api/challenges", json={
        "title": f"Execution challenge {tag}",
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
    from app.modules.orgs.models import Startup
    from app.modules.pilots.models import Pilot

    s = SessionLocal()
    try:
        # Resolve ids without extra endpoints: the most recent startup row
        # belongs to our just-registered startup; the dept owner is matched
        # via the challenge's department.
        from app.modules.challenges.models import Challenge
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
        dept_id = ch_row.department_id
        startup_id = st.id
    finally:
        s.close()
    return {"owner_token": owner_token, "startup_token": startup_token,
            "manager_token": manager_token, "manager_id": manager_id,
            "pilot_id": pilot_id, "department_id": dept_id,
            "startup_id": startup_id, "proposal_id": prop["id"]}


def _evaluator():
    return _register_role(f"{_n('exec-eval-')}@gov.in", "EVALUATOR")


def _ms_payload(title="Baseline survey", amount=100000.0, **kw):
    payload = {"title": title, "amount": amount}
    payload.update(kw)
    return payload


# ---- Milestone lifecycle ----

def test_milestone_lifecycle_happy():
    ctx = _seed_pilot(active=True, terms=True)
    hdr_mgr = {"Authorization": f"Bearer {ctx['manager_token']}"}
    hdr_startup = {"Authorization": f"Bearer {ctx['startup_token']}"}
    pid = ctx["pilot_id"]

    resp = client.post(f"/api/pilots/{pid}/milestones",
                       json=_ms_payload(), headers=hdr_mgr)
    assert resp.status_code == 201, resp.text
    ms = resp.json()
    assert ms["status"] == "PENDING"
    assert ms["safety_critical"] is False

    resp = client.post(
        f"/api/pilots/{pid}/milestones/{ms['id']}/submit",
        headers=hdr_startup)
    assert resp.status_code == 200, resp.text
    assert resp.json()["status"] == "SUBMITTED"

    resp = client.post(
        f"/api/pilots/{pid}/milestones/{ms['id']}/verify", headers=hdr_mgr)
    assert resp.status_code == 200, resp.text
    assert resp.json()["status"] == "VERIFIED"

    resp = client.get(f"/api/pilots/{pid}/milestones", headers=hdr_mgr)
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["total"] == 1 and body["page"] == 1
    assert body["items"][0]["status"] == "VERIFIED"


def test_submit_before_active_409():
    ctx = _seed_pilot(active=False, terms=True)
    hdr_mgr = {"Authorization": f"Bearer {ctx['manager_token']}"}
    hdr_startup = {"Authorization": f"Bearer {ctx['startup_token']}"}
    pid = ctx["pilot_id"]
    ms = client.post(f"/api/pilots/{pid}/milestones", json=_ms_payload(),
                     headers=hdr_mgr).json()
    resp = client.post(
        f"/api/pilots/{pid}/milestones/{ms['id']}/submit",
        headers=hdr_startup)
    assert resp.status_code == 409, resp.text
    assert resp.json()["code"] == "PILOT_NOT_ACTIVE"


def test_submit_without_terms_409():
    ctx = _seed_pilot(active=True, terms=False)
    hdr_mgr = {"Authorization": f"Bearer {ctx['manager_token']}"}
    hdr_startup = {"Authorization": f"Bearer {ctx['startup_token']}"}
    pid = ctx["pilot_id"]
    ms = client.post(f"/api/pilots/{pid}/milestones", json=_ms_payload(),
                     headers=hdr_mgr).json()
    resp = client.post(
        f"/api/pilots/{pid}/milestones/{ms['id']}/submit",
        headers=hdr_startup)
    assert resp.status_code == 409, resp.text
    assert resp.json()["code"] == "TERMS_NOT_ACCEPTED"


def test_startup_verify_403():
    ctx = _seed_pilot(active=True, terms=True)
    hdr_mgr = {"Authorization": f"Bearer {ctx['manager_token']}"}
    hdr_startup = {"Authorization": f"Bearer {ctx['startup_token']}"}
    pid = ctx["pilot_id"]
    ms = client.post(f"/api/pilots/{pid}/milestones", json=_ms_payload(),
                     headers=hdr_mgr).json()
    client.post(f"/api/pilots/{pid}/milestones/{ms['id']}/submit",
                headers=hdr_startup)
    resp = client.post(
        f"/api/pilots/{pid}/milestones/{ms['id']}/verify",
        headers=hdr_startup)
    assert resp.status_code == 403, resp.text


def test_evaluator_verify_200():
    ctx = _seed_pilot(active=True, terms=True)
    hdr_mgr = {"Authorization": f"Bearer {ctx['manager_token']}"}
    hdr_startup = {"Authorization": f"Bearer {ctx['startup_token']}"}
    eval_token, _ = _evaluator()
    hdr_eval = {"Authorization": f"Bearer {eval_token}"}
    pid = ctx["pilot_id"]
    ms = client.post(f"/api/pilots/{pid}/milestones", json=_ms_payload(),
                     headers=hdr_mgr).json()
    client.post(f"/api/pilots/{pid}/milestones/{ms['id']}/submit",
                headers=hdr_startup)
    resp = client.post(
        f"/api/pilots/{pid}/milestones/{ms['id']}/verify", headers=hdr_eval)
    assert resp.status_code == 200, resp.text
    assert resp.json()["status"] == "VERIFIED"


def test_direct_paid_impossible_no_endpoint():
    """No endpoint enters PAID directly; service-level call must raise."""
    from app.core.database import SessionLocal
    from app.core.errors import AppError
    from app.modules.execution import service as exservice

    ctx = _seed_pilot(active=True, terms=True)
    hdr_mgr = {"Authorization": f"Bearer {ctx['manager_token']}"}
    pid = ctx["pilot_id"]
    ms = client.post(f"/api/pilots/{pid}/milestones", json=_ms_payload(),
                     headers=hdr_mgr).json()
    s = SessionLocal()
    try:
        with pytest.raises(AppError):
            exservice.mark_milestone_paid(s, ms["id"])
        s.rollback()
    finally:
        s.close()


def test_verify_pending_milestone_409():
    ctx = _seed_pilot(active=True, terms=True)
    hdr_mgr = {"Authorization": f"Bearer {ctx['manager_token']}"}
    pid = ctx["pilot_id"]
    ms = client.post(f"/api/pilots/{pid}/milestones", json=_ms_payload(),
                     headers=hdr_mgr).json()
    resp = client.post(
        f"/api/pilots/{pid}/milestones/{ms['id']}/verify", headers=hdr_mgr)
    assert resp.status_code == 409, resp.text


# ---- KPIs ----

def test_kpi_create_and_actual_update():
    ctx = _seed_pilot(active=True, terms=True)
    hdr_mgr = {"Authorization": f"Bearer {ctx['manager_token']}"}
    pid = ctx["pilot_id"]
    resp = client.post(f"/api/pilots/{pid}/kpis", json={
        "name": "Non-revenue water %", "unit": "%",
        "baseline": 38.0, "target": 15.0, "direction": "LOWER",
    }, headers=hdr_mgr)
    assert resp.status_code == 201, resp.text
    kpi = resp.json()
    assert kpi["actual"] is None
    resp = client.patch(f"/api/pilots/{pid}/kpis/{kpi['id']}",
                        json={"actual": 22.5}, headers=hdr_mgr)
    assert resp.status_code == 200, resp.text
    assert resp.json()["actual"] == 22.5


def test_kpi_direction_literals_both_ok():
    ctx = _seed_pilot(active=True, terms=True)
    hdr_mgr = {"Authorization": f"Bearer {ctx['manager_token']}"}
    pid = ctx["pilot_id"]
    for direction in ("HIGHER", "LOWER"):
        resp = client.post(f"/api/pilots/{pid}/kpis", json={
            "name": f"KPI {direction}", "baseline": 0.0,
            "target": 10.0, "direction": direction,
        }, headers=hdr_mgr)
        assert resp.status_code == 201, resp.text
        assert resp.json()["direction"] == direction


def test_kpi_bad_direction_422():
    ctx = _seed_pilot(active=True, terms=True)
    hdr_mgr = {"Authorization": f"Bearer {ctx['manager_token']}"}
    pid = ctx["pilot_id"]
    resp = client.post(f"/api/pilots/{pid}/kpis", json={
        "name": "Bad direction", "baseline": 0.0,
        "target": 10.0, "direction": "SIDEWAYS",
    }, headers=hdr_mgr)
    assert resp.status_code == 422, resp.text


def test_startup_kpi_readonly_get_ok_patch_403():
    ctx = _seed_pilot(active=True, terms=True)
    hdr_mgr = {"Authorization": f"Bearer {ctx['manager_token']}"}
    hdr_startup = {"Authorization": f"Bearer {ctx['startup_token']}"}
    pid = ctx["pilot_id"]
    kpi = client.post(f"/api/pilots/{pid}/kpis", json={
        "name": "Coverage", "baseline": 0.0,
        "target": 100.0, "direction": "HIGHER",
    }, headers=hdr_mgr).json()
    resp = client.get(f"/api/pilots/{pid}/kpis", headers=hdr_startup)
    assert resp.status_code == 200, resp.text
    assert resp.json()["total"] == 1
    resp = client.patch(f"/api/pilots/{pid}/kpis/{kpi['id']}",
                        json={"actual": 50.0}, headers=hdr_startup)
    assert resp.status_code == 403, resp.text


# ---- Startup create 403s x4 ----

def test_startup_cannot_create_milestone_403():
    ctx = _seed_pilot(active=True, terms=True)
    resp = client.post(f"/api/pilots/{ctx['pilot_id']}/milestones",
                       json=_ms_payload(),
                       headers={"Authorization":
                                f"Bearer {ctx['startup_token']}"})
    assert resp.status_code == 403, resp.text


def test_startup_cannot_create_kpi_403():
    ctx = _seed_pilot(active=True, terms=True)
    resp = client.post(f"/api/pilots/{ctx['pilot_id']}/kpis", json={
        "name": "X", "baseline": 0.0, "target": 1.0,
        "direction": "HIGHER",
    }, headers={"Authorization": f"Bearer {ctx['startup_token']}"})
    assert resp.status_code == 403, resp.text


def test_startup_cannot_create_risk_403():
    ctx = _seed_pilot(active=True, terms=True)
    resp = client.post(f"/api/pilots/{ctx['pilot_id']}/risks",
                       json={"description": "Sensor supply delay risk."},
                       headers={"Authorization":
                                f"Bearer {ctx['startup_token']}"})
    assert resp.status_code == 403, resp.text


def test_startup_cannot_create_constraint_403():
    ctx = _seed_pilot(active=True, terms=True)
    resp = client.post(f"/api/pilots/{ctx['pilot_id']}/constraints",
                       json={"constraint_type": "POWER"},
                       headers={"Authorization":
                                f"Bearer {ctx['startup_token']}"})
    assert resp.status_code == 403, resp.text


# ---- safety_critical ----

def test_safety_critical_manager_true_ok():
    ctx = _seed_pilot(active=True, terms=True)
    hdr_mgr = {"Authorization": f"Bearer {ctx['manager_token']}"}
    pid = ctx["pilot_id"]
    ms = client.post(f"/api/pilots/{pid}/milestones",
                     json=_ms_payload(safety_critical=True),
                     headers=hdr_mgr).json()
    assert ms["safety_critical"] is True
    resp = client.post(f"/api/pilots/{pid}/kpis", json={
        "name": "Pressure safety", "baseline": 0.0, "target": 5.0,
        "direction": "LOWER", "safety_critical": True,
    }, headers=hdr_mgr)
    assert resp.status_code == 201, resp.text
    assert resp.json()["safety_critical"] is True


def test_safety_critical_startup_true_400():
    ctx = _seed_pilot(active=True, terms=True)
    hdr_startup = {"Authorization": f"Bearer {ctx['startup_token']}"}
    pid = ctx["pilot_id"]
    resp = client.post(f"/api/pilots/{pid}/milestones",
                       json=_ms_payload(safety_critical=True),
                       headers=hdr_startup)
    assert resp.status_code == 400, resp.text
    assert resp.json()["code"] == "SAFETY_CRITICAL_FORBIDDEN"
    resp = client.post(f"/api/pilots/{pid}/kpis", json={
        "name": "X", "baseline": 0.0, "target": 1.0,
        "direction": "HIGHER", "safety_critical": True,
    }, headers=hdr_startup)
    assert resp.status_code == 400, resp.text
    assert resp.json()["code"] == "SAFETY_CRITICAL_FORBIDDEN"


# ---- Risks & constraints ----

def test_risk_resolved_toggle():
    ctx = _seed_pilot(active=True, terms=True)
    hdr_mgr = {"Authorization": f"Bearer {ctx['manager_token']}"}
    pid = ctx["pilot_id"]
    resp = client.post(f"/api/pilots/{pid}/risks",
                       json={"description": "Monsoon flooding may delay field installation work."},
                       headers=hdr_mgr)
    assert resp.status_code == 201, resp.text
    risk = resp.json()
    assert risk["resolved"] is False
    resp = client.patch(f"/api/pilots/{pid}/risks/{risk['id']}",
                        json={"resolved": True}, headers=hdr_mgr)
    assert resp.status_code == 200, resp.text
    assert resp.json()["resolved"] is True
    resp = client.patch(f"/api/pilots/{pid}/risks/{risk['id']}",
                        json={"resolved": False}, headers=hdr_mgr)
    assert resp.status_code == 200, resp.text
    assert resp.json()["resolved"] is False


def test_constraint_types_all_accepted():
    ctx = _seed_pilot(active=True, terms=True)
    hdr_mgr = {"Authorization": f"Bearer {ctx['manager_token']}"}
    pid = ctx["pilot_id"]
    for ctype in ("CONNECTIVITY", "POWER", "STAFFING", "DATA_ACCESS",
                  "OTHER"):
        resp = client.post(f"/api/pilots/{pid}/constraints",
                           json={"constraint_type": ctype,
                                 "notes": f"notes for {ctype}"},
                           headers=hdr_mgr)
        assert resp.status_code == 201, resp.text
        assert resp.json()["constraint_type"] == ctype
    resp = client.get(f"/api/pilots/{pid}/constraints", headers=hdr_mgr)
    assert resp.status_code == 200, resp.text
    assert resp.json()["total"] == 5


def test_cross_pilot_access_404():
    ctx1 = _seed_pilot(active=True, terms=True)
    ctx2 = _seed_pilot(active=True, terms=True)
    hdr_owner2 = {"Authorization": f"Bearer {ctx2['owner_token']}"}
    # Dept owner of pilot 2 cannot see pilot 1's execution lists.
    resp = client.get(f"/api/pilots/{ctx1['pilot_id']}/milestones",
                      headers=hdr_owner2)
    assert resp.status_code == 404, resp.text
    # Startup of pilot 2 cannot see pilot 1 either.
    hdr_startup2 = {"Authorization": f"Bearer {ctx2['startup_token']}"}
    resp = client.get(f"/api/pilots/{ctx1['pilot_id']}/kpis",
                      headers=hdr_startup2)
    assert resp.status_code == 404, resp.text
    # Scoped child: milestone of pilot 1 addressed under pilot 2 -> 404.
    hdr_mgr2 = {"Authorization": f"Bearer {ctx2['manager_token']}"}
    ms1 = client.post(f"/api/pilots/{ctx1['pilot_id']}/milestones",
                      json=_ms_payload(),
                      headers={"Authorization":
                               f"Bearer {ctx1['manager_token']}"}).json()
    resp = client.post(
        f"/api/pilots/{ctx2['pilot_id']}/milestones/{ms1['id']}/verify",
        headers=hdr_mgr2)
    assert resp.status_code == 404, resp.text


# ---- F2: terminal-pilot write guard (409 PILOT_NOT_ACTIVE) ----

def _drive_to_terminal(ctx, kind):
    """Drive an ACTIVE pilot to a terminal state via the public endpoints."""
    pid = ctx["pilot_id"]
    hdr_mgr = {"Authorization": f"Bearer {ctx['manager_token']}"}
    hdr_owner = {"Authorization": f"Bearer {ctx['owner_token']}"}
    if kind == "FAILED":
        resp = client.post(
            f"/api/pilots/{pid}/fail",
            json={"failure_conditions":
                  "Sensor calibration drifted beyond tolerance in field wards."},
            headers=hdr_mgr)
        assert resp.status_code == 200, resp.text
    elif kind == "TERMINATED":
        resp = client.post(
            f"/api/pilots/{pid}/terminate",
            json={"reason":
                  "Department budget reallocated to flood response work."},
            headers=hdr_owner)
        assert resp.status_code == 200, resp.text
    elif kind == "COMPLETED":
        resp = client.post(f"/api/pilots/{pid}/complete", headers=hdr_mgr)
        assert resp.status_code == 200, resp.text
    else:
        raise AssertionError(kind)


def test_create_milestone_on_failed_pilot_409():
    ctx = _seed_pilot(active=True, terms=True)
    _drive_to_terminal(ctx, "FAILED")
    resp = client.post(f"/api/pilots/{ctx['pilot_id']}/milestones",
                       json=_ms_payload(),
                       headers={"Authorization":
                                f"Bearer {ctx['manager_token']}"})
    assert resp.status_code == 409, resp.text
    assert resp.json()["code"] == "PILOT_NOT_ACTIVE"


def test_verify_milestone_on_completed_pilot_409():
    ctx = _seed_pilot(active=True, terms=True)
    hdr_mgr = {"Authorization": f"Bearer {ctx['manager_token']}"}
    hdr_startup = {"Authorization": f"Bearer {ctx['startup_token']}"}
    pid = ctx["pilot_id"]
    ms = client.post(f"/api/pilots/{pid}/milestones", json=_ms_payload(),
                     headers=hdr_mgr).json()
    client.post(f"/api/pilots/{pid}/milestones/{ms['id']}/submit",
                headers=hdr_startup)
    _drive_to_terminal(ctx, "COMPLETED")
    resp = client.post(f"/api/pilots/{pid}/milestones/{ms['id']}/verify",
                       headers=hdr_mgr)
    assert resp.status_code == 409, resp.text
    assert resp.json()["code"] == "PILOT_NOT_ACTIVE"


def test_create_kpi_on_terminated_pilot_409():
    ctx = _seed_pilot(active=True, terms=True)
    _drive_to_terminal(ctx, "TERMINATED")
    resp = client.post(f"/api/pilots/{ctx['pilot_id']}/kpis", json={
        "name": "Coverage", "baseline": 0.0,
        "target": 100.0, "direction": "HIGHER",
    }, headers={"Authorization": f"Bearer {ctx['manager_token']}"})
    assert resp.status_code == 409, resp.text
    assert resp.json()["code"] == "PILOT_NOT_ACTIVE"


def test_remaining_write_paths_blocked_on_terminal_pilot_409():
    # Covers patch_kpi / create-risk / patch-risk / create-constraint guards
    # (create_milestone / verify / create_kpi tested individually above).
    ctx = _seed_pilot(active=True, terms=True)
    hdr_mgr = {"Authorization": f"Bearer {ctx['manager_token']}"}
    pid = ctx["pilot_id"]
    kpi = client.post(f"/api/pilots/{pid}/kpis", json={
        "name": "Uptime", "baseline": 90.0,
        "target": 99.0, "direction": "HIGHER",
    }, headers=hdr_mgr).json()
    risk = client.post(f"/api/pilots/{pid}/risks", json={
        "description": "Spare parts supply may be delayed during monsoon season.",
    }, headers=hdr_mgr).json()
    _drive_to_terminal(ctx, "FAILED")
    resp = client.patch(f"/api/pilots/{pid}/kpis/{kpi['id']}",
                        json={"actual": 95.0}, headers=hdr_mgr)
    assert resp.status_code == 409, resp.text
    assert resp.json()["code"] == "PILOT_NOT_ACTIVE"
    resp = client.post(f"/api/pilots/{pid}/risks", json={
        "description": "Post-failure risk entry that must be rejected outright.",
    }, headers=hdr_mgr)
    assert resp.status_code == 409, resp.text
    resp = client.patch(f"/api/pilots/{pid}/risks/{risk['id']}",
                        json={"resolved": True}, headers=hdr_mgr)
    assert resp.status_code == 409, resp.text
    resp = client.post(f"/api/pilots/{pid}/constraints", json={
        "constraint_type": "POWER", "context_value": "LOW",
    }, headers=hdr_mgr)
    assert resp.status_code == 409, resp.text
