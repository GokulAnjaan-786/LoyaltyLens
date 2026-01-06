import pandas as pd
import numpy as np

def get_available_actions(app_type):
    """
    Returns the list of available retention actions based on Industry.
    """
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
    return []

def simulate_retention_campaign(df, app_type, action, strength):
    """
    Simulates the impact of a retention campaign.
    Returns a NEW dataframe with updated Risk Scores.
    Does NOT modify the original dataframe.
    """
    # Create a copy to ensure original data is safe logic
    # We mainly care about 'Churn Risk Score' and 'Risk Level'
    sim_df = df.copy()
    
    # Ensure Risk Score exists (it should, but safety first)
    if 'Churn Risk Score' not in sim_df.columns:
        return sim_df # Can't simulate without scores

    # Define Impact Multiplier based on Strength
    # Low = 1.0 (Base impact), Medium = 1.2x, High = 1.5x
    # Or we can just stick to the user's range directly. 
    # User said: "Discount -> Reduce by 10-20%". 
    # Let's map Strength (Low, Medium, High) to a specific % reduction within that range.
    
    # 0.0 to 1.0 reduction factor
    reduction_pct = 0.0
    
    # ----------------------------------------------
    # 🍔 FOOD DELIVERY LOGIC
    # ----------------------------------------------
    if "Food" in app_type:
        if action == "Offer Discount":
            # 10-20%
            if strength == "Low": reduction_pct = 0.10
            elif strength == "Medium": reduction_pct = 0.15
            else: reduction_pct = 0.20
            
        elif action == "Free Delivery":
            # 15-25%
            if strength == "Low": reduction_pct = 0.15
            elif strength == "Medium": reduction_pct = 0.20
            else: reduction_pct = 0.25
            
        elif action == "Faster Delivery Promise":
            # 20-30%
            if strength == "Low": reduction_pct = 0.20
            elif strength == "Medium": reduction_pct = 0.25
            else: reduction_pct = 0.30
            
        elif action == "Priority Customer Support":
            # 5-10%
            if strength == "Low": reduction_pct = 0.05
            elif strength == "Medium": reduction_pct = 0.07
            else: reduction_pct = 0.10

    # ----------------------------------------------
    # 🛒 E-COMMERCE LOGIC
    # ----------------------------------------------
    elif "Shopping" in app_type:
        if action == "Coupon Offer":
            # 15-25%
            if strength == "Low": reduction_pct = 0.15
            elif strength == "Medium": reduction_pct = 0.20
            else: reduction_pct = 0.25
            
        elif action == "Price Drop Alert":
            # 10-20%
            if strength == "Low": reduction_pct = 0.10
            elif strength == "Medium": reduction_pct = 0.15
            else: reduction_pct = 0.20
            
        elif action == "Cashback Offer":
            # 20-30%
            if strength == "Low": reduction_pct = 0.20
            elif strength == "Medium": reduction_pct = 0.25
            else: reduction_pct = 0.30
            
        elif action == "Free Returns":
            # 10-15%
            if strength == "Low": reduction_pct = 0.10
            elif strength == "Medium": reduction_pct = 0.12
            else: reduction_pct = 0.15

    # ----------------------------------------------
    # 📚 EDUCATION LOGIC
    # ----------------------------------------------
    elif "Learning" in app_type:
        if action == "Mentor Follow-up":
            # 20-30%
            if strength == "Low": reduction_pct = 0.20
            elif strength == "Medium": reduction_pct = 0.25
            else: reduction_pct = 0.30
            
        elif action == "Free Extra Classes":
            # 15-25%
            if strength == "Low": reduction_pct = 0.15
            elif strength == "Medium": reduction_pct = 0.20
            else: reduction_pct = 0.25
            
        elif action == "Reminder Notifications":
            # 10-15%
            if strength == "Low": reduction_pct = 0.10
            elif strength == "Medium": reduction_pct = 0.12
            else: reduction_pct = 0.15
            
        elif action == "Subscription Extension":
            # 5-10%
            if strength == "Low": reduction_pct = 0.05
            elif strength == "Medium": reduction_pct = 0.07
            else: reduction_pct = 0.10
            
    # Apply logic: Only affect High and Medium Risk
    # We reduce the score by the percentage calculated
    # New Score = Old Score * (1 - reduction_pct)
    
    def apply_reduction(row):
        current_score = row['Churn Risk Score']
        current_level = row['Risk Level']
        
        if current_level in ['High Risk', 'Medium Risk']:
            new_score = current_score * (1.0 - reduction_pct)
            return int(new_score)
        else:
            return current_score # No change for already safe users

    sim_df['Churn Risk Score'] = sim_df.apply(apply_reduction, axis=1)
    
    # Re-classify Risk Levels after simulation
    # We must import or redefine classify logic. 
    # To keep it simple and independent, let's redefine simple bounds here or import if passed.
    # We will redefine here to match app.py logic: <30 Low, <60 Med, >60 High
    def reclassify(score):
        if score <= 30: return "Low Risk"
        elif score <= 60: return "Medium Risk"
        else: return "High Risk"
        
    sim_df['Risk Level'] = sim_df['Churn Risk Score'].apply(reclassify)
    
    return sim_df
