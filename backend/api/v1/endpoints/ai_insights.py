from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.db.session import get_db
from backend.api.deps import get_current_user
from backend.models.user import User
from backend.schemas.ai import WeeklyBriefResponse
from backend.repositories.analytics_repo import analytics_repo
from backend.services.gemini_service import gemini_service

router = APIRouter()


@router.get("/weekly-brief", response_model=WeeklyBriefResponse, summary="Get AI Weekly Action Briefing")
def get_weekly_brief(
    app_type: str = "Food Delivery App",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stats = analytics_repo.get_overview_stats(db, organization_id=current_user.organization_id, app_type=app_type)
    loc_stats = analytics_repo.get_location_analytics(db, organization_id=current_user.organization_id, app_type=app_type)
    
    analytics_summary = {
        "total_customers": stats["total_customers"],
        "high_risk_count": stats["high_risk_count"],
        "medium_risk_count": stats["medium_risk_count"],
        "low_risk_count": stats["low_risk_count"],
        "highest_churn_city": loc_stats["highest_churn_city"]
    }

    brief = gemini_service.generate_weekly_action_brief(analytics_summary, app_type=app_type)
    return WeeklyBriefResponse(**brief)
