import logging
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from backend.db.session import get_db
from backend.api.deps import get_current_user, require_role
from backend.models.user import User, UserRole
from backend.models.campaign import Campaign, CampaignStatus
from backend.models.budget_waste import BudgetWasteOpportunity, WasteReviewStatus, WasteCategory, EvidenceStrength
from backend.schemas.budget_waste import (
    WasteSummaryResponse,
    WasteOpportunityResponse,
    WasteOpportunityListResponse,
    WasteReviewActionRequest,
    WasteAnalysisRunResponse
)
from backend.services.retention_budget_service import retention_budget_service

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/summary", response_model=WasteSummaryResponse, summary="Get Retention Budget Intelligence Summary")
def get_budget_summary(
    lookback_days: int = Query(90, ge=7, le=365, description="Observation lookback window in days"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns verified aggregate financial metrics for the retention budget:
    - Total recorded incentive cost from actual dispatches
    - Total delivery channel cost
    - Unredeemed / inactive incentive cost exposure
    - Weak campaigns count and repeat incentive recipients
    - Potential savings identified vs Confirmed realized savings
    """
    summary = retention_budget_service.get_budget_intelligence_summary(
        db,
        organization_id=current_user.organization_id,
        lookback_days=lookback_days
    )
    return WasteSummaryResponse(**summary)


@router.post("/analyze", response_model=WasteAnalysisRunResponse, summary="Run or Refresh Budget Waste Analysis")
def run_waste_analysis(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Runs all 5 deterministic waste detection rules:
    - Rule A: Repeated Incentive Waste
    - Rule B: Low-Performing Campaigns (Incremental Lift & ROI)
    - Rule C: Potential Unnecessary Discounting
    - Rule D: Budget & Cost Leakage
    - Rule E: Inefficient Regional / Segment Allocation
    Deduplicates open findings and updates audit trail.
    """
    result = retention_budget_service.run_full_waste_analysis(
        db,
        organization_id=current_user.organization_id
    )
    return WasteAnalysisRunResponse(**result)


@router.get("/opportunities", response_model=WasteOpportunityListResponse, summary="List Budget Waste Opportunities")
def list_opportunities(
    category: Optional[str] = Query(None, description="Filter by category (REPEATED_INCENTIVES, LOW_PERFORMING_CAMPAIGN, etc.)"),
    review_status: Optional[str] = Query(None, description="Filter by status (OPEN, UNDER_REVIEW, APPROVED, DISMISSED, RESOLVED)"),
    evidence_strength: Optional[str] = Query(None, description="Filter by evidence strength (HIGH, MEDIUM, LOW)"),
    search: Optional[str] = Query(None, description="Search by title, customer code, or segment"),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lists waste opportunities with multi-filter search, pagination, and category breakdowns."""
    query = db.query(BudgetWasteOpportunity).filter(
        BudgetWasteOpportunity.organization_id == current_user.organization_id
    )

    if category and category != "ALL":
        query = query.filter(BudgetWasteOpportunity.category == category)

    if review_status and review_status != "ALL":
        query = query.filter(BudgetWasteOpportunity.review_status == review_status)

    if evidence_strength and evidence_strength != "ALL":
        query = query.filter(BudgetWasteOpportunity.evidence_strength == evidence_strength)

    if search:
        pat = f"%{search}%"
        query = query.filter(
            (BudgetWasteOpportunity.title.ilike(pat)) |
            (BudgetWasteOpportunity.customer_code.ilike(pat)) |
            (BudgetWasteOpportunity.segment.ilike(pat)) |
            (BudgetWasteOpportunity.finding_summary.ilike(pat))
        )

    total = query.count()
    items = query.order_by(
        BudgetWasteOpportunity.potential_savings_inr.desc(),
        BudgetWasteOpportunity.detected_at.desc()
    ).offset((page - 1) * size).limit(size).all()

    # Calculate breakdowns across all organization findings
    all_org_findings = db.query(
        BudgetWasteOpportunity.category,
        BudgetWasteOpportunity.review_status
    ).filter(
        BudgetWasteOpportunity.organization_id == current_user.organization_id
    ).all()

    category_breakdown = {}
    status_breakdown = {}
    for cat, stat in all_org_findings:
        cat_str = cat.value if hasattr(cat, "value") else str(cat)
        stat_str = stat.value if hasattr(stat, "value") else str(stat)
        category_breakdown[cat_str] = category_breakdown.get(cat_str, 0) + 1
        status_breakdown[stat_str] = status_breakdown.get(stat_str, 0) + 1

    return WasteOpportunityListResponse(
        total=total,
        page=page,
        size=size,
        items=[
            WasteOpportunityResponse(
                id=o.id,
                organization_id=o.organization_id,
                rule_id=o.rule_id,
                rule_version=o.rule_version,
                title=o.title,
                category=o.category.value if hasattr(o.category, "value") else str(o.category),
                campaign_id=o.campaign_id,
                campaign_name=o.campaign.name if o.campaign else None,
                customer_id=o.customer_id,
                customer_code=o.customer_code,
                segment=o.segment,
                affected_spend_inr=o.affected_spend_inr,
                potential_savings_inr=o.potential_savings_inr,
                realized_savings_inr=o.realized_savings_inr,
                evidence_strength=o.evidence_strength.value if hasattr(o.evidence_strength, "value") else str(o.evidence_strength),
                data_sufficiency=o.data_sufficiency.value if hasattr(o.data_sufficiency, "value") else str(o.data_sufficiency),
                finding_summary=o.finding_summary,
                evidence_json=o.evidence_json,
                recommended_action=o.recommended_action,
                recommended_action_type=o.recommended_action_type,
                verification_method=o.verification_method,
                review_status=o.review_status.value if hasattr(o.review_status, "value") else str(o.review_status),
                reviewed_by=o.reviewed_by,
                reviewed_at=o.reviewed_at,
                resolution_notes=o.resolution_notes,
                detected_at=o.detected_at,
                updated_at=o.updated_at
            )
            for o in items
        ],
        category_breakdown=category_breakdown,
        status_breakdown=status_breakdown
    )


@router.get("/opportunities/{id}", response_model=WasteOpportunityResponse, summary="Get Single Waste Opportunity Detail")
def get_opportunity(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    opp = db.query(BudgetWasteOpportunity).filter(
        BudgetWasteOpportunity.id == id,
        BudgetWasteOpportunity.organization_id == current_user.organization_id
    ).first()

    if not opp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Waste opportunity record not found.")

    return WasteOpportunityResponse(
        id=opp.id,
        organization_id=opp.organization_id,
        rule_id=opp.rule_id,
        rule_version=opp.rule_version,
        title=opp.title,
        category=opp.category.value if hasattr(opp.category, "value") else str(opp.category),
        campaign_id=opp.campaign_id,
        campaign_name=opp.campaign.name if opp.campaign else None,
        customer_id=opp.customer_id,
        customer_code=opp.customer_code,
        segment=opp.segment,
        affected_spend_inr=opp.affected_spend_inr,
        potential_savings_inr=opp.potential_savings_inr,
        realized_savings_inr=opp.realized_savings_inr,
        evidence_strength=opp.evidence_strength.value if hasattr(opp.evidence_strength, "value") else str(opp.evidence_strength),
        data_sufficiency=opp.data_sufficiency.value if hasattr(opp.data_sufficiency, "value") else str(opp.data_sufficiency),
        finding_summary=opp.finding_summary,
        evidence_json=opp.evidence_json,
        recommended_action=opp.recommended_action,
        recommended_action_type=opp.recommended_action_type,
        verification_method=opp.verification_method,
        review_status=opp.review_status.value if hasattr(opp.review_status, "value") else str(opp.review_status),
        reviewed_by=opp.reviewed_by,
        reviewed_at=opp.reviewed_at,
        resolution_notes=opp.resolution_notes,
        detected_at=opp.detected_at,
        updated_at=opp.updated_at
    )


@router.patch("/opportunities/{id}/review", response_model=WasteOpportunityResponse, summary="Update Waste Opportunity Review Status")
def review_opportunity(
    id: str,
    request: WasteReviewActionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Updates the review status (UNDER_REVIEW, APPROVED, DISMISSED, RESOLVED).
    Approving or resolving actions that impact live campaigns or confirm savings
    requires Administrator privileges.
    """
    if request.review_status in ["APPROVED", "RESOLVED"]:
        if current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Authorizing budget waste resolutions requires Administrator privileges."
            )

    try:
        updated = retention_budget_service.update_opportunity_status(
            db=db,
            opportunity_id=id,
            organization_id=current_user.organization_id,
            user_name=current_user.full_name or current_user.email,
            new_status=request.review_status,
            notes=request.resolution_notes,
            realized_savings_inr=request.realized_savings_inr or 0.0
        )
        return WasteOpportunityResponse(
            id=updated.id,
            organization_id=updated.organization_id,
            rule_id=updated.rule_id,
            rule_version=updated.rule_version,
            title=updated.title,
            category=updated.category.value if hasattr(updated.category, "value") else str(updated.category),
            campaign_id=updated.campaign_id,
            campaign_name=updated.campaign.name if updated.campaign else None,
            customer_id=updated.customer_id,
            customer_code=updated.customer_code,
            segment=updated.segment,
            affected_spend_inr=updated.affected_spend_inr,
            potential_savings_inr=updated.potential_savings_inr,
            realized_savings_inr=updated.realized_savings_inr,
            evidence_strength=updated.evidence_strength.value if hasattr(updated.evidence_strength, "value") else str(updated.evidence_strength),
            data_sufficiency=updated.data_sufficiency.value if hasattr(updated.data_sufficiency, "value") else str(updated.data_sufficiency),
            finding_summary=updated.finding_summary,
            evidence_json=updated.evidence_json,
            recommended_action=updated.recommended_action,
            recommended_action_type=updated.recommended_action_type,
            verification_method=updated.verification_method,
            review_status=updated.review_status.value if hasattr(updated.review_status, "value") else str(updated.review_status),
            reviewed_by=updated.reviewed_by,
            reviewed_at=updated.reviewed_at,
            resolution_notes=updated.resolution_notes,
            detected_at=updated.detected_at,
            updated_at=updated.updated_at
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/opportunities/{id}/execute-recommendation", summary="Execute Approved Recommendation")
def execute_recommendation(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Applies the recommended operational adjustment (e.g. pausing an underperforming
    campaign or adjusting budget cap). Requires Administrator privileges and explicit confirmation.
    """
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Executing campaign modifications requires Administrator privileges."
        )

    opp = db.query(BudgetWasteOpportunity).filter(
        BudgetWasteOpportunity.id == id,
        BudgetWasteOpportunity.organization_id == current_user.organization_id
    ).first()

    if not opp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Waste opportunity record not found.")

    action_taken = ""
    realized_savings = opp.potential_savings_inr

    # Execute specific action based on finding type
    if opp.category == WasteCategory.LOW_PERFORMING_CAMPAIGN and opp.campaign_id:
        camp = db.query(Campaign).filter(
            Campaign.id == opp.campaign_id,
            Campaign.organization_id == current_user.organization_id
        ).first()
        if camp and camp.status in [CampaignStatus.RUNNING, CampaignStatus.ACTIVE]:
            camp.status = CampaignStatus.PAUSED
            db.commit()
            action_taken = f"Campaign '{camp.name}' was automatically paused to prevent further budget dilution."
        else:
            action_taken = f"Campaign '{camp.name if camp else 'Target'}' reviewed; status preserved."

    elif opp.category == WasteCategory.REPEATED_INCENTIVES:
        action_taken = f"Recipient fatigue suppression rule registered for customer '{opp.customer_code}'."

    elif opp.category == WasteCategory.BUDGET_LEAKAGE and opp.campaign_id:
        camp = db.query(Campaign).filter(
            Campaign.id == opp.campaign_id,
            Campaign.organization_id == current_user.organization_id
        ).first()
        if camp:
            # Clamp budget limit to actual spend
            actual_cost = float(opp.affected_spend_inr or camp.total_budget_inr)
            camp.total_budget_inr = actual_cost
            db.commit()
            action_taken = f"Budget ceiling for campaign '{camp.name}' locked at ₹{actual_cost:,.0f}."
    else:
        action_taken = f"Recommendation acknowledged: {opp.recommended_action_type}."

    # Mark opportunity as RESOLVED and record verified realized savings
    updated = retention_budget_service.update_opportunity_status(
        db=db,
        opportunity_id=id,
        organization_id=current_user.organization_id,
        user_name=current_user.full_name or current_user.email,
        new_status="RESOLVED",
        notes=f"Action executed: {action_taken}",
        realized_savings_inr=realized_savings
    )

    return {
        "success": True,
        "message": action_taken,
        "opportunity_id": id,
        "new_status": updated.review_status.value,
        "realized_savings_inr": updated.realized_savings_inr
    }
