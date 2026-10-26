import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from backend.db.session import get_db
from backend.api.deps import get_current_user, require_role
from backend.models.user import User, UserRole
from backend.models.campaign import CampaignStatus, RecipientStatus
from backend.schemas.campaign import (
    CampaignCreate,
    CampaignUpdate,
    CampaignResponse,
    CampaignSimulationRequest,
    CampaignSimulationResponse,
    AudienceFilterRequest,
    AudiencePreviewResponse,
    AudienceCustomerPreview,
    OfferRecommendationRequest,
    RecommendedOfferItem,
    EconomicsSimulationRequest,
    EconomicsSimulationResponse,
    CampaignApprovalRequest,
    CampaignExecutionRequest,
    CampaignRecipientResponse
)
from backend.repositories.campaign_repo import campaign_repo
from backend.repositories.customer_repo import customer_repo
from backend.services.simulation_service import simulate_campaign_impact
from backend.services.campaign_service import campaign_service
from backend.services.retention_agent_service import retention_agent_service
from backend.services.messaging_provider import messaging_provider

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("", response_model=List[CampaignResponse], summary="List Organization Retention Campaigns")
def list_campaigns(
    status: Optional[str] = Query(None, description="Filter by status (DRAFT, ACTIVE, COMPLETED, etc.)"),
    search: Optional[str] = Query(None, description="Search by name, objective, or offer"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lists all retention campaigns for the current user's organization."""
    return campaign_repo.list_campaigns(
        db,
        organization_id=current_user.organization_id,
        status=status,
        search=search
    )


@router.post("", response_model=CampaignResponse, summary="Create New Retention Campaign")
def create_campaign(
    request: CampaignCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Creates a persistent retention campaign with validated parameters,
    audience criteria, offer limits, and budget validation.
    """
    campaign_dict = request.model_dump()
    campaign_dict["organization_id"] = current_user.organization_id

    # If audience filters are provided, calculate real matching customer count
    filters = request.audience_filters or {
        "target_risk_level": request.target_risk_level,
        "city": "ALL"
    }
    match_count, _, _ = campaign_service.filter_target_audience(
        db,
        organization_id=current_user.organization_id,
        filters=filters
    )
    campaign_dict["target_customer_count"] = match_count

    # If dates provided, validate end_date >= start_date
    if request.start_date and request.end_date:
        if request.end_date < request.start_date:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Campaign end date cannot be earlier than start date."
            )

    campaign = campaign_repo.create_campaign(db, campaign_dict)
    return campaign


@router.post("/audience-preview", response_model=AudiencePreviewResponse, summary="Target Audience Query & Customer Preview")
def preview_target_audience(
    request: AudienceFilterRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Intelligently queries the real customer base using risk score, churn risk level,
    city, orders, and inactivity filters. Returns actual count and customer preview.
    Never fabricates customer data.
    """
    filters_dict = request.model_dump()
    count, customers, analytics = campaign_service.filter_target_audience(
        db,
        organization_id=current_user.organization_id,
        filters=filters_dict
    )

    sample_preview = [
        AudienceCustomerPreview(
            id=c["id"],
            customer_code=c["customer_code"],
            city=c["city"],
            subscription_type=c["subscription_type"],
            orders_count=c["orders_count"],
            login_days=c["login_days"],
            last_purchase_days=c["last_purchase_days"],
            risk_score=c["risk_score"],
            risk_level=c["risk_level"],
            churn_probability=c["churn_probability"],
            app_type=c["app_type"]
        )
        for c in customers[:50]
    ]

    return AudiencePreviewResponse(
        total_candidates_examined=analytics["total_candidates_examined"],
        total_matching=count,
        excluded_fatigue_count=analytics["excluded_fatigue_count"],
        risk_distribution=analytics["risk_distribution"],
        city_breakdown=analytics["city_breakdown"],
        avg_risk_score=analytics["avg_risk_score"],
        sample_customers=sample_preview
    )


@router.post("/recommend-offers", response_model=List[RecommendedOfferItem], summary="Offer Recommendation Engine")
def recommend_offers(
    request: OfferRecommendationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Recommends retention offers using transparent business rules based on
    the specific churn reasons and telemetry of the targeted customer cohort.
    """
    filters = {"target_risk_level": request.target_risk_level, "city": request.city}
    _, sample, _ = campaign_service.filter_target_audience(
        db,
        organization_id=current_user.organization_id,
        filters=filters,
        app_type=request.app_type
    )

    offers = campaign_service.recommend_offers_for_audience(sample, app_type=request.app_type)
    return [RecommendedOfferItem(**o) for o in offers]


@router.post("/simulate-economics", response_model=EconomicsSimulationResponse, summary="Retention Campaign Simulator & ROI Calculator")
def simulate_economics(
    request: EconomicsSimulationRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Calculates campaign incentive cost, estimated revenue, break-even point,
    and projected ROI using documented, adjustable mathematical assumptions.
    """
    result = campaign_service.simulate_campaign_economics(
        target_customer_count=request.target_customer_count,
        per_customer_cost_inr=request.per_customer_cost_inr,
        assumed_response_rate_pct=request.assumed_response_rate_pct,
        avg_order_value_inr=request.avg_order_value_inr,
        gross_margin_pct=request.gross_margin_pct,
        repeat_purchase_factor=request.repeat_purchase_factor,
        total_budget_cap_inr=request.total_budget_cap_inr
    )
    return EconomicsSimulationResponse(**result)


@router.post("/agent/recommend", summary="Retention Intelligence Agent Analysis & Proposal")
def agent_recommend(
    focus_risk_level: str = Query("HIGH", description="Target risk level to focus on"),
    focus_city: Optional[str] = Query(None, description="Specific city or hotspot to focus on"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    AI-assisted workflow: Analyzes real customer segments and campaign history,
    generating an explainable recommendation, personalized message draft,
    and proposed campaign configuration ready for user review.
    """
    return retention_agent_service.generate_campaign_recommendation(
        db,
        organization_id=current_user.organization_id,
        focus_risk_level=focus_risk_level,
        focus_city=focus_city
    )


@router.get("/integrations/status", summary="Get Messaging Provider Integration Status")
def get_provider_status(
    current_user: User = Depends(get_current_user)
):
    """Returns messaging provider configuration status (without exposing secrets)."""
    return messaging_provider.get_provider_status()


# Retain legacy simulate endpoint for backward compatibility with existing tests
@router.post("/simulate", response_model=CampaignSimulationResponse, summary="Run Retention Campaign Simulation (Legacy)")
def simulate_campaign(
    request: CampaignSimulationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    customers = customer_repo.get_all_for_org(db, organization_id=current_user.organization_id, app_type=request.app_type)
    cust_dicts = [
        {
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
        for c in customers
    ]

    res = simulate_campaign_impact(
        customers=cust_dicts,
        app_type=request.app_type,
        action=request.action,
        strength=request.strength,
        target_risk_level=request.target_risk_level
    )
    return CampaignSimulationResponse(**res)


@router.get("/{id}", response_model=CampaignResponse, summary="Get Single Campaign Details")
def get_campaign(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    campaign = campaign_repo.get_by_id(db, campaign_id=id, organization_id=current_user.organization_id)
    if not campaign:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found")
    return campaign


@router.put("/{id}", response_model=CampaignResponse, summary="Update Campaign Configuration")
def update_campaign(
    id: str,
    request: CampaignUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    campaign = campaign_repo.get_by_id(db, campaign_id=id, organization_id=current_user.organization_id)
    if not campaign:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found")

    if campaign.status in [CampaignStatus.COMPLETED, CampaignStatus.RUNNING]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot edit campaign in '{campaign.status.value}' state."
        )

    updated = campaign_repo.update_campaign(
        db,
        campaign_id=id,
        organization_id=current_user.organization_id,
        update_data=request.model_dump(exclude_unset=True)
    )
    return updated


@router.delete("/{id}", summary="Delete Campaign")
def delete_campaign(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        deleted = campaign_repo.delete_campaign(db, campaign_id=id, organization_id=current_user.organization_id)
        if not deleted:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found")
        return {"success": True, "message": "Campaign deleted successfully"}
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/{id}/request-approval", response_model=CampaignResponse, summary="Submit Campaign for Governance Approval")
def request_approval(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    campaign = campaign_repo.get_by_id(db, campaign_id=id, organization_id=current_user.organization_id)
    if not campaign:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found")

    if campaign.status not in [CampaignStatus.DRAFT, CampaignStatus.SIMULATED]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Campaign is already in '{campaign.status.value}' status."
        )

    updated = campaign_repo.update_status(db, id, current_user.organization_id, CampaignStatus.PENDING_APPROVAL)
    return updated


@router.post("/{id}/approve", response_model=CampaignResponse, summary="Approve or Reject Campaign (Admin Only)")
def approve_campaign(
    id: str,
    request: CampaignApprovalRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Enforces Role-Based Governance: Requires Admin or Super Admin role
    to approve campaign for dispatch.
    """
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Campaign approval requires Administrator privileges."
        )

    campaign = campaign_repo.get_by_id(db, campaign_id=id, organization_id=current_user.organization_id)
    if not campaign:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found")

    is_approved = (request.decision.upper() == "APPROVE")
    updated = campaign_repo.record_approval(
        db,
        campaign_id=id,
        organization_id=current_user.organization_id,
        approved_by=current_user.email,
        notes=request.notes,
        is_approved=is_approved
    )
    return updated


@router.post("/{id}/execute", summary="Execute Campaign with Idempotency & Governance")
def execute_campaign(
    id: str,
    request: Optional[CampaignExecutionRequest] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Executes approved campaign with strict idempotency:
    - Verifies campaign is approved
    - Splits audience into Treatment and Holdout Control Group
    - Dispatches messages via configured provider (or safe dry-run sandbox)
    - Records individual recipient outcomes and execution summary
    """
    dry_run = request.is_dry_run if request else None
    try:
        summary = campaign_service.execute_campaign(
            db=db,
            campaign_id=id,
            organization_id=current_user.organization_id,
            user_name=current_user.full_name or current_user.email,
            is_dry_run_override=dry_run
        )
        return {
            "success": True,
            "message": "Campaign executed successfully.",
            "execution_summary": summary
        }
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/{id}/pause", response_model=CampaignResponse, summary="Pause Running Campaign")
def pause_campaign(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    campaign = campaign_repo.get_by_id(db, campaign_id=id, organization_id=current_user.organization_id)
    if not campaign:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found")

    if campaign.status not in [CampaignStatus.RUNNING, CampaignStatus.SCHEDULED, CampaignStatus.ACTIVE]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot pause campaign in '{campaign.status.value}' state."
        )

    return campaign_repo.update_status(db, id, current_user.organization_id, CampaignStatus.PAUSED)


@router.post("/{id}/resume", response_model=CampaignResponse, summary="Resume Paused Campaign")
def resume_campaign(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    campaign = campaign_repo.get_by_id(db, campaign_id=id, organization_id=current_user.organization_id)
    if not campaign:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found")

    if campaign.status != CampaignStatus.PAUSED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only paused campaigns can be resumed."
        )

    return campaign_repo.update_status(db, id, current_user.organization_id, CampaignStatus.RUNNING)


@router.post("/{id}/cancel", response_model=CampaignResponse, summary="Cancel Campaign")
def cancel_campaign(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    campaign = campaign_repo.get_by_id(db, campaign_id=id, organization_id=current_user.organization_id)
    if not campaign:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found")

    return campaign_repo.update_status(db, id, current_user.organization_id, CampaignStatus.CANCELLED)


@router.get("/{id}/recipients", summary="List Campaign Recipients")
def get_campaign_recipients(
    id: str,
    status: Optional[str] = Query(None, description="Filter by status (DELIVERED, CONTROL_GROUP, FAILED)"),
    search: Optional[str] = Query(None, description="Search by customer code or email"),
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    campaign = campaign_repo.get_by_id(db, campaign_id=id, organization_id=current_user.organization_id)
    if not campaign:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found")

    total, items = campaign_repo.get_recipients(
        db,
        campaign_id=id,
        status=status,
        search=search,
        page=page,
        size=size
    )

    return {
        "total": total,
        "page": page,
        "size": size,
        "items": [CampaignRecipientResponse.model_validate(r) for r in items]
    }


@router.get("/{id}/performance", summary="Campaign Performance Tracking & Incrementality Lift")
def get_campaign_performance(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Computes real-time performance tracking metrics, distinguishes unavailable metrics,
    and measures retention lift against holdout control groups.
    """
    try:
        return campaign_service.get_campaign_performance(
            db,
            campaign_id=id,
            organization_id=current_user.organization_id
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.post("/{id}/record-interaction", summary="Record/Simulate Recipient Interaction (Testing & Calibration)")
def record_interaction(
    id: str,
    customer_code: Optional[str] = Query(None, description="Specific customer code or None for random delivered"),
    event_type: str = Query("REDEEM", description="OPEN or REDEEM"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Simulates or records an open/redemption event to calibrate tracking pipelines
    and verify incremental lift metrics.
    """
    try:
        return campaign_service.record_recipient_interaction(
            db,
            campaign_id=id,
            organization_id=current_user.organization_id,
            customer_code=customer_code,
            event_type=event_type
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
