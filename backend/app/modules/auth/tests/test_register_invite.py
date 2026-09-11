from datetime import timedelta

import jwt as pyjwt
from fastapi.testclient import TestClient

from app.main import app
from app.models.audit import utcnow

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
    return resp.json()


def _create_challenge(token):
    resp = client.post("/api/challenges", json={
        "title": "AI pipeline leak detection",
        "problem_statement": "Detect water pipeline leaks across the network.",
        "baseline": "38% non-revenue water",
        "target": "Under 15% non-revenue water",
        "domain": "water", "budget": 1500000.0,
    }, headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 201, resp.text
    return resp.json()


def _seed_invitation(challenge_id, invite_code, *, invited_by, status="SENT",
                     expires_at=None):
    from app.core.database import SessionLocal
    from app.models.enums import InvitationStatus
    from app.modules.discovery.models import Invitation
    s = SessionLocal()
    inv = Invitation(
        challenge_id=challenge_id,
        email="new@startup.in",
        invite_code=invite_code,
        status=InvitationStatus(status),
        invited_by=invited_by,
        expires_at=expires_at or utcnow() + timedelta(days=14),
    )
    s.add(inv)
    s.commit()
    inv_id, code = inv.id, inv.invite_code
    s.close()
    return inv_id, code


def _get_invitation(inv_id):
    from app.core.database import SessionLocal
    from app.modules.discovery.models import Invitation as InvitationModel
    s = SessionLocal()
    inv = s.query(InvitationModel).filter(InvitationModel.id == inv_id).one()
    row = (inv.status, inv.registered_startup_id)
    s.close()
    return row


def _invite_payload(invite_code, email="new@startup.in", **overrides):
    payload = {
        "email": email, "password": "Passw0rd!123",
        "full_name": "Invited Founder", "startup_name": "Invited WaterTech",
        "invite_code": invite_code,
    }
    payload.update(overrides)
    return payload


def test_register_with_invite_happy_path():
    dept = _register_dept_owner("inv-wrd@maharashtra.gov.in", "INVWRD")
    ch = _create_challenge(dept["access_token"])
    inv_id, code = _seed_invitation(ch["id"], "testcode12345678",
                                    invited_by=dept["user"]["id"])
    resp = client.post("/api/auth/register-with-invite",
                       json=_invite_payload(code))
    assert resp.status_code == 201, resp.text
    body = resp.json()
    assert body["access_token"]
    claims = pyjwt.decode(body["access_token"], options={"verify_signature": False})
    assert claims["portal"] == "A"
    assert claims["role"] == "STARTUP"
    status, registered_startup_id = _get_invitation(inv_id)
    assert status.value == "REGISTERED"
    assert registered_startup_id is not None


def test_register_with_invite_expired_code():
    dept = _register_dept_owner("inv-exp@maharashtra.gov.in", "INVEXP")
    ch = _create_challenge(dept["access_token"])
    inv_id, code = _seed_invitation(
        ch["id"], "expiredcode12345678", invited_by=dept["user"]["id"],
        expires_at=utcnow() - timedelta(days=1))
    resp = client.post("/api/auth/register-with-invite",
                       json=_invite_payload(code))
    assert resp.status_code == 409
    assert resp.json()["code"] == "INVITATION_EXPIRED"
    status, registered_startup_id = _get_invitation(inv_id)
    assert status.value == "EXPIRED"
    assert registered_startup_id is None


def test_register_with_invite_expired_creates_no_user():
    dept = _register_dept_owner("inv-nouser@maharashtra.gov.in", "INVNU")
    ch = _create_challenge(dept["access_token"])
    inv_id, code = _seed_invitation(
        ch["id"], "nousercode1234567", invited_by=dept["user"]["id"],
        expires_at=utcnow() - timedelta(days=1))
    resp = client.post("/api/auth/register-with-invite",
                       json=_invite_payload(code, email="ghost@acme.in"))
    assert resp.status_code == 409
    assert resp.json()["code"] == "INVITATION_EXPIRED"
    from app.core.database import SessionLocal
    from app.modules.auth.models import User as UserModel
    s = SessionLocal()
    assert s.query(UserModel).filter_by(email="ghost@acme.in").first() is None
    s.close()
    # the EXPIRED flip is still persisted
    status, registered_startup_id = _get_invitation(inv_id)
    assert status.value == "EXPIRED"
    assert registered_startup_id is None


def test_register_with_invite_reused_code():
    dept = _register_dept_owner("inv-used@maharashtra.gov.in", "INVUSED")
    ch = _create_challenge(dept["access_token"])
    inv_id, code = _seed_invitation(ch["id"], "reusedcode12345678",
                                    invited_by=dept["user"]["id"],
                                    status="REGISTERED")
    resp = client.post("/api/auth/register-with-invite",
                       json=_invite_payload(code))
    assert resp.status_code == 409
    assert resp.json()["code"] == "INVITATION_ALREADY_USED"


def test_register_with_invite_unknown_code():
    resp = client.post("/api/auth/register-with-invite",
                       json=_invite_payload("unknowncode12345"))
    assert resp.status_code == 404
    assert resp.json()["code"] == "NOT_FOUND"


def test_register_with_invite_duplicate_email():
    dept = _register_dept_owner("inv-dup@maharashtra.gov.in", "INVDUP")
    ch = _create_challenge(dept["access_token"])
    _, code = _seed_invitation(ch["id"], "dupcode1234567890",
                               invited_by=dept["user"]["id"])
    client.post("/api/auth/register", json={
        "email": "new@startup.in", "password": "Passw0rd!123",
        "full_name": "Existing Founder", "role": "STARTUP",
        "startup": {"name": "Existing Startup"},
    })
    resp = client.post("/api/auth/register-with-invite",
                       json=_invite_payload(code))
    assert resp.status_code == 409
    assert resp.json()["code"] == "EMAIL_TAKEN"


def test_register_with_invite_missing_startup_name():
    resp = client.post("/api/auth/register-with-invite", json={
        "email": "noname@startup.in", "password": "Passw0rd!123",
        "full_name": "No Name Founder", "invite_code": "testcode12345678",
    })
    assert resp.status_code == 422
