from typing import Dict, Any
from ml.inference.predictor import predictor_service
from backend.services.risk_engine_service import calculate_risk_score
from backend.services.reason_engine_service import generate_structured_reasons
from backend.services.retention_engine_service import generate_retention_recommendations


def run_full_customer_analysis(customer_data: dict, app_type: str = None) -> Dict[str, Any]:
    """
    Orchestrates full intelligence flow:
    Customer Data -> ML Churn Prediction -> Risk Score -> Risk Level -> Churn Reasons -> Retention Recommendations
    """
    app_type = app_type or customer_data.get("app_type", "Food Delivery App")
    
    # 1. ML Churn Prediction
    ml_res = predictor_service.predict_single(customer_data)
    churn_probability = ml_res["churn_probability"]
    model_version = ml_res["model_version"]

    # 2. Risk Score & Risk Level (Business Rules)
    risk_res = calculate_risk_score(customer_data, app_type=app_type)
    risk_score = risk_res["risk_score"]
    risk_level = risk_res["risk_level"]

    # 3. Structured Churn Reasons
    reasons = generate_structured_reasons(customer_data, app_type=app_type)

    # 4. Actionable Retention Recommendations
    recommendations = generate_retention_recommendations(customer_data, app_type=app_type)

    # 5. ML Feature Explanation
    ml_explanation = (
        f"Logistic Regression model computed a {churn_probability * 100:.1f}% churn probability based on "
        f"orders/logins ({customer_data.get('login_days', 0)} days), complaints ({customer_data.get('support_tickets', 0)} tickets), "
        f"and subscription tier ({customer_data.get('subscription_type', 'Free')})."
    )

    return {
        "churn_probability": churn_probability,
        "risk_score": risk_score,
        "risk_level": risk_level,
        "model_version": model_version,
        "reasons": reasons,
        "recommendations": recommendations,
        "ml_explanation": ml_explanation
    }
