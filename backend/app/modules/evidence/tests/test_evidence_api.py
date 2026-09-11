"""Task L evidence API tests (upload, extract, triage, validation, KPI-apply).

Router is mounted by the controller at the serial gate (prefix /api);
these tests are written as if mounted.

Pilot seeding mirrors the execution tests: Pilot rows are created DIRECTLY
via SessionLocal rather than through pilot-creation routes. Provider calls
are monkeypatched at app.modules.evidence.service.get_ai_provider — never
dependent on mock content.
"""

import itertools
import os

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

_seq = itertools.count(1)


def _n(tag):
    return f"{tag}{next(_seq)}"


def _auth(token):
    return {"Authorization": f"Bearer {token}"}


def _register_dept_owner(tag):
    email = f"{_n('ev-owner-')}@maharashtra.gov.in"
    code = f"EV{next(_seq):05d}"[:20]
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
    email = f"{_n('ev-startup-')}@acme.in"
    resp = client.post("/api/auth/register", json={
        "email": email, "password": "Passw0rd!123", "full_name": "Founder",
        "role": "STARTUP", "startup": {"name": f"Startup {tag} {email}"},
    })
    assert resp.status_code == 201, resp.text
    return resp.json()["access_token"]


def _seed_pilot():
    tag = _n("p-")
    owner_token = _register_dept_owner(tag)
    startup_token = _register_startup(tag)
    manager_token, manager_id = _register_role(
        f"{_n('ev-mgr-')}@gov.in", "PILOT_MANAGER")

    resp = client.post("/api/challenges", json={
        "title": f"Evidence challenge {tag}",
        "problem_statement": "Reduce non-revenue water through AI leak detection in urban distribution networks.",
        "domain": "water", "budget": 1500000.0,
    }, headers=_auth(owner_token))
    assert resp.status_code == 201, resp.text
    ch = resp.json()
    resp = client.post(f"/api/challenges/{ch['id']}/publish",
                       headers=_auth(owner_token))
    assert resp.status_code == 200, resp.text

    resp = client.post(f"/api/challenges/{ch['id']}/proposals", json={
        "technical_summary": "Acoustic sensors plus ML models for leak prediction and localization.",
        "cost_estimate": 500000.0,
    }, headers=_auth(startup_token))
    assert resp.status_code == 201, resp.text
    prop = resp.json()

    resp = client.post(f"/api/proposals/{prop['id']}/select",
                       headers=_auth(owner_token))
    assert resp.status_code == 200, resp.text

    from app.core.database import SessionLocal
    from app.modules.challenges.models import Challenge
    from app.modules.orgs.models import Startup
    from app.modules.auth.models import User
    from app.modules.pilots.models import Pilot
    from app.models.enums import PilotStatus

    s = SessionLocal()
    try:
        st = s.query(Startup).order_by(Startup.id.desc()).first()
        ch_row = s.get(Challenge, ch["id"])
        pilot = Pilot(
            proposal_id=prop["id"],
            department_id=ch_row.department_id,
            startup_id=st.id,
            pilot_manager_id=manager_id,
            scope="Ward-level leak detection pilot across 5 zones.",
            status=PilotStatus.ACTIVE,
            terms_accepted=True,
        )
        s.add(pilot)
        s.commit()
        pilot_id = pilot.id
    finally:
        s.close()
    return {"owner_token": owner_token, "startup_token": startup_token,
            "manager_token": manager_token, "pilot_id": pilot_id,
            "proposal_id": prop["id"]}


def _evaluator():
    return _register_role(f"{_n('ev-eval-')}@gov.in", "EVALUATOR")


def _make_milestone(token, pilot_id, safety=False):
    resp = client.post(f"/api/pilots/{pilot_id}/milestones", json={
        "title": f"Milestone {_n('m-')}", "amount": 100000.0,
        "safety_critical": safety,
    }, headers=_auth(token))
    assert resp.status_code == 201, resp.text
    return resp.json()


def _make_kpi(token, pilot_id):
    resp = client.post(f"/api/pilots/{pilot_id}/kpis", json={
        "name": f"KPI {_n('k-')}", "definition": "Water saved",
        "unit": "kL", "baseline": 0.0, "target": 100.0,
        "direction": "HIGHER",
    }, headers=_auth(token))
    assert resp.status_code == 201, resp.text
    return resp.json()


def _upload(token, pilot_id, content=b"meter reading 12.5 kL saved",
            etype="KPI_MEASUREMENT", title="Meter photo", **extra):
    files = {"file": ("reading.txt", content, "text/plain")}
    data = {"evidence_type": etype, "title": title}
    for key, value in extra.items():
        data[key] = value
    return client.post(f"/api/pilots/{pilot_id}/evidence", files=files,
                       data=data, headers=_auth(token))


class _FakeProvider:
    def __init__(self, confidence=0.95, actual=12.5):
        self.confidence = confidence
        self.actual = actual

    def extract(self, evidence_text, evidence_type):
        if self.actual is None:
            data = {"summary": "no numeric reading found"}
        else:
            data = {"actual": self.actual, "unit": "kL"}
        return {"extracted_data": data, "confidence": self.confidence,
                "source_span": str(evidence_text)[:50]}


def _patch_provider(monkeypatch, confidence=0.95, actual=12.5):
    import app.modules.evidence.service as svc
    monkeypatch.setattr(svc, "get_ai_provider",
                        lambda: _FakeProvider(confidence, actual))


def _db():
    from app.core.database import SessionLocal
    return SessionLocal()


# ---- upload ----

def test_upload_happy():
    seed = _seed_pilot()
    resp = _upload(seed["startup_token"], seed["pilot_id"])
    assert resp.status_code == 201, resp.text
    body = resp.json()
    assert body["status"] == "UNVERIFIED"
    assert body["evidence_type"] == "KPI_MEASUREMENT"
    assert "file_path" not in body  # server paths never leak to clients
    assert body["filename"].endswith(".txt")
    # file is retrievable through the download endpoint
    dl = client.get(f"/api/evidence/{body['id']}/file",
                    headers={"Authorization": f"Bearer {seed['startup_token']}"})
    assert dl.status_code == 200
    assert b"meter reading" in dl.content


def test_upload_wrong_type_enum_422():
    seed = _seed_pilot()
    resp = _upload(seed["startup_token"], seed["pilot_id"], etype="NOPE")
    assert resp.status_code == 422


def test_upload_too_large_413():
    seed = _seed_pilot()
    resp = _upload(seed["startup_token"], seed["pilot_id"],
                   content=b"x" * (11 * 1024 * 1024))
    assert resp.status_code == 413
    assert resp.json()["code"] == "FILE_TOO_LARGE"


def test_upload_to_other_pilot_404():
    seed = _seed_pilot()
    other = _seed_pilot()
    resp = _upload(seed["startup_token"], other["pilot_id"])
    assert resp.status_code == 404


def test_other_startup_upload_forbidden():
    seed = _seed_pilot()
    outsider = _register_startup("outsider")
    resp = _upload(outsider, seed["pilot_id"])
    assert resp.status_code in (403, 404)


def test_uploader_safety_true_400():
    seed = _seed_pilot()
    resp = _upload(seed["startup_token"], seed["pilot_id"],
                   safety_critical="true")
    assert resp.status_code == 400
    assert resp.json()["code"] == "SAFETY_CRITICAL_FORBIDDEN"


def test_safety_inherited_from_milestone():
    seed = _seed_pilot()
    ms = _make_milestone(seed["manager_token"], seed["pilot_id"], safety=True)
    resp = _upload(seed["startup_token"], seed["pilot_id"],
                   milestone_id=str(ms["id"]))
    assert resp.status_code == 201, resp.text
    assert resp.json()["safety_critical"] is True


# ---- extract + triage ----

def test_extract_high_confidence_auto_approves(monkeypatch):
    seed = _seed_pilot()
    _patch_provider(monkeypatch, confidence=0.95, actual=12.5)
    ev = _upload(seed["startup_token"], seed["pilot_id"]).json()
    resp = client.post(f"/api/evidence/{ev['id']}/extract",
                       headers=_auth(seed["startup_token"]))
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["status"] == "EVALUATOR_VERIFIED"
    assert body["ai_confidence"] == 0.95
    assert body["extracted_data"]["actual"] == 12.5

    from app.modules.evidence.models import Validation
    s = _db()
    try:
        row = s.query(Validation).filter(
            Validation.evidence_item_id == ev["id"]).one()
        assert row.method == "auto-triage"
        assert row.auto_approved is True
        assert row.validator_id is None
        assert row.verdict == "VERIFIED"
    finally:
        s.close()


def test_extract_low_confidence_stays_queued(monkeypatch):
    seed = _seed_pilot()
    _patch_provider(monkeypatch, confidence=0.5, actual=12.5)
    ev = _upload(seed["startup_token"], seed["pilot_id"]).json()
    resp = client.post(f"/api/evidence/{ev['id']}/extract",
                       headers=_auth(seed["manager_token"]))
    assert resp.status_code == 200, resp.text
    assert resp.json()["status"] == "AI_EXTRACTED"


def test_extract_cost_record_high_confidence_stays_queued(monkeypatch):
    seed = _seed_pilot()
    _patch_provider(monkeypatch, confidence=0.99, actual=12.5)
    ev = _upload(seed["startup_token"], seed["pilot_id"],
                 etype="COST_RECORD").json()
    resp = client.post(f"/api/evidence/{ev['id']}/extract",
                       headers=_auth(seed["startup_token"]))
    assert resp.status_code == 200, resp.text
    assert resp.json()["status"] == "AI_EXTRACTED"


# ---- validate + KPI-apply ----

def test_validate_verified_applies_kpi(monkeypatch):
    seed = _seed_pilot()
    kpi = _make_kpi(seed["manager_token"], seed["pilot_id"])
    _patch_provider(monkeypatch, confidence=0.5, actual=12.5)
    ev = _upload(seed["startup_token"], seed["pilot_id"],
                 kpi_id=str(kpi["id"])).json()
    resp = client.post(f"/api/evidence/{ev['id']}/extract",
                       headers=_auth(seed["startup_token"]))
    assert resp.json()["status"] == "AI_EXTRACTED"

    eval_token, _ = _evaluator()
    resp = client.post(f"/api/evidence/{ev['id']}/validate",
                       json={"verdict": "VERIFIED", "notes": "looks good"},
                       headers=_auth(eval_token))
    assert resp.status_code == 200, resp.text
    assert resp.json()["status"] == "EVALUATOR_VERIFIED"

    from app.models.audit import AuditLog
    from app.modules.execution.models import KPI
    s = _db()
    try:
        row = s.get(KPI, kpi["id"])
        assert row.actual == 12.5
        audit_row = s.query(AuditLog).filter(
            AuditLog.entity_type == "KPI",
            AuditLog.entity_id == str(kpi["id"])).first()
        assert audit_row is not None
    finally:
        s.close()


def test_validate_without_actual_no_kpi_change(monkeypatch):
    seed = _seed_pilot()
    kpi = _make_kpi(seed["manager_token"], seed["pilot_id"])
    _patch_provider(monkeypatch, confidence=0.5, actual=None)
    ev = _upload(seed["startup_token"], seed["pilot_id"],
                 kpi_id=str(kpi["id"])).json()
    client.post(f"/api/evidence/{ev['id']}/extract",
                headers=_auth(seed["startup_token"]))
    eval_token, _ = _evaluator()
    resp = client.post(f"/api/evidence/{ev['id']}/validate",
                       json={"verdict": "VERIFIED"},
                       headers=_auth(eval_token))
    assert resp.status_code == 200, resp.text

    from app.modules.execution.models import KPI
    s = _db()
    try:
        assert s.get(KPI, kpi["id"]).actual is None
    finally:
        s.close()


def test_validate_rejected_no_kpi_change(monkeypatch):
    seed = _seed_pilot()
    kpi = _make_kpi(seed["manager_token"], seed["pilot_id"])
    _patch_provider(monkeypatch, confidence=0.5, actual=12.5)
    ev = _upload(seed["startup_token"], seed["pilot_id"],
                 kpi_id=str(kpi["id"])).json()
    client.post(f"/api/evidence/{ev['id']}/extract",
                headers=_auth(seed["startup_token"]))
    eval_token, _ = _evaluator()
    resp = client.post(f"/api/evidence/{ev['id']}/validate",
                       json={"verdict": "REJECTED", "notes": "blurry"},
                       headers=_auth(eval_token))
    assert resp.status_code == 200, resp.text
    assert resp.json()["status"] == "REJECTED"

    from app.modules.execution.models import KPI
    s = _db()
    try:
        assert s.get(KPI, kpi["id"]).actual is None
    finally:
        s.close()


def test_revalidate_auto_approved_applies_kpi(monkeypatch):
    seed = _seed_pilot()
    kpi = _make_kpi(seed["manager_token"], seed["pilot_id"])
    _patch_provider(monkeypatch, confidence=0.95, actual=12.5)
    ev = _upload(seed["startup_token"], seed["pilot_id"],
                 kpi_id=str(kpi["id"])).json()
    resp = client.post(f"/api/evidence/{ev['id']}/extract",
                       headers=_auth(seed["startup_token"]))
    assert resp.json()["status"] == "EVALUATOR_VERIFIED"

    from app.modules.execution.models import KPI
    s = _db()
    try:
        assert s.get(KPI, kpi["id"]).actual is None
    finally:
        s.close()

    eval_token, _ = _evaluator()
    resp = client.post(f"/api/evidence/{ev['id']}/validate",
                       json={"verdict": "VERIFIED"},
                       headers=_auth(eval_token))
    assert resp.status_code == 200, resp.text
    s = _db()
    try:
        assert s.get(KPI, kpi["id"]).actual == 12.5
    finally:
        s.close()


def test_validate_already_manual_verified_409(monkeypatch):
    seed = _seed_pilot()
    _patch_provider(monkeypatch, confidence=0.5, actual=12.5)
    ev = _upload(seed["startup_token"], seed["pilot_id"]).json()
    client.post(f"/api/evidence/{ev['id']}/extract",
                headers=_auth(seed["startup_token"]))
    eval_token, _ = _evaluator()
    resp = client.post(f"/api/evidence/{ev['id']}/validate",
                       json={"verdict": "VERIFIED"},
                       headers=_auth(eval_token))
    assert resp.status_code == 200, resp.text
    resp = client.post(f"/api/evidence/{ev['id']}/validate",
                       json={"verdict": "VERIFIED"},
                       headers=_auth(eval_token))
    assert resp.status_code == 409


def test_evaluator_escalates_safety(monkeypatch):
    seed = _seed_pilot()
    _patch_provider(monkeypatch, confidence=0.5, actual=12.5)
    ev = _upload(seed["startup_token"], seed["pilot_id"]).json()
    assert ev["safety_critical"] is False
    client.post(f"/api/evidence/{ev['id']}/extract",
                headers=_auth(seed["startup_token"]))
    eval_token, _ = _evaluator()
    resp = client.post(f"/api/evidence/{ev['id']}/validate",
                       json={"verdict": "VERIFIED", "safety_critical": True},
                       headers=_auth(eval_token))
    assert resp.status_code == 200, resp.text
    assert resp.json()["safety_critical"] is True


def test_non_evaluator_validate_403(monkeypatch):
    seed = _seed_pilot()
    _patch_provider(monkeypatch, confidence=0.5, actual=12.5)
    ev = _upload(seed["startup_token"], seed["pilot_id"]).json()
    client.post(f"/api/evidence/{ev['id']}/extract",
                headers=_auth(seed["startup_token"]))
    resp = client.post(f"/api/evidence/{ev['id']}/validate",
                       json={"verdict": "VERIFIED"},
                       headers=_auth(seed["startup_token"]))
    assert resp.status_code == 403


# ---- queue / reads ----

def test_pending_queue_lists_only_ai_extracted(monkeypatch):
    seed = _seed_pilot()
    _patch_provider(monkeypatch, confidence=0.5, actual=12.5)
    queued = _upload(seed["startup_token"], seed["pilot_id"]).json()
    client.post(f"/api/evidence/{queued['id']}/extract",
                headers=_auth(seed["startup_token"]))
    unextracted = _upload(seed["startup_token"], seed["pilot_id"],
                          title="Not yet extracted").json()

    eval_token, _ = _evaluator()
    resp = client.get("/api/evidence/pending",
                      headers=_auth(eval_token))
    assert resp.status_code == 200, resp.text
    ids = [item["id"] for item in resp.json()["items"]]
    assert queued["id"] in ids
    assert unextracted["id"] not in ids


def test_file_download_returns_bytes():
    seed = _seed_pilot()
    payload = b"meter reading 12.5 kL saved on 2026-09-01"
    ev = _upload(seed["startup_token"], seed["pilot_id"],
                 content=payload).json()
    resp = client.get(f"/api/evidence/{ev['id']}/file",
                      headers=_auth(seed["startup_token"]))
    assert resp.status_code == 200
    assert resp.content == payload


def test_list_evidence_status_filter(monkeypatch):
    seed = _seed_pilot()
    _patch_provider(monkeypatch, confidence=0.5, actual=12.5)
    extracted = _upload(seed["startup_token"], seed["pilot_id"]).json()
    client.post(f"/api/evidence/{extracted['id']}/extract",
                headers=_auth(seed["startup_token"]))
    fresh = _upload(seed["startup_token"], seed["pilot_id"],
                    title="Fresh upload").json()

    resp = client.get(
        f"/api/pilots/{seed['pilot_id']}/evidence?status=AI_EXTRACTED",
        headers=_auth(seed["manager_token"]))
    assert resp.status_code == 200, resp.text
    ids = [item["id"] for item in resp.json()["items"]]
    assert extracted["id"] in ids
    assert fresh["id"] not in ids
