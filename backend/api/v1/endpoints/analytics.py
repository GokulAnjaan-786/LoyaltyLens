from typing import Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.db.session import get_db
from backend.api.deps import get_current_user
from backend.models.user import User
from backend.schemas.analytics import AnalyticsOverviewResponse, RiskDistributionResponse, LocationAnalyticsResponse
from backend.repositories.analytics_repo import analytics_repo

router = APIRouter()


@router.get("/overview", response_model=AnalyticsOverviewResponse, summary="Get Overview KPIs & Key Industry Metrics")
def get_overview_analytics(
    app_type: str = "Food Delivery App",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stats = analytics_repo.get_overview_stats(db, organization_id=current_user.organization_id, app_type=app_type)
    return AnalyticsOverviewResponse(**stats)


@router.get("/risk-distribution", response_model=RiskDistributionResponse, summary="Get Risk Distribution Breakdown")
def get_risk_distribution(
    app_type: str = "Food Delivery App",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stats = analytics_repo.get_overview_stats(db, organization_id=current_user.organization_id, app_type=app_type)
    return RiskDistributionResponse(
        low_risk=stats["low_risk_count"],
        medium_risk=stats["medium_risk_count"],
        high_risk=stats["high_risk_count"]
    )


@router.get("/churn-by-location", response_model=LocationAnalyticsResponse, summary="Get Indian Cities Geo-Location Churn Analytics")
def get_churn_by_location(
    app_type: str = "Food Delivery App",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    loc_stats = analytics_repo.get_location_analytics(db, organization_id=current_user.organization_id, app_type=app_type)
    return LocationAnalyticsResponse(**loc_stats)
