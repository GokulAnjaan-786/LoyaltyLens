import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)


def get_admin_token():
    res = client.post("/api/v1/auth/login", json={
        "email": "admin@loyaltylens.com",
        "password": "admin"
    })
    return res.json()["access_token"]


def get_analyst_token():
    res = client.post("/api/v1/auth/login", json={
        "email": "analyst@loyaltylens.com",
        "password": "analyst123"
    })
    return res.json()["access_token"]


def test_audience_preview_intelligent_targeting():
    """Verify customer audience filtering by risk, city, and activity against real database."""
    token = get_admin_token()
    headers = {"Authorization": f"Bearer {token}"}

    # Query audience with High Risk filter
    payload = {
        "target_risk_level": "HIGH",
        "city": "ALL",
        "min_risk_score": 50,
        "max_risk_score": 100
    }
    res = client.post("/api/v1/campaigns/audience-preview", json=payload, headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "total_matching" in data
    assert "sample_customers" in data
    assert "risk_distribution" in data
    assert data["total_matching"] >= 0

    if data["sample_customers"]:
        first = data["sample_customers"][0]
        assert "customer_code" in first
        assert "risk_score" in first
        assert first["risk_score"] >= 50
        assert first["risk_level"] == "HIGH"


def test_offer_recommendation_engine():
    """Verify offer recommendation rules generate tailored offers and explanations."""
    token = get_admin_token()
    headers = {"Authorization": f"Bearer {token}"}

    payload = {
        "target_risk_level": "HIGH",
        "city": "ALL",
        "app_type": "Food Delivery App"
    }
    res = client.post("/api/v1/campaigns/recommend-offers", json=payload, headers=headers)
    assert res.status_code == 200
    offers = res.json()
    assert len(offers) > 0
    assert any(o["offer_type"] in ["DISCOUNT", "FREE_DELIVERY", "LOYALTY_POINTS", "CASHBACK"] for o in offers)
    
    first = offers[0]
    assert "rationale" in first
    assert "business_limits" in first
    assert "evidence_disclaimer" in first
    assert first["max_discount_cap_inr"] > 0


def test_retention_campaign_simulator_economics():
    """Verify retention campaign economics, ROI, and break-even calculations."""
    token = get_admin_token()
    headers = {"Authorization": f"Bearer {token}"}

    payload = {
        "target_customer_count": 100,
        "per_customer_cost_inr": 50.0,
        "assumed_response_rate_pct": 20.0,
        "avg_order_value_inr": 600.0,
        "gross_margin_pct": 40.0,
        "repeat_purchase_factor": 1.5,
        "total_budget_cap_inr": 5000.0
    }
    res = client.post("/api/v1/campaigns/simulate-economics", json=payload, headers=headers)
    assert res.status_code == 200
    sim = res.json()
    assert sim["is_simulation"] is True
    assert sim["target_customer_count"] == 100
    assert sim["total_potential_cost_inr"] == 5000.0 # 100 * 50
    assert sim["estimated_saved_count"] == 20 # 20% of 100
    # Revenue = 20 * 600 * 1.5 = 18,000
    assert sim["estimated_revenue_inr"] == 18000.0
    # Gross profit = 18,000 * 0.40 = 7,200
    assert sim["estimated_gross_profit_inr"] == 7200.0
    # Net benefit = 7,200 - 5,000 = 2,200 => ROI = 2,200 / 5,000 * 100 = 44.0%
    assert sim["estimated_roi_pct"] == 44.0
    assert sim["break_even_customers"] > 0
    assert len(sim["documented_assumptions"]) >= 4


def test_campaign_lifecycle_creation_approval_execution_and_tracking():
    """Verify end-to-end lifecycle: Draft -> Approval -> Execution -> Performance Tracking."""
    admin_token = get_admin_token()
    analyst_token = get_analyst_token()
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    analyst_headers = {"Authorization": f"Bearer {analyst_token}"}

    # 1. Analyst creates a draft campaign with validation
    create_payload = {
        "name": "Integration Test Automated Win-Back",
        "description": "Validation test for lifecycle and execution",
        "objective": "Prevent High-Risk Churn",
        "target_segment": "All High-Risk Accounts",
        "target_risk_level": "HIGH",
        "offer": "25% OFF Next Meal",
        "offer_type": "DISCOUNT",
        "discount_value": 25.0,
        "discount_unit": "%",
        "max_discount_cap_inr": 150.0,
        "total_budget_inr": 3500.0,
        "per_customer_cost_inr": 45.0,
        "control_group_pct": 20.0, # 20% holdout group
        "is_dry_run": True,
        "delivery_channel": "EMAIL",
        "audience_filters": {
            "target_risk_level": "HIGH",
            "city": "ALL",
            "exclude_fatigue_days": 0
        }
    }
    create_res = client.post("/api/v1/campaigns", json=create_payload, headers=analyst_headers)
    assert create_res.status_code == 200
    campaign = create_res.json()
    campaign_id = campaign["id"]
    assert campaign["name"] == create_payload["name"]
    assert campaign["status"] == "DRAFT"

    # 2. Cannot execute unapproved campaign directly
    exec_res = client.post(f"/api/v1/campaigns/{campaign_id}/execute", headers=analyst_headers)
    assert exec_res.status_code == 400
    assert "approval is required" in exec_res.json()["detail"].lower()

    # 3. Analyst submits campaign for approval
    req_app_res = client.post(f"/api/v1/campaigns/{campaign_id}/request-approval", headers=analyst_headers)
    assert req_app_res.status_code == 200
    assert req_app_res.json()["status"] == "PENDING_APPROVAL"

    # 4. Non-admin (Analyst) cannot approve campaign
    unauth_app = client.post(f"/api/v1/campaigns/{campaign_id}/approve", json={"decision": "APPROVE"}, headers=analyst_headers)
    assert unauth_app.status_code == 403

    # 5. Admin approves campaign
    admin_app = client.post(f"/api/v1/campaigns/{campaign_id}/approve", json={"decision": "APPROVE", "notes": "Approved for testing"}, headers=admin_headers)
    assert admin_app.status_code == 200
    assert admin_app.json()["status"] == "APPROVED"
    assert admin_app.json()["approved_by"] == "admin@loyaltylens.com"

    # 6. Execute campaign in safe dry-run mode
    exec_success = client.post(f"/api/v1/campaigns/{campaign_id}/execute", json={"is_dry_run": True}, headers=admin_headers)
    assert exec_success.status_code == 200
    exec_data = exec_success.json()
    assert exec_data["success"] is True
    summary = exec_data["execution_summary"]
    assert summary["is_dry_run"] is True
    assert summary["total_targeted"] > 0
    assert summary["control_group_count"] >= 0

    # 7. Idempotency Check: cannot re-execute already completed campaign
    exec_dup = client.post(f"/api/v1/campaigns/{campaign_id}/execute", headers=admin_headers)
    assert exec_dup.status_code == 400
    assert "already" in exec_dup.json()["detail"].lower()

    # 8. Query recipients list
    recip_res = client.get(f"/api/v1/campaigns/{campaign_id}/recipients", headers=admin_headers)
    assert recip_res.status_code == 200
    recip_data = recip_res.json()
    assert recip_data["total"] > 0
    recipients = recip_data["items"]
    assert len(recipients) > 0
    # Verify control group recipients exist
    has_control = any(r["is_control_group"] for r in recipients)
    has_delivered = any(r["status"] == "DELIVERED" for r in recipients)
    assert has_control or has_delivered

    # 9. Record/simulate an interaction (redeem) on a delivered recipient
    redeem_res = client.post(f"/api/v1/campaigns/{campaign_id}/record-interaction?event_type=REDEEM", headers=admin_headers)
    assert redeem_res.status_code == 200
    assert redeem_res.json()["event_type"] == "REDEEM"

    # 10. Performance tracking and incrementality lift
    perf_res = client.get(f"/api/v1/campaigns/{campaign_id}/performance", headers=admin_headers)
    assert perf_res.status_code == 200
    perf = perf_res.json()
    assert perf["total_targeted"] > 0
    assert "delivered_count" in perf
    assert "redeemed_count" in perf
    assert perf["redeemed_count"] >= 1
    assert "incremental_retention_lift_pct" in perf


def test_retention_intelligence_agent():
    """Verify retention intelligence agent generates data-driven strategy and proposal."""
    token = get_admin_token()
    headers = {"Authorization": f"Bearer {token}"}

    res = client.post("/api/v1/campaigns/agent/recommend?focus_risk_level=HIGH", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert "strategic_rationale" in data
    assert "proposed_campaign" in data
    prop = data["proposed_campaign"]
    assert "name" in prop
    assert "offer" in prop
    assert "total_budget_inr" in prop
    assert "message_body" in prop
    assert prop["total_budget_inr"] > 0
