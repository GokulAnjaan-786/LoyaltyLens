from typing import Optional, List, Any
from pydantic import BaseModel


class PredictionRequest(BaseModel):
    customer_id: str


class PredictionResponse(BaseModel):
    customer_id: str
    churn_probability: float
    risk_score: int
    risk_level: str
    model_version: str
    reasons: List[dict]
    ml_explanation: Optional[str] = None
    ai_explanation: Optional[str] = None


class BatchPredictionRequest(BaseModel):
    app_type: Optional[str] = None
    customer_ids: Optional[List[str]] = None # If None, runs on all org customers


class BatchPredictionResponse(BaseModel):
    total_processed: int
    high_risk_count: int
    medium_risk_count: int
    low_risk_count: int
    predictions: List[PredictionResponse]
