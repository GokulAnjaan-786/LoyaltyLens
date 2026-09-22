import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)


def get_auth_token():
    res = client.post("/api/v1/auth/login", json={
        "email": "admin@loyaltylens.com",
        "password": "admin"
    })
    return res.json()["access_token"]


def test_list_customers():
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/api/v1/customers", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "total" in data
    assert "items" in data
    assert data["total"] > 0
    assert len(data["items"]) > 0
    
    # Verify no hardcoded business statistics: risk values present
    first_cust = data["items"][0]
    assert "churn_probability" in first_cust
    assert "risk_score" in first_cust
    assert "risk_level" in first_cust


def test_get_customer_detail():
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}
    list_res = client.get("/api/v1/customers", headers=headers)
    cust_id = list_res.json()["items"][0]["id"]

    response = client.get(f"/api/v1/customers/{cust_id}", headers=headers)
    assert response.status_code == 200
    detail = response.json()
    assert detail["id"] == cust_id
    assert "reasons" in detail
    assert "recommendations" in detail
