from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.db.session import get_db
from backend.api.deps import get_current_user
from backend.models.user import User
from backend.schemas.campaign import CampaignCreate, CampaignResponse, CampaignSimulationRequest, CampaignSimulationResponse
from backend.repositories.campaign_repo import campaign_repo
from backend.repositories.customer_repo import customer_repo
from backend.services.simulation_service import simulate_campaign_impact

router = APIRouter()


@router.get("", response_model=List[CampaignResponse], summary="List Organization Retention Campaigns")
def list_campaigns(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    campaigns = campaign_repo.list_campaigns(db, organization_id=current_user.organization_id)
    return campaigns


@router.post("", response_model=CampaignResponse, summary="Create New Retention Campaign")
def create_campaign(
    request: CampaignCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    campaign_dict = request.dict()
    campaign_dict["organization_id"] = current_user.organization_id
    campaign = campaign_repo.create_campaign(db, campaign_dict)
    return campaign


@router.post("/simulate", response_model=CampaignSimulationResponse, summary="Run Retention Campaign Simulation")
def simulate_campaign(
    request: CampaignSimulationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    customers = customer_repo.get_all_for_org(db, organization_id=current_user.organization_id, app_type=request.app_type)
    
    # Convert SQLAlchemy objects to dicts for simulator service
    cust_dicts = []
    for c in customers:
        cust_dicts.append({
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
        })

    res = simulate_campaign_impact(
        customers=cust_dicts,
        app_type=request.app_type,
        action=request.action,
        strength=request.strength,
        target_risk_level=request.target_risk_level
    )
    return CampaignSimulationResponse(**res)
