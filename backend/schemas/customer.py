from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field


class CustomerBase(BaseModel):
    customer_code: str
    app_type: str = "Food Delivery App"
    subscription_type: str = "Free"
    city: str = "Mumbai"
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    industry_type: str = "Food Delivery"
    joining_date: Optional[datetime] = None
    
    login_days: int = 10
    hours_spent: float = 20.0
    support_tickets: int = 0
    
    orders_count: int = 5
    avg_delivery_delay_mins: int = 20
    app_rating: float = 4.2
    
    last_purchase_days: int = 10
    cart_abandon_count: int = 0
    return_count: int = 0
    
    last_active_days: int = 5
    course_progress_percent: float = 50.0
    avg_session_time: float = 30.0
    quiz_attempts: int = 2


class CustomerCreate(CustomerBase):
    pass


class CustomerResponse(CustomerBase):
    id: str
    organization_id: str
    created_at: datetime
    
    # Calculated / Associated ML properties
    churn_probability: Optional[float] = None
    risk_score: Optional[int] = None
    risk_level: Optional[str] = None
    reasons: Optional[List[dict]] = None
    recommendations: Optional[List[dict]] = None
    ai_explanation: Optional[str] = None

    class Config:
        from_attributes = True


class CustomerListResponse(BaseModel):
    total: int
    page: int
    size: int
    items: List[CustomerResponse]
