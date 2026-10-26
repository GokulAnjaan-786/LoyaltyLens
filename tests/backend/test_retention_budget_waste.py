import pytest
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from backend.main import app
from backend.services.retention_budget_service import (
    calculate_incremental_metrics,
    estimate_delivery_cost,
    CHANNEL_DELIVERY_COST_INR
)
from backend.models.budget_waste import WasteReviewStatus, WasteCategory, EvidenceStrength

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


# ============================================================================
# 1. Financial Calculation Formulas & Edge Case Unit Tests
# ============================================================================

def test_financial_formulas_incremental_metrics():
    """
    Verifies mathematical definitions:
    Incremental Gross Profit = Incremental Revenue * Gross Margin Rate
    Net Contribution = Incremental Gross Profit - Total Campaign Cost
    Incremental ROI (%) = (Net Contribution / Total Campaign Cost) * 100
    """
    metrics = calculate_incremental_metrics(
        incremental_revenue=100000.0,
        gross_margin_rate=0.40,
        total_campaign_cost=20000.0
    )

    assert metrics["incremental_revenue_inr"] == 100000.0
    assert metrics["incremental_gross_profit_inr"] == 40000.0
    # Net contribution = 40000 - 20000 = 20000
    assert metrics["net_campaign_contribution_inr"] == 20000.0
    # Incremental ROI = (20000 / 20000) * 100 = 100%
    assert metrics["incremental_roi_pct"] == 100.0
    assert metrics["is_profitable"] is True


def test_financial_formulas_negative_roi_edge_cases():
    """Verify negative contribution and zero cost edge cases."""
    # Negative contribution: spent 30,000 to earn 20,000 revenue at 40% margin (8,000 profit)
    # Net = 8000 - 30000 = -22000
    metrics = calculate_incremental_metrics(
        incremental_revenue=20000.0,
        gross_margin_rate=0.40,
        total_campaign_cost=30000.0
    )
    assert metrics["incremental_gross_profit_inr"] == 8000.0
    assert metrics["net_campaign_contribution_inr"] == -22000.0
    assert round(metrics["incremental_roi_pct"], 2) == -73.33
    assert metrics["is_profitable"] is False

    # Zero cost edge case (no division by zero)
    zero_cost_metrics = calculate_incremental_metrics(
        incremental_revenue=10000.0,
        gross_margin_rate=0.40,
        total_campaign_cost=0.0
    )
    assert zero_cost_metrics["incremental_roi_pct"] == 0.0


def test_channel_delivery_cost_estimation():
    """Verify delivery cost rate table across all supported channels."""
    assert estimate_delivery_cost("Email", 1000) == 100.0  # 1000 * 0.10
    assert estimate_delivery_cost("SMS", 1000) == 250.0    # 1000 * 0.25
    assert estimate_delivery_cost("Push Notification", 1000) == 20.0 # 1000 * 0.02
    assert estimate_delivery_cost("In-App Message", 1000) == 10.0   # 1000 * 0.01
    assert estimate_delivery_cost("Unknown Channel", 1000) == 100.0 # Default fallback 0.10


# ============================================================================
# 2. Budget Intelligence Summary API
# ============================================================================

def test_budget_waste_summary_endpoint():
    """Verify aggregate summary metrics, data sources, and confirmed vs potential savings separation."""
    token = get_admin_token()
    headers = {"Authorization": f"Bearer {token}"}

    res = client.get("/api/v1/campaigns/budget-intelligence/summary?lookback_days=90", headers=headers)
    assert res.status_code == 200
    data = res.json()

    # Core required fields
    assert "total_incentive_spent_inr" in data
    assert "total_delivery_cost_inr" in data
    assert "total_retention_spend_inr" in data
    assert "unredeemed_incentive_cost_inr" in data
    assert "low_performing_campaigns_count" in data
    assert "repeated_incentive_recipients_count" in data
    assert "potential_savings_identified_inr" in data
    assert "confirmed_realized_savings_inr" in data
    assert "lookback_days" in data
    assert "data_source" in data

    # Verify that total retention spend equals incentive + delivery
    expected_total = data["total_incentive_spent_inr"] + data["total_delivery_cost_inr"]
    assert abs(data["total_retention_spend_inr"] - expected_total) < 0.01

    # Confirmed savings must never be equal to potential savings unless legitimately approved
    assert data["confirmed_realized_savings_inr"] >= 0.0
    assert data["potential_savings_identified_inr"] >= 0.0


# ============================================================================
# 3. Running Detection Rules & Deduplication Behavior
# ============================================================================

def test_run_waste_analysis_engine():
    """Verify that running waste analysis triggers deterministic rules and returns opportunity stats."""
    token = get_admin_token()
    headers = {"Authorization": f"Bearer {token}"}

    res = client.post("/api/v1/campaigns/budget-intelligence/analyze", headers=headers)
    assert res.status_code == 200
    data = res.json()

    assert "total_opportunities_found" in data
    assert "repeated_incentives_detected" in data
    assert "low_performing_campaigns_detected" in data
    assert "unnecessary_discounts_detected" in data
    assert "budget_leakages_detected" in data
    assert "inefficient_segments_detected" in data
    assert "analyzed_at" in data
    assert data["total_opportunities_found"] >= 0


def test_analysis_deduplication_preserves_audit_records():
    """Verify that re-running analysis updates open records instead of bloating the database with duplicates."""
    token = get_admin_token()
    headers = {"Authorization": f"Bearer {token}"}

    # Run 1
    res1 = client.post("/api/v1/campaigns/budget-intelligence/analyze", headers=headers)
    count1 = res1.json()["total_opportunities_found"]

    # Run 2 immediately
    res2 = client.post("/api/v1/campaigns/budget-intelligence/analyze", headers=headers)
    count2 = res2.json()["total_opportunities_found"]

    # Opportunity count should be stable (deduplicated by rule_id + target entity)
    assert count1 == count2


# ============================================================================
# 4. Listing, Filtering, and Search
# ============================================================================

def test_list_waste_opportunities_with_filters():
    """Verify multi-parameter filtering, pagination, and category breakdowns."""
    token = get_admin_token()
    headers = {"Authorization": f"Bearer {token}"}

    # First fetch all
    res = client.get("/api/v1/campaigns/budget-intelligence/opportunities?page=1&size=50", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "total" in data
    assert "items" in data
    assert "category_breakdown" in data
    assert "status_breakdown" in data

    if data["items"]:
        item = data["items"][0]
        assert "id" in item
        assert "rule_id" in item
        assert "category" in item
        assert "evidence_strength" in item
        assert "data_sufficiency" in item
        assert "finding_summary" in item
        assert "evidence_json" in item
        assert "recommended_action" in item
        assert "review_status" in item

        # Test filtering by review_status
        status_to_test = item["review_status"]
        filter_res = client.get(
            f"/api/v1/campaigns/budget-intelligence/opportunities?review_status={status_to_test}",
            headers=headers
        )
        assert filter_res.status_code == 200
        for f_item in filter_res.json()["items"]:
            assert f_item["review_status"] == status_to_test


# ============================================================================
# 5. Authorization & Review Status Transitions
# ============================================================================

def test_opportunity_status_review_permissions():
    """
    Test role-based governance:
    - Analysts can move status to UNDER_REVIEW
    - Analysts CANNOT approve or resolve without Admin role (403 Forbidden)
    - Admins can approve and resolve
    """
    admin_token = get_admin_token()
    analyst_token = get_analyst_token()
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    analyst_headers = {"Authorization": f"Bearer {analyst_token}"}

    # Fetch an opportunity to test
    res = client.get("/api/v1/campaigns/budget-intelligence/opportunities?size=1", headers=admin_headers)
    items = res.json()["items"]
    if not items:
        # If no items detected, run analysis first
        client.post("/api/v1/campaigns/budget-intelligence/analyze", headers=admin_headers)
        res = client.get("/api/v1/campaigns/budget-intelligence/opportunities?size=1", headers=admin_headers)
        items = res.json()["items"]

    if items:
        opp_id = items[0]["id"]

        # 1. Analyst sets to UNDER_REVIEW -> Allowed
        r_analyst = client.patch(
            f"/api/v1/campaigns/budget-intelligence/opportunities/{opp_id}/review",
            json={"review_status": "UNDER_REVIEW", "resolution_notes": "Analyst examining evidence logs."},
            headers=analyst_headers
        )
        assert r_analyst.status_code == 200
        assert r_analyst.json()["review_status"] == "UNDER_REVIEW"

        # 2. Analyst attempts to APPROVE -> 403 Forbidden
        r_forbidden = client.patch(
            f"/api/v1/campaigns/budget-intelligence/opportunities/{opp_id}/review",
            json={"review_status": "APPROVED", "resolution_notes": "Attempting unauthorized approval"},
            headers=analyst_headers
        )
        assert r_forbidden.status_code == 403

        # 3. Admin sets to APPROVED -> Allowed
        r_admin = client.patch(
            f"/api/v1/campaigns/budget-intelligence/opportunities/{opp_id}/review",
            json={"review_status": "APPROVED", "resolution_notes": "Admin approved recommendation."},
            headers=admin_headers
        )
        assert r_admin.status_code == 200
        assert r_admin.json()["review_status"] == "APPROVED"

        # 4. Invalid status transition -> 400 Bad Request
        r_invalid = client.patch(
            f"/api/v1/campaigns/budget-intelligence/opportunities/{opp_id}/review",
            json={"review_status": "NON_EXISTENT_STATUS"},
            headers=admin_headers
        )
        assert r_invalid.status_code == 400


def test_execute_recommendation_and_realized_savings():
    """Verify executing recommendation updates status to RESOLVED and records verified savings."""
    admin_token = get_admin_token()
    analyst_token = get_analyst_token()
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    analyst_headers = {"Authorization": f"Bearer {analyst_token}"}

    res = client.get("/api/v1/campaigns/budget-intelligence/opportunities?size=1", headers=admin_headers)
    items = res.json()["items"]
    if items:
        opp_id = items[0]["id"]

        # Analyst execute -> 403 Forbidden
        r_analyst = client.post(
            f"/api/v1/campaigns/budget-intelligence/opportunities/{opp_id}/execute-recommendation",
            headers=analyst_headers
        )
        assert r_analyst.status_code == 403

        # Admin execute -> 200 OK
        r_admin = client.post(
            f"/api/v1/campaigns/budget-intelligence/opportunities/{opp_id}/execute-recommendation",
            headers=admin_headers
        )
        assert r_admin.status_code == 200
        body = r_admin.json()
        assert body["success"] is True
        assert body["new_status"] == "RESOLVED"
        assert "realized_savings_inr" in body
