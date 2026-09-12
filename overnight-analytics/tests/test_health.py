from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_health_head():
    """Uptime monitors default to HEAD requests; the route must accept both."""
    response = client.head("/health")
    assert response.status_code == 200
