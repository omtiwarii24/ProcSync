from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

GOVT_ROLES = ["DEPT_OWNER", "PILOT_MANAGER", "EVALUATOR",
              "PROCUREMENT_AUTHORITY", "FINANCE"]


def _tok(role, email):
    payload = {
        "email": email, "password": "Passw0rd!123",
        "full_name": "RBAC User", "role": role,
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
    return resp.json()["access_token"]


def test_probe_any_requires_auth():
    resp = client.get("/api/rbac-probe/any")
    assert resp.status_code == 401


def test_startup_blocked_from_portal_b():
    token = _tok("STARTUP", "rbac_s@acme.in")
    resp = client.get("/api/rbac-probe/govt",
                      headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 403
    assert resp.json()["code"] == "PERMISSION_DENIED"


def test_govt_roles_pass_portal_b():
    for role in GOVT_ROLES:
        token = _tok(role, f"rbac_{role.lower()}@gov.in")
        resp = client.get("/api/rbac-probe/govt",
                           headers={"Authorization": f"Bearer {token}"})
        assert resp.status_code == 200, f"{role} should access Portal B"


def test_role_restriction():
    token = _tok("FINANCE", "rbac_fin2@gov.in")
    resp = client.get("/api/rbac-probe/evaluator",
                      headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 403

    token = _tok("EVALUATOR", "rbac_eval@gov.in")
    resp = client.get("/api/rbac-probe/evaluator",
                      headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
