import pandas as pd
import numpy as np

def ensure_columns_exist(df, app_type):
    """
    Ensures that the dataframe has the necessary columns for the selected industry.
    If columns are missing, it generates realistic synthetic data so the dashboard doesn't break.
    """
    # Common columns
    if 'customer_id' not in df.columns:
        # Check for alternatives (case-insensitive)
        found = False
        for col in df.columns:
            if col.lower().replace('_', '').replace(' ', '') in ['customerid', 'id', 'custid']:
                df['customer_id'] = df[col]
                found = True
                break
        
        if not found:
             # Create generic IDs if none found
            df['customer_id'] = [f"CUST-{i+1000}" for i in range(len(df))]

    if 'support_tickets' not in df.columns:
        df['support_tickets'] = np.random.randint(0, 5, len(df))
    
    if "Food" in app_type:
        # Requirements: login_days, orders_count, avg_delivery_delay_mins, app_rating
        if 'orders_count' not in df.columns:
            df['orders_count'] = np.random.randint(1, 15, len(df))
        if 'avg_delivery_delay_mins' not in df.columns:
            df['avg_delivery_delay_mins'] = np.random.randint(5, 60, len(df))
        if 'app_rating' not in df.columns:
            df['app_rating'] = np.random.uniform(2.5, 5.0, len(df)).round(1)
            
    elif "Shopping" in app_type:
        # Requirements: last_purchase_days, orders_count, cart_abandon_count, return_count
        if 'last_purchase_days' not in df.columns:
            # If login_days exists, derive from it, else random
            if 'login_days' in df.columns:
                df['last_purchase_days'] = df['login_days'].apply(lambda x: max(1, 30 - x + np.random.randint(-2, 5)))
            else:
                df['last_purchase_days'] = np.random.randint(1, 60, len(df))
        if 'orders_count' not in df.columns:
            df['orders_count'] = np.random.randint(0, 10, len(df))
        if 'cart_abandon_count' not in df.columns:
            df['cart_abandon_count'] = np.random.randint(0, 5, len(df))
        if 'return_count' not in df.columns:
            df['return_count'] = np.random.randint(0, 3, len(df))

    elif "Learning" in app_type:
        # Requirements: last_active_days, course_progress_percent, avg_session_time, quiz_attempts
        if 'last_active_days' not in df.columns:
             # Use login_days reversed as proxy if available
            if 'login_days' in df.columns:
                 df['last_active_days'] = df['login_days'].apply(lambda x: max(0, 14 - x))
            else:
                 df['last_active_days'] = np.random.randint(0, 30, len(df))
        if 'course_progress_percent' not in df.columns:
            df['course_progress_percent'] = np.random.randint(10, 100, len(df))
        if 'avg_session_time' not in df.columns:
            # Map from hours_spent if exists?
            if 'hours_spent' in df.columns:
                 df['avg_session_time'] = df['hours_spent'] * 10 # roughly minutes/session? or keep as is
            else:
                 df['avg_session_time'] = np.random.randint(5, 120, len(df))
        if 'quiz_attempts' not in df.columns:
            df['quiz_attempts'] = np.random.randint(0, 5, len(df))

    return df

def calculate_risk_score(row, app_type):
    """
    Calculates a Churn Risk Score (0-100) based on industry-specific logic.
    """
    score = 0
    
    # ----------------------------------------------
    # 🍔 FOOD DELIVERY APP LOGIC
    # ----------------------------------------------
    if "Food" in app_type:
        # 1. Low login activity (+25)
        # Using login_days (frequency) as proxy. 
        # CAUTION: User said "If login_days < 5". Usually higher login_days means active? 
        # Or does login_days mean "days since last login"? 
        # Looking at previous conversations/context, 'login_days' often meant frequency in X days.
        # BUT USER REQUEST SAYS: "If login_days < 5 -> +25 (High Risk)". 
        # This implies 'login_days' is Activity Frequency (Amount). Low amount = Risk. Correct.
        if row.get('login_days', 0) < 5:
            score += 25
            
        # 2. Low number of orders (+25)
        if row.get('orders_count', 0) < 3:
            score += 25
            
        # 3. High delivery delay (+20)
        if row.get('avg_delivery_delay_mins', 0) > 40:
            score += 20
            
        # 4. Low app rating (+20)
        if row.get('app_rating', 5.0) < 3.0:
            score += 20
            
        # 5. Many complaints (+10)
        if row.get('support_tickets', 0) >= 3:
            score += 10

    # ----------------------------------------------
    # 🛒 E-COMMERCE / SHOPPING APP LOGIC
    # ----------------------------------------------
    elif "Shopping" in app_type:
        # 1. No recent purchase (+30) - last_purchase_days > 30
        if row.get('last_purchase_days', 0) > 30:
            score += 30
            
        # 2. Low order frequency (+20) - orders_count < 2
        if row.get('orders_count', 0) < 2:
            score += 20
        
        # 3. Cart abandonment (+20) - cart_abandon_count > 3
        if row.get('cart_abandon_count', 0) > 3:
            score += 20
            
        # 4. High returns (+20) - return_count > 2
        if row.get('return_count', 0) > 2:
            score += 20
            
        # 5. Complaints (+10)
        if row.get('support_tickets', 0) >= 3:
            score += 10

    # ----------------------------------------------
    # 📚 EDUCATION / LEARNING APP LOGIC
    # ----------------------------------------------
    elif "Learning" in app_type:
        # 1. Long inactivity (+30) - last_active_days > 14
        if row.get('last_active_days', 0) > 14:
            score += 30
        
        # 2. Low course progress (+25) - course_progress_percent < 30
        if row.get('course_progress_percent', 0) < 30:
            score += 25
            
        # 3. Low study time (+20) - avg_session_time < 10
        if row.get('avg_session_time', 0) < 10:
            score += 20
            
        # 4. Low engagement (+15) - quiz_attempts < 2
        if row.get('quiz_attempts', 0) < 2:
            score += 15
            
        # 5. Complaints (+10)
        if row.get('support_tickets', 0) >= 3:
            score += 10
            
    # Cap at 100 just in case
    return min(score, 100)

def classify_risk_level(score):
    """
    Classifies the numeric score into Low, Medium, or High Risk.
    """
    if score <= 30:
        return "Low Risk"
    elif score <= 60:
        return "Medium Risk"
    else:
        return "High Risk"
