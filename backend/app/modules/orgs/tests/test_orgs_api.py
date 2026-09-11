from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def _register_startup(email="founder@acme.in"):
    resp = client.post("/api/auth/register", json={
        "email": email, "password": "Passw0rd!123", "full_name": "Founder One",
        "role": "STARTUP", "startup": {"name": "Acme WaterTech"},
    })
    assert resp.status_code == 201, resp.text
    return resp.json()


def _register_dept_owner(email="owner@maharashtra.gov.in", code="WRD"):
    resp = client.post("/api/auth/register", json={
        "email": email, "password": "Passw0rd!123", "full_name": "Dept Owner",
        "role": "DEPT_OWNER",
        "department": {
            "name": "Water Resources Dept", "code": code,
            "connectivity_tier": "MEDIUM", "power_reliability": "INTERMITTENT",
            "it_maturity": "MEDIUM", "settlement_type": "RURAL",
            "terrain_type": "HILLY",
        },
    })
    assert resp.status_code == 201, resp.text
    return resp.json()


def _admin_token():
    from app.core.database import SessionLocal
    from app.core.security import hash_password
    from app.models.enums import UserRole
    from app.modules.auth.models import User
    s = SessionLocal()
    if s.query(User).filter_by(email="admin@gov.in").first() is None:
        s.add(User(email="admin@gov.in", password_hash=hash_password("Adm1nPass!23"),
                   role=UserRole.ADMIN, full_name="Admin"))
        s.commit()
    s.close()
    resp = client.post("/api/auth/login", json={
        "email": "admin@gov.in", "password": "Adm1nPass!23"})
    return resp.json()["access_token"]


def test_register_creates_department_and_links_user():
    _register_dept_owner()
    from app.core.database import SessionLocal
    from app.modules.orgs.models import Department
    s = SessionLocal()
    dept = s.query(Department).one()
    user = dept  # placeholder; real check below
    from app.modules.auth.models import User
    u = s.query(User).filter_by(email="owner@maharashtra.gov.in").one()
    assert u.department_id == dept.id
    s.close()


def test_departments_list_requires_auth():
    resp = client.get("/api/departments")
    assert resp.status_code == 401


def test_departments_visible_to_authenticated():
    _register_dept_owner()
    data = _register_startup("s@acme.in")
    resp = client.get("/api/departments",
                      headers={"Authorization": f"Bearer {data['access_token']}"})
    assert resp.status_code == 200
    body = resp.json()
    assert body["total"] == 1
    assert body["items"][0]["code"] == "WRD"
    assert body["items"][0]["connectivity_tier"] == "MEDIUM"


def test_department_context_visible():
    _register_dept_owner()
    data = _register_startup("s2@acme.in")
    resp = client.get("/api/departments/1",
                      headers={"Authorization": f"Bearer {data['access_token']}"})
    assert resp.status_code == 200
    assert resp.json()["terrain_type"] == "HILLY"


def test_startup_me_profile_and_update():
    data = _register_startup()
    token = data["access_token"]
    resp = client.get("/api/startups/me", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert resp.json()["name"] == "Acme WaterTech"
    resp = client.put("/api/startups/me", json={
        "dpiit_number": "DPIIT12345", "annual_turnover": 2500000.0,
        "prior_deployments": 3, "team_size": 12,
        "sectors": ["water", "iot"], "runway_months": 18,
        "description": "AI leak detection for pipelines",
    }, headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert resp.json()["annual_turnover"] == 2500000.0
    assert resp.json()["dpiit_number"] == "DPIIT12345"


def test_startup_me_requires_startup_role():
    data = _register_dept_owner()
    resp = client.get("/api/startups/me",
                      headers={"Authorization": f"Bearer {data['access_token']}"})
    assert resp.status_code == 403


def test_dept_owner_register_requires_department():
    resp = client.post("/api/auth/register", json={
        "email": "bad@maharashtra.gov.in", "password": "Passw0rd!123",
        "full_name": "No Dept", "role": "DEPT_OWNER",
    })
    assert resp.status_code == 400


def test_startup_register_requires_startup_name():
    resp = client.post("/api/auth/register", json={
        "email": "bad2@acme.in", "password": "Passw0rd!123",
        "full_name": "No Startup", "role": "STARTUP",
    })
    assert resp.status_code == 400


def test_admin_can_create_department():
    admin_token = _admin_token()
    resp = client.post("/api/departments", json={
        "name": "Public Health Dept", "code": "PHD",
        "connectivity_tier": "HIGH", "power_reliability": "STABLE",
        "it_maturity": "HIGH", "settlement_type": "URBAN",
        "terrain_type": "PLAIN",
    }, headers={"Authorization": f"Bearer {admin_token}"})
    assert resp.status_code == 201
    assert resp.json()["code"] == "PHD"
    resp = client.post("/api/departments", json={
        "name": "Another", "code": "PHD",
        "connectivity_tier": "HIGH", "power_reliability": "STABLE",
        "it_maturity": "HIGH", "settlement_type": "URBAN",
        "terrain_type": "PLAIN",
    }, headers={"Authorization": f"Bearer {admin_token}"})
    assert resp.status_code == 409


def test_admin_can_update_department_context():
    admin_token = _admin_token()
    _register_dept_owner(email="owner2@maharashtra.gov.in", code="WRD2")  # creates dept
    resp = client.get("/api/departments",
                      headers={"Authorization": f"Bearer {admin_token}"})
    wrd2 = [d for d in resp.json()["items"] if d["code"] == "WRD2"][0]
    resp = client.patch(f"/api/departments/{wrd2['id']}/context", json={
        "connectivity_tier": "LOW", "power_reliability": "UNRELIABLE",
    }, headers={"Authorization": f"Bearer {admin_token}"})
    assert resp.status_code == 200
    assert resp.json()["connectivity_tier"] == "LOW"
    assert resp.json()["power_reliability"] == "UNRELIABLE"
    assert resp.json()["terrain_type"] == "HILLY"  # unchanged field from WRD2 creation
