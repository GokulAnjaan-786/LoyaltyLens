import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.schemas.ai import WeeklyBriefResponse

client = TestClient(app)


def get_auth_token():
    res = client.post("/api/v1/auth/login", json={
        "email": "admin@loyaltylens.com",
        "password": "admin"
    })
    return res.json()["access_token"]


def test_weekly_brief_endpoint():
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/api/v1/ai/weekly-brief?app_type=Food+Delivery+App", headers=headers)
    assert response.status_code == 200
    data = response.json()

    assert "generated_at" in data
    assert "is_ai_generated" in data
    assert "ai_provider" in data
    assert "executive_summary" in data
    assert "top_problems" in data
    assert isinstance(data["top_problems"], list)

    # Both priority_customer_segments and priority_segments must exist and be lists
    assert "priority_customer_segments" in data
    assert "priority_segments" in data
    assert isinstance(data["priority_customer_segments"], list)
    assert isinstance(data["priority_segments"], list)
    assert len(data["priority_segments"]) > 0

    assert "recommended_actions" in data
    assert isinstance(data["recommended_actions"], list)
    assert "suggested_campaigns" in data
    assert isinstance(data["suggested_campaigns"], list)
    assert "weekly_snapshot" in data


def test_weekly_brief_schema_defaults():
    # Test that WeeklyBriefResponse can instantiate safely with missing fields
    brief = WeeklyBriefResponse(
        generated_at="Now",
        is_ai_generated=False,
        ai_provider="Fallback",
        executive_summary="Summary"
    )
    assert brief.priority_segments == []
    assert brief.priority_customer_segments == []
    assert brief.top_problems == []
    assert brief.recommended_actions == []
    assert brief.suggested_campaigns == []
    assert brief.weekly_snapshot == {}
