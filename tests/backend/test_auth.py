import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)


def test_health_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_login_success():
    response = client.post("/api/v1/auth/login", json={
        "email": "admin@loyaltylens.com",
        "password": "admin"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "admin@loyaltylens.com"


def test_login_invalid_credentials():
    response = client.post("/api/v1/auth/login", json={
        "email": "admin@loyaltylens.com",
        "password": "wrongpassword"
    })
    assert response.status_code == 401
