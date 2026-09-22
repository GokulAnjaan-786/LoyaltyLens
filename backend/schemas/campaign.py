from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel


class CampaignCreate(BaseModel):
    name: str
    description: Optional[str] = None
    target_segment: str = "ALL"
    target_risk_level: str = "HIGH" # HIGH, MEDIUM, LOW, ALL
    offer: str
    action_strength: str = "Medium" # Low, Medium, High


class CampaignSimulationRequest(BaseModel):
    target_segment: str = "ALL"
    target_risk_level: str = "HIGH"
    action: str = "Offer Discount"
    strength: str = "Medium" # Low, Medium, High
    app_type: str = "Food Delivery App"


class CampaignSimulationResponse(BaseModel):
    action: str
    strength: str
    total_customers: int
    current_high_risk: int
    simulated_high_risk: int
    estimated_saved_count: int
    current_avg_risk_score: float
    simulated_avg_risk_score: float
    risk_score_reduction_pct: float
    before_distribution: dict
    after_distribution: dict


class CampaignResponse(BaseModel):
    id: str
    organization_id: str
    name: str
    description: Optional[str] = None
    target_segment: str
    target_risk_level: str
    offer: str
    action_strength: str
    status: str
    target_customer_count: int
    expected_saved_count: int
    expected_risk_reduction_pct: float
    estimated_cost_inr: float
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True
