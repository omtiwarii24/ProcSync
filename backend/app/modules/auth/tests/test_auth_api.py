import jwt as pyjwt
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def _register(role="STARTUP", email="founder@acme.in"):
    payload = {
        "email": email,
        "password": "Passw0rd!123",
        "full_name": "Test User",
        "role": role,
    }
    if role == "STARTUP":
        payload["startup"] = {"name": f"Startup {email}"}
    elif role == "DEPT_OWNER":
        payload["department"] = {
            "name": f"Dept {email}", "code": email.split("@")[0].upper()[:20],
            "connectivity_tier": "MEDIUM", "power_reliability": "INTERMITTENT",
            "it_maturity": "MEDIUM", "settlement_type": "RURAL",
            "terrain_type": "HILLY",
        }
    resp = client.post("/api/auth/register", json=payload)
    assert resp.status_code == 201, resp.text
    return resp.json()


def test_register_startup():
    data = _register("STARTUP", "s1@acme.in")
    assert data["user"]["email"] == "s1@acme.in"
    assert data["user"]["role"] == "STARTUP"
    assert data["access_token"]


def test_register_rejects_admin():
    resp = client.post("/api/auth/register", json={
        "email": "evil@admin.in", "password": "Passw0rd!123",
        "full_name": "Evil", "role": "ADMIN",
    })
    assert resp.status_code == 403


def test_register_duplicate_email_409():
    _register("STARTUP", "dup@acme.in")
    resp = client.post("/api/auth/register", json={
        "email": "dup@acme.in", "password": "Passw0rd!123",
        "full_name": "Dup", "role": "STARTUP",
    })
    assert resp.status_code == 409


def test_login_success():
    _register("STARTUP", "login@acme.in")
    resp = client.post("/api/auth/login", json={
        "email": "login@acme.in", "password": "Passw0rd!123",
    })
    assert resp.status_code == 200
    body = resp.json()
    assert body["access_token"]
    assert body["user"]["email"] == "login@acme.in"


def test_login_wrong_password_401():
    _register("STARTUP", "wrongpw@acme.in")
    resp = client.post("/api/auth/login", json={
        "email": "wrongpw@acme.in", "password": "nope",
    })
    assert resp.status_code == 401


def test_login_inactive_user_401():
    _register("STARTUP", "inactive@acme.in")
    from app.core.database import SessionLocal
    from app.modules.auth.models import User as UserModel
    s = SessionLocal()
    u = s.query(UserModel).filter(UserModel.email == "inactive@acme.in").one()
    u.is_active = False
    s.commit(); s.close()
    resp = client.post("/api/auth/login", json={
        "email": "inactive@acme.in", "password": "Passw0rd!123",
    })
    assert resp.status_code == 401


def test_me_requires_token():
    resp = client.get("/api/auth/me")
    assert resp.status_code == 401


def test_me_returns_user():
    data = _register("DEPT_OWNER", "dept@maharashtra.gov.in")
    resp = client.get("/api/auth/me",
                      headers={"Authorization": f"Bearer {data['access_token']}"})
    assert resp.status_code == 200
    assert resp.json()["email"] == "dept@maharashtra.gov.in"
    assert resp.json()["role"] == "DEPT_OWNER"


def test_token_claims_portal_a():
    data = _register("STARTUP", "claim@acme.in")
    claims = pyjwt.decode(data["access_token"], options={"verify_signature": False})
    assert claims["portal"] == "A"
    assert claims["role"] == "STARTUP"


def test_token_claims_portal_b():
    data = _register("FINANCE", "fin@maharashtra.gov.in")
    claims = pyjwt.decode(data["access_token"], options={"verify_signature": False})
    assert claims["portal"] == "B"
