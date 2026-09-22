from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.db.session import get_db
from backend.api.deps import get_current_user
from backend.models.user import User
from backend.schemas.prediction import PredictionRequest, PredictionResponse, BatchPredictionRequest, BatchPredictionResponse
from backend.repositories.customer_repo import customer_repo
from backend.services.prediction_service import run_full_customer_analysis

router = APIRouter()


@router.post("", response_model=PredictionResponse, summary="Run Single Customer Churn Prediction & Risk Score")
def predict_single(
    request: PredictionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    c = customer_repo.get_by_id(db, customer_id=request.customer_id, organization_id=current_user.organization_id)
    if not c:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")

    c_dict = {
        "login_days": c.login_days,
        "hours_spent": c.hours_spent,
        "support_tickets": c.support_tickets,
        "subscription_type": c.subscription_type,
        "orders_count": c.orders_count,
        "avg_delivery_delay_mins": c.avg_delivery_delay_mins,
        "app_rating": c.app_rating,
        "last_purchase_days": c.last_purchase_days,
        "cart_abandon_count": c.cart_abandon_count,
        "return_count": c.return_count,
        "last_active_days": c.last_active_days,
        "course_progress_percent": c.course_progress_percent,
        "avg_session_time": c.avg_session_time,
        "quiz_attempts": c.quiz_attempts,
        "customer_code": c.customer_code,
        "app_type": c.app_type
    }
    analysis = run_full_customer_analysis(c_dict, app_type=c.app_type)

    return PredictionResponse(
        customer_id=c.id,
        churn_probability=analysis["churn_probability"],
        risk_score=analysis["risk_score"],
        risk_level=analysis["risk_level"],
        model_version=analysis["model_version"],
        reasons=analysis["reasons"],
        ml_explanation=analysis["ml_explanation"]
    )


@router.post("/batch", response_model=BatchPredictionResponse, summary="Run Batch ML Predictions for Organization")
def predict_batch(
    request: BatchPredictionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    customers = customer_repo.get_all_for_org(db, organization_id=current_user.organization_id, app_type=request.app_type)

    high_cnt = 0
    med_cnt = 0
    low_cnt = 0
    predictions = []

    for c in customers:
        c_dict = {
            "login_days": c.login_days,
            "hours_spent": c.hours_spent,
            "support_tickets": c.support_tickets,
            "subscription_type": c.subscription_type,
            "orders_count": c.orders_count,
            "avg_delivery_delay_mins": c.avg_delivery_delay_mins,
            "app_rating": c.app_rating,
            "last_purchase_days": c.last_purchase_days,
            "cart_abandon_count": c.cart_abandon_count,
            "return_count": c.return_count,
            "last_active_days": c.last_active_days,
            "course_progress_percent": c.course_progress_percent,
            "avg_session_time": c.avg_session_time,
            "quiz_attempts": c.quiz_attempts,
            "customer_code": c.customer_code,
            "app_type": c.app_type
        }
        analysis = run_full_customer_analysis(c_dict, app_type=c.app_type)

        if analysis["risk_level"] == "HIGH":
            high_cnt += 1
        elif analysis["risk_level"] == "MEDIUM":
            med_cnt += 1
        else:
            low_cnt += 1

        predictions.append(PredictionResponse(
            customer_id=c.id,
            churn_probability=analysis["churn_probability"],
            risk_score=analysis["risk_score"],
            risk_level=analysis["risk_level"],
            model_version=analysis["model_version"],
            reasons=analysis["reasons"],
            ml_explanation=analysis["ml_explanation"]
        ))

    return BatchPredictionResponse(
        total_processed=len(customers),
        high_risk_count=high_cnt,
        medium_risk_count=med_cnt,
        low_risk_count=low_cnt,
        predictions=predictions
    )
