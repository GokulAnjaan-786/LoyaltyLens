from typing import List, Dict, Any


def generate_structured_reasons(customer_data: dict, app_type: str = None) -> List[Dict[str, Any]]:
    """
    Analyzes customer engagement metrics and produces structured churn reasons.
    """
    app_type = app_type or customer_data.get("app_type", "Food Delivery App")
    reasons = []

    sub_type = str(customer_data.get("subscription_type", "Free")).lower()

    if "Food" in app_type:
        login_days = customer_data.get("login_days", 0)
        hours_spent = customer_data.get("hours_spent", 0.0)
        tickets = customer_data.get("support_tickets", 0)
        delay = customer_data.get("avg_delivery_delay_mins", 0)
        rating = customer_data.get("app_rating", 5.0)

        if login_days < 10:
            reasons.append({
                "factor": "Low Activity Frequency",
                "severity": "HIGH",
                "value": login_days,
                "message": f"No recent orders in the last {10 - login_days} days."
            })
        if hours_spent < 5:
            reasons.append({
                "factor": "Low Average Order Value",
                "severity": "MEDIUM",
                "value": hours_spent,
                "message": "Average order amount / time spent is below expected threshold."
            })
        if tickets > 3:
            reasons.append({
                "factor": "Frequent Delivery Complaints",
                "severity": "HIGH",
                "value": tickets,
                "message": f"Customer reported {tickets} delivery or food quality complaints."
            })
        if sub_type == "free":
            reasons.append({
                "factor": "Non-Subscriber Friction",
                "severity": "LOW",
                "value": sub_type,
                "message": "Not enrolled in Pro membership (subject to delivery fees)."
            })
        if delay > 40:
            reasons.append({
                "factor": "Chronic Delivery Delays",
                "severity": "HIGH",
                "value": delay,
                "message": f"Experienced average delivery delay of {delay} minutes."
            })

    elif "Shopping" in app_type:
        last_purchase = customer_data.get("last_purchase_days", 0)
        cart_abandon = customer_data.get("cart_abandon_count", 0)
        tickets = customer_data.get("support_tickets", 0)

        if last_purchase > 30:
            reasons.append({
                "factor": "Purchase Inactivity",
                "severity": "HIGH",
                "value": last_purchase,
                "message": f"No purchases made in {last_purchase} days."
            })
        if cart_abandon > 3:
            reasons.append({
                "factor": "Checkout Abandonment",
                "severity": "HIGH",
                "value": cart_abandon,
                "message": f"Abandoned cart {cart_abandon} times without completing purchase."
            })
        if tickets > 3:
            reasons.append({
                "factor": "Product / Return Issues",
                "severity": "HIGH",
                "value": tickets,
                "message": f"High rate of product return complaints ({tickets} tickets)."
            })
        if sub_type == "free":
            reasons.append({
                "factor": "No Loyalty Program",
                "severity": "LOW",
                "value": sub_type,
                "message": "Free tier user with no shipping perk benefits."
            })

    elif "Learning" in app_type:
        inactive = customer_data.get("last_active_days", 0)
        progress = customer_data.get("course_progress_percent", 0.0)
        tickets = customer_data.get("support_tickets", 0)

        if inactive > 14:
            reasons.append({
                "factor": "Course Abandonment",
                "severity": "HIGH",
                "value": inactive,
                "message": f"Absent from learning sessions for {inactive} days."
            })
        if progress < 30:
            reasons.append({
                "factor": "Stalled Course Progress",
                "severity": "HIGH",
                "value": progress,
                "message": f"Progress stuck at {progress}%."
            })
        if tickets > 3:
            reasons.append({
                "factor": "Doubt / Platform Issues",
                "severity": "MEDIUM",
                "value": tickets,
                "message": f"Raised {tickets} support/doubt tickets."
            })

    if not reasons:
        reasons.append({
            "factor": "General Market Competition",
            "severity": "LOW",
            "value": 0,
            "message": "Possible competitor offer or general decrease in engagement."
        })

    return reasons
