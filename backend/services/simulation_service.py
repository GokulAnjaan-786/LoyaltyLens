from typing import List, Dict, Any
from backend.services.risk_engine_service import calculate_risk_score
from backend.core.config import settings


def get_available_retention_actions(app_type: str = "Food Delivery App") -> List[str]:
    """Returns supported retention actions per industry."""
    if "Food" in app_type:
        return [
            "Offer Discount",
            "Free Delivery",
            "Faster Delivery Promise",
            "Priority Customer Support"
        ]
    elif "Shopping" in app_type:
        return [
            "Coupon Offer",
            "Price Drop Alert",
            "Cashback Offer",
            "Free Returns"
        ]
    elif "Learning" in app_type:
        return [
            "Mentor Follow-up",
            "Free Extra Classes",
            "Reminder Notifications",
            "Subscription Extension"
        ]
    return ["Offer Discount", "Priority Customer Support"]


def simulate_campaign_impact(customers: List[dict], app_type: str, action: str, strength: str, target_risk_level: str = "HIGH") -> Dict[str, Any]:
    """
    Simulates retention campaign impact on a cohort of customers.
    Returns simulated risk score, expected saved users, and distribution comparison.
    """
    if not customers:
        return {
            "action": action,
            "strength": strength,
            "total_customers": 0,
            "current_high_risk": 0,
            "simulated_high_risk": 0,
            "estimated_saved_count": 0,
            "current_avg_risk_score": 0.0,
            "simulated_avg_risk_score": 0.0,
            "risk_score_reduction_pct": 0.0,
            "before_distribution": {"HIGH": 0, "MEDIUM": 0, "LOW": 0},
            "after_distribution": {"HIGH": 0, "MEDIUM": 0, "LOW": 0}
        }

    # Determine reduction percentage based on action strength
    reduction_pct = 0.15 # Default Medium
    if strength == "Low":
        reduction_pct = 0.10
    elif strength == "Medium":
        reduction_pct = 0.20
    elif strength == "High":
        reduction_pct = 0.30

    before_scores = []
    after_scores = []

    before_dist = {"HIGH": 0, "MEDIUM": 0, "LOW": 0}
    after_dist = {"HIGH": 0, "MEDIUM": 0, "LOW": 0}

    for c in customers:
        current_res = calculate_risk_score(c, app_type)
        c_score = current_res["risk_score"]
        c_level = current_res["risk_level"]

        before_scores.append(c_score)
        before_dist[c_level] += 1

        # Apply simulation reduction if user meets targeting filter
        should_target = (target_risk_level == "ALL" or c_level == target_risk_level or (target_risk_level == "HIGH" and c_level in ["HIGH", "MEDIUM"]))

        if should_target and c_level in ["HIGH", "MEDIUM"]:
            sim_score = int(c_score * (1.0 - reduction_pct))
        else:
            sim_score = c_score

        if sim_score <= settings.LOW_RISK_MAX:
            sim_level = "LOW"
        elif sim_score <= settings.MEDIUM_RISK_MAX:
            sim_level = "MEDIUM"
        else:
            sim_level = "HIGH"

        after_scores.append(sim_score)
        after_dist[sim_level] += 1

    current_high_count = before_dist["HIGH"]
    simulated_high_count = after_dist["HIGH"]
    saved_count = max(0, current_high_count - simulated_high_count)

    avg_before = float(sum(before_scores) / len(before_scores)) if before_scores else 0.0
    avg_after = float(sum(after_scores) / len(after_scores)) if after_scores else 0.0
    overall_reduction = float(((avg_before - avg_after) / avg_before) * 100.0) if avg_before > 0 else 0.0

    return {
        "action": action,
        "strength": strength,
        "total_customers": len(customers),
        "current_high_risk": current_high_count,
        "simulated_high_risk": simulated_high_count,
        "estimated_saved_count": saved_count,
        "current_avg_risk_score": round(avg_before, 1),
        "simulated_avg_risk_score": round(avg_after, 1),
        "risk_score_reduction_pct": round(overall_reduction, 1),
        "before_distribution": before_dist,
        "after_distribution": after_dist
    }
