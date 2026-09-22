from typing import List, Dict, Any, Optional
from pydantic import BaseModel


class AnalyticsOverviewResponse(BaseModel):
    total_customers: int
    high_risk_count: int
    medium_risk_count: int
    low_risk_count: int
    avg_churn_probability: float
    avg_risk_score: float
    high_risk_percentage: float
    key_industry_metric_label: str
    key_industry_metric_value: str
    industry_metrics: List[Dict[str, Any]]


class RiskDistributionResponse(BaseModel):
    low_risk: int
    medium_risk: int
    high_risk: int


class ChurnTrendPoint(BaseModel):
    month: str
    churn_count: int
    total_count: int
    churn_rate_pct: float


class LocationAnalyticsItem(BaseModel):
    city: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    total_customers: int
    churn_count: int
    churn_percentage: float
    risk_level: str
    est_target_save: int
    est_cost_inr: float
    top_reasons: Dict[str, int]


class LocationAnalyticsResponse(BaseModel):
    highest_churn_city: str
    lowest_churn_city: str
    avg_regional_churn_pct: float
    total_opportunity_cost_inr: float
    total_opportunity_save_count: int
    locations: List[LocationAnalyticsItem]
