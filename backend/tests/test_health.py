from fastapi.testclient import TestClient

from app.main import app


def test_health_ok():
    client = TestClient(app)
    resp = client.get("/api/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}


def test_validation_error_envelope():
    client = TestClient(app)
    resp = client.post("/api/auth/register", json={"email": "bad", "password": "x"})
    assert resp.status_code == 422
    assert resp.json()["code"] == "VALIDATION_ERROR"
