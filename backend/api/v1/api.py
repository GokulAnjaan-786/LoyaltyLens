from fastapi import APIRouter
from backend.api.v1.endpoints import auth, customers, predictions, analytics, retention, campaigns, ai_insights, admin

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(customers.router, prefix="/customers", tags=["Customers"])
api_router.include_router(predictions.router, prefix="/predictions", tags=["Predictions"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["Analytics"])
api_router.include_router(retention.router, prefix="/retention", tags=["Retention"])
api_router.include_router(campaigns.router, prefix="/campaigns", tags=["Campaigns"])
api_router.include_router(ai_insights.router, prefix="/ai", tags=["AI Insights"])
api_router.include_router(admin.router, prefix="/admin", tags=["Admin & Developer"])
