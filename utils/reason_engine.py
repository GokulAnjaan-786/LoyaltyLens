def get_churn_reason(row, app_type="Food App"):
    """
    Analyzes customer data and returns a human-readable reason for potential churn
    based on the specific app industry.
    """
    reasons = []
    
    # --- Common Data Points Mapping ---
    # login_days -> Activity Frequency (Orders, Visits, Logins)
    # hours_spent -> Engagement Volume (Avg Order Value, Time Spent, Study Time)
    # support_tickets -> Issues/Returns/Complaints/Doubts
    
    # 1. FOOD DELIVERY APP
    if "Food" in app_type:
        if row['login_days'] < 10:
            reasons.append("No orders in recent days")
        if row['hours_spent'] < 5:
            reasons.append("Low avg order value/frequency")
        if row['support_tickets'] > 3:
            reasons.append("Delivery issues or bad food quality complaints")
        if str(row.get('subscription_type')).lower() == 'free':
            reasons.append("No 'Pro' membership (High delivery fees)")

    # 2. SHOPPING / E-COMMERCE APP
    elif "Shopping" in app_type:
        if row['login_days'] < 10:
            reasons.append("No purchase activity (Dormant)")
        if row['hours_spent'] < 5:
            reasons.append("Cart abandonment (Browses but doesn't buy)")
        if row['support_tickets'] > 3:
            reasons.append("High return rate or product complaints")
        if str(row.get('subscription_type')).lower() == 'free':
            reasons.append("Not a Prime/Loyalty member")

    # 3. LEARNING / EDUCATION APP
    elif "Learning" in app_type:
        if row['login_days'] < 10:
            reasons.append("Long inactivity (Missed classes)")
        if row['hours_spent'] < 5:
            reasons.append("Low session time / No course progress")
        if row['support_tickets'] > 3:
            reasons.append("Technical issues affecting study")
        if str(row.get('subscription_type')).lower() == 'free':
            reasons.append("Limited access (Free tier reached)")
            
    # Default / Fallback
    else:
        if row['login_days'] < 10:
            reasons.append("Low engagement")
        if row['hours_spent'] < 5:
            reasons.append("Low usage")

    if not reasons:
        return "Competitor offer or general loss of interest"
    
    return "; ".join(reasons)
