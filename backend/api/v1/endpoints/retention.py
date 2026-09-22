from fastapi import APIRouter, Depends
from backend.api.deps import get_current_user
from backend.models.user import User
from backend.schemas.retention import RetentionPlaybookResponse

router = APIRouter()


@router.get("/recommendations", response_model=RetentionPlaybookResponse, summary="Get Structured Retention Playbook Action Cards")
def get_retention_playbook(
    app_type: str = "Food Delivery App",
    current_user: User = Depends(get_current_user)
):
    if "Food" in app_type:
        high = [{
            "title": "VIP Call + 50% Off Next Order",
            "action": "Personal Call + 50% Off Next Order",
            "reason": "Customer experiences chronic delivery delays & poor rating.",
            "description": "Customer experiences chronic delivery delays & poor rating.",
            "impact": "High probability of retaining ~30% of at-risk users.",
            "expected_impact": "~30% of high-risk users",
            "risk_level": "High Risk",
            "target_segment": "High Risk Cohort"
        }]
        med = [{
            "title": "Free Delivery Push Campaign",
            "action": "Push Notification: 'Free Delivery Today'",
            "reason": "Order frequency dropped below 3 orders/month.",
            "description": "Order frequency dropped below 3 orders/month.",
            "impact": "Encourages immediate repeat order.",
            "expected_impact": "~20% order frequency boost",
            "risk_level": "Medium Risk",
            "target_segment": "Medium Risk Cohort"
        }]
        low = [{
            "title": "Loyalty Gold Member Badge",
            "action": "Send 'Foodie of the Month' Gold Badge",
            "reason": "User is active and loyal.",
            "description": "User is active and loyal.",
            "impact": "Strengthens emotional connection & brand advocacy.",
            "expected_impact": "Brand advocacy & higher LTV",
            "risk_level": "Low Risk",
            "target_segment": "Loyal Users"
        }]
    elif "Shopping" in app_type:
        high = [{
            "title": "Flash Discount + Free Returns",
            "action": "Flash Sale Alert + Free Doorstep Returns",
            "reason": "Cart abandonment is > 3 items.",
            "description": "Cart abandonment is > 3 items.",
            "impact": "Eliminates purchase friction instantly.",
            "expected_impact": "~35% cart recovery rate",
            "risk_level": "High Risk",
            "target_segment": "High Risk Cohort"
        }]
        med = [{
            "title": "Low Stock Wishlist Email",
            "action": "Email: 'Wishlist items are low stock'",
            "reason": "Browses products without completing checkout.",
            "description": "Browses products without completing checkout.",
            "impact": "Creates purchase urgency.",
            "expected_impact": "~15% checkout conversion",
            "risk_level": "Medium Risk",
            "target_segment": "Medium Risk Cohort"
        }]
        low = [{
            "title": "Festive VIP Early Access",
            "action": "Early Access to Annual Festive Sale",
            "reason": "Consistent repeat buyer.",
            "description": "Consistent repeat buyer.",
            "impact": "Increases customer lifetime value (LTV).",
            "expected_impact": "Higher annual spend",
            "risk_level": "Low Risk",
            "target_segment": "Loyal Users"
        }]
    else:
        high = [{
            "title": "1-on-1 Mentor Outreach",
            "action": "Mentor Call + Free 1-Week Extension",
            "reason": "Course progress stuck < 20%.",
            "description": "Course progress stuck < 20%.",
            "impact": "Re-engages stuck learners.",
            "expected_impact": "~25% course completion boost",
            "risk_level": "High Risk",
            "target_segment": "High Risk Cohort"
        }]
        med = [{
            "title": "Gamified Habit Streak Badge",
            "action": "WhatsApp Reminder: 'You are 2 days away from a streak badge'",
            "reason": "Irregular attendance.",
            "description": "Irregular attendance.",
            "impact": "Gamification drives habit formation.",
            "expected_impact": "~40% login frequency boost",
            "risk_level": "Medium Risk",
            "target_segment": "Medium Risk Cohort"
        }]
        low = [{
            "title": "Shareable Certificate Reward",
            "action": "Certificate of Course Completion",
            "reason": "Completing modules on schedule.",
            "description": "Completing modules on schedule.",
            "impact": "Encourages social sharing & referrals.",
            "expected_impact": "Social referrals & repeat signups",
            "risk_level": "Low Risk",
            "target_segment": "Loyal Users"
        }]

    return RetentionPlaybookResponse(
        app_type=app_type,
        high_risk_actions=high,
        medium_risk_actions=med,
        low_risk_actions=low
    )
