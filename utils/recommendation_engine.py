def get_recommendation(row, app_type="Food App"):
    """
    Returns an actionable recommendation based on customer data and app type.
    """
    actions = []
    
    # 1. FOOD DELIVERY APP
    if "Food" in app_type:
        if row['login_days'] < 10:
            actions.append("Push Notification: 'We miss you! 50% OFF next order'")
        if row['hours_spent'] < 5:
            actions.append("Offer 'Free Delivery' on next 3 orders")
        if row['support_tickets'] > 3:
            actions.append("Send apology coupon & priority support contact")
        if str(row.get('subscription_type')).lower() == 'free':
            actions.append("Suggest 'Gold Membership' free trial")

    # 2. SHOPPING / E-COMMERCE APP
    elif "Shopping" in app_type:
        if row['login_days'] < 10:
            actions.append("Email: 'Items in your wishlist are on sale!'")
        if row['hours_spent'] < 5:
            actions.append("Send price drop alert for viewed items")
        if row['support_tickets'] > 3:
            actions.append("Offer hassle-free return on next purchase")
        if str(row.get('subscription_type')).lower() == 'free':
            actions.append("Offer 'Free Shipping' membership discount")

    # 3. LEARNING / EDUCATION APP
    elif "Learning" in app_type:
        if row['login_days'] < 10:
            actions.append("Mentor Follow-up: 'Schedule a catch-up call'")
        if row['hours_spent'] < 5:
            actions.append("Unlock 1 Premium Course for free (24h)")
        if row['support_tickets'] > 3:
            actions.append("Resolve tech issues & extend course validity")
        if str(row.get('subscription_type')).lower() == 'free':
            actions.append("Offer 'Scholarship' discount on Pro plan")
            
    # Default
    else:
        if row['login_days'] < 10:
            actions.append("Re-engagement campaign")
            
    if not actions:
        actions.append("Collect feedback survey")
        
    return "; ".join(actions)
