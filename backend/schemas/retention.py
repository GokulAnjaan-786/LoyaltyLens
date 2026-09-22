from typing import List, Optional
from pydantic import BaseModel


class RecommendationItem(BaseModel):
    factor: str
    severity: str
    problem: str
    recommendation: str
    action_type: str
    offer_details: str


class RetentionPlaybookResponse(BaseModel):
    app_type: str
    high_risk_actions: List[dict]
    medium_risk_actions: List[dict]
    low_risk_actions: List[dict]
