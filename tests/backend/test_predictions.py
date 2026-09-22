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


def test_single_prediction():
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}
    list_res = client.get("/api/v1/customers", headers=headers)
    cust_id = list_res.json()["items"][0]["id"]

    response = client.post("/api/v1/predictions", json={"customer_id": cust_id}, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert 0.0 <= data["churn_probability"] <= 1.0
    assert 0 <= data["risk_score"] <= 100
    assert data["risk_level"] in ["LOW", "MEDIUM", "HIGH"]
    assert "reasons" in data


def test_campaign_simulation():
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    payload = {
        "target_segment": "ALL",
        "target_risk_level": "HIGH",
        "action": "Offer Discount",
        "strength": "High",
        "app_type": "Food Delivery App"
    }
    response = client.post("/api/v1/campaigns/simulate", json=payload, headers=headers)
    assert response.status_code == 200
    sim = response.json()
    assert sim["action"] == "Offer Discount"
    assert sim["estimated_saved_count"] >= 0
    assert "before_distribution" in sim
    assert "after_distribution" in sim
