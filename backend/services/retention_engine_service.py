from typing import List, Dict, Any


def generate_retention_recommendations(customer_data: dict, app_type: str = None) -> List[Dict[str, Any]]:
    """
    Generates tailored, actionable retention offers and playbooks based on user activity & industry.
    """
    app_type = app_type or customer_data.get("app_type", "Food Delivery App")
    recommendations = []

    sub_type = str(customer_data.get("subscription_type", "Free")).lower()

    if "Food" in app_type:
        login_days = customer_data.get("login_days", 0)
        hours_spent = customer_data.get("hours_spent", 0.0)
        tickets = customer_data.get("support_tickets", 0)

        if login_days < 10:
            recommendations.append({
                "problem": "Low recent order frequency",
                "recommended_action": "Trigger automated Push Notification: 'We miss you! 50% OFF your next meal'",
                "action_type": "DISCOUNT",
                "offer_details": "50% Discount (up to ₹150)"
            })
        if hours_spent < 5:
            recommendations.append({
                "problem": "Low average spend",
                "recommended_action": "Grant Free Delivery on next 3 consecutive orders",
                "action_type": "FREE_DELIVERY",
                "offer_details": "3x Free Delivery Coupons"
            })
        if tickets > 3:
            recommendations.append({
                "problem": "High complaint count / delivery issues",
                "recommended_action": "Send apology credit voucher and assign priority hotline support agent",
                "action_type": "SUPPORT",
                "offer_details": "₹100 Apology Credit + VIP Support Tag"
            })
        if sub_type == "free":
            recommendations.append({
                "problem": "High delivery fee friction on Free tier",
                "recommended_action": "Offer 1-month Free Trial of Pro Membership",
                "action_type": "MEMBERSHIP",
                "offer_details": "30-Day Gold/Pro Trial"
            })

    elif "Shopping" in app_type:
        last_purchase = customer_data.get("last_purchase_days", 0)
        cart_abandon = customer_data.get("cart_abandon_count", 0)
        tickets = customer_data.get("support_tickets", 0)

        if last_purchase > 30:
            recommendations.append({
                "problem": "Dormant buyer",
                "recommended_action": "Send email campaign: 'Wishlist items on sale with extra ₹200 off'",
                "action_type": "DISCOUNT",
                "offer_details": "₹200 Instant Coupon"
            })
        if cart_abandon > 3:
            recommendations.append({
                "problem": "High cart abandonment",
                "recommended_action": "Send instant price drop alert & free express shipping on abandoned cart",
                "action_type": "FREE_SHIPPING",
                "offer_details": "Free Express Shipping"
            })
        if tickets > 3:
            recommendations.append({
                "problem": "High return dissatisfaction",
                "recommended_action": "Offer zero-cost doorstep return pickup and instant wallet refund",
                "action_type": "FREE_RETURNS",
                "offer_details": "VIP Instant Refund Guarantee"
            })
        if sub_type == "free":
            recommendations.append({
                "problem": "Non-Prime member",
                "recommended_action": "Offer 50% discount on annual Prime membership",
                "action_type": "MEMBERSHIP",
                "offer_details": "50% OFF Prime Subscription"
            })

    elif "Learning" in app_type:
        inactive = customer_data.get("last_active_days", 0)
        progress = customer_data.get("course_progress_percent", 0.0)
        tickets = customer_data.get("support_tickets", 0)

        if inactive > 14:
            recommendations.append({
                "problem": "Inactive learner",
                "recommended_action": "Schedule 1-on-1 Mentor Outreach Call to help reset study plan",
                "action_type": "MENTOR_CALL",
                "offer_details": "Free 15-min Mentor Session"
            })
        if progress < 30:
            recommendations.append({
                "problem": "Stalled course progress",
                "recommended_action": "Unlock 24-hour free access to Premium Masterclass module",
                "action_type": "COURSE_UNLOCK",
                "offer_details": "24h Premium Module Unlock"
            })
        if tickets > 3:
            recommendations.append({
                "problem": "Unresolved technical doubts",
                "recommended_action": "Assign dedicated teaching assistant to resolve doubts & extend course validity by 30 days",
                "action_type": "EXTENSION",
                "offer_details": "30-Day Validity Extension"
            })

    if not recommendations:
        recommendations.append({
            "problem": "General retention nurturing",
            "recommended_action": "Include in monthly feedback survey & loyalty point double-reward campaign",
            "action_type": "SURVEY",
            "offer_details": "2x Loyalty Points on Next Activity"
        })

    return recommendations
