from backend.core.config import settings


def calculate_risk_score(customer_data: dict, app_type: str = None) -> dict:
    """
    Calculates rule-based business risk score (0-100) and risk level (LOW, MEDIUM, HIGH)
    using configurable threshold parameters.
    
    Preserves and refines the existing domain business logic.
    """
    app_type = app_type or customer_data.get("app_type", "Food Delivery App")
    score = 0
    factors = []
    
    # 1. FOOD DELIVERY APP
    if "Food" in app_type:
        login_days = customer_data.get("login_days", 0)
        orders_count = customer_data.get("orders_count", 0)
        avg_delay = customer_data.get("avg_delivery_delay_mins", 0)
        app_rating = customer_data.get("app_rating", 5.0)
        support_tickets = customer_data.get("support_tickets", 0)
        
        if login_days < settings.FOOD_LOW_LOGIN_DAYS:
            score += 25
            factors.append({
                "factor": "Low Activity Frequency",
                "severity": "HIGH",
                "value": login_days,
                "message": f"Customer logged in only {login_days} days (threshold < {settings.FOOD_LOW_LOGIN_DAYS})"
            })
            
        if orders_count < settings.FOOD_LOW_ORDERS_COUNT:
            score += 25
            factors.append({
                "factor": "Low Order Volume",
                "severity": "HIGH",
                "value": orders_count,
                "message": f"Customer placed only {orders_count} orders (threshold < {settings.FOOD_LOW_ORDERS_COUNT})"
            })
            
        if avg_delay > settings.FOOD_HIGH_DELIVERY_DELAY:
            score += 20
            factors.append({
                "factor": "Frequent Delivery Delays",
                "severity": "MEDIUM",
                "value": avg_delay,
                "message": f"Average delivery delay is {avg_delay} mins (threshold > {settings.FOOD_HIGH_DELIVERY_DELAY})"
            })
            
        if app_rating < settings.FOOD_LOW_APP_RATING:
            score += 20
            factors.append({
                "factor": "Poor Rating / Experience",
                "severity": "MEDIUM",
                "value": app_rating,
                "message": f"App rating given by user is {app_rating}⭐ (threshold < {settings.FOOD_LOW_APP_RATING})"
            })
            
        if support_tickets >= settings.FOOD_HIGH_SUPPORT_TICKETS:
            score += 10
            factors.append({
                "factor": "Unresolved Support Complaints",
                "severity": "LOW",
                "value": support_tickets,
                "message": f"Customer logged {support_tickets} complaints (threshold >= {settings.FOOD_HIGH_SUPPORT_TICKETS})"
            })

    # 2. SHOPPING / E-COMMERCE APP
    elif "Shopping" in app_type:
        last_purchase = customer_data.get("last_purchase_days", 0)
        orders_count = customer_data.get("orders_count", 0)
        cart_abandon = customer_data.get("cart_abandon_count", 0)
        returns = customer_data.get("return_count", 0)
        tickets = customer_data.get("support_tickets", 0)
        
        if last_purchase > settings.SHOPPING_LAST_PURCHASE_DAYS:
            score += 30
            factors.append({
                "factor": "Dormant Purchase Activity",
                "severity": "HIGH",
                "value": last_purchase,
                "message": f"No purchases in {last_purchase} days (threshold > {settings.SHOPPING_LAST_PURCHASE_DAYS})"
            })
            
        if orders_count < settings.SHOPPING_LOW_ORDERS:
            score += 20
            factors.append({
                "factor": "Low Order Frequency",
                "severity": "HIGH",
                "value": orders_count,
                "message": f"Total orders is only {orders_count} (threshold < {settings.SHOPPING_LOW_ORDERS})"
            })
            
        if cart_abandon > settings.SHOPPING_CART_ABANDON:
            score += 20
            factors.append({
                "factor": "High Cart Abandonment",
                "severity": "MEDIUM",
                "value": cart_abandon,
                "message": f"Cart abandoned {cart_abandon} times (threshold > {settings.SHOPPING_CART_ABANDON})"
            })
            
        if returns > settings.SHOPPING_HIGH_RETURNS:
            score += 20
            factors.append({
                "factor": "High Return Rate",
                "severity": "MEDIUM",
                "value": returns,
                "message": f"Customer returned items {returns} times (threshold > {settings.SHOPPING_HIGH_RETURNS})"
            })
            
        if tickets >= settings.SHOPPING_SUPPORT_TICKETS:
            score += 10
            factors.append({
                "factor": "Support Tickets",
                "severity": "LOW",
                "value": tickets,
                "message": f"Logged {tickets} support requests"
            })

    # 3. LEARNING / EDUCATION APP
    elif "Learning" in app_type:
        inactive_days = customer_data.get("last_active_days", 0)
        progress = customer_data.get("course_progress_percent", 0.0)
        session_time = customer_data.get("avg_session_time", 0.0)
        quizzes = customer_data.get("quiz_attempts", 0)
        tickets = customer_data.get("support_tickets", 0)
        
        if inactive_days > settings.LEARNING_LAST_ACTIVE_DAYS:
            score += 30
            factors.append({
                "factor": "Inactivity / Missed Sessions",
                "severity": "HIGH",
                "value": inactive_days,
                "message": f"Inactive for {inactive_days} days (threshold > {settings.LEARNING_LAST_ACTIVE_DAYS})"
            })
            
        if progress < settings.LEARNING_LOW_PROGRESS_PCT:
            score += 25
            factors.append({
                "factor": "Low Course Completion",
                "severity": "HIGH",
                "value": progress,
                "message": f"Course progress at {progress}% (threshold < {settings.LEARNING_LOW_PROGRESS_PCT}%)"
            })
            
        if session_time < settings.LEARNING_LOW_SESSION_TIME:
            score += 20
            factors.append({
                "factor": "Short Study Duration",
                "severity": "MEDIUM",
                "value": session_time,
                "message": f"Avg session time {session_time} mins (threshold < {settings.LEARNING_LOW_SESSION_TIME})"
            })
            
        if quizzes < settings.LEARNING_LOW_QUIZ_ATTEMPTS:
            score += 15
            factors.append({
                "factor": "Low Quiz Engagement",
                "severity": "LOW",
                "value": quizzes,
                "message": f"Only {quizzes} quiz attempts recorded"
            })
            
        if tickets >= settings.LEARNING_SUPPORT_TICKETS:
            score += 10
            factors.append({
                "factor": "Technical / Doubt Tickets",
                "severity": "LOW",
                "value": tickets,
                "message": f"Raised {tickets} support tickets"
            })

    # Cap score at 100
    risk_score = min(score, 100)
    
    # Classify Risk Level
    if risk_score <= settings.LOW_RISK_MAX:
        risk_level = "LOW"
    elif risk_score <= settings.MEDIUM_RISK_MAX:
        risk_level = "MEDIUM"
    else:
        risk_level = "HIGH"
        
    return {
        "risk_score": risk_score,
        "risk_level": risk_level,
        "factors": factors
    }
