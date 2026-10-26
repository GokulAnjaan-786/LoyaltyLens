from typing import Optional, List, Dict, Any, Union
from datetime import datetime
from pydantic import BaseModel, Field, field_validator, ConfigDict


class AudienceFilterRequest(BaseModel):
    target_risk_level: str = "HIGH" # HIGH, MEDIUM, LOW, ALL, HIGH_OR_MEDIUM
    city: Optional[Union[str, List[str]]] = "ALL"
    subscription_type: Optional[str] = "ALL"
    min_inactivity_days: Optional[int] = None
    max_inactivity_days: Optional[int] = None
    min_orders: Optional[int] = None
    max_orders: Optional[int] = None
    min_risk_score: Optional[int] = 0
    max_risk_score: Optional[int] = 100
    exclude_fatigue_days: Optional[int] = 7


class AudienceCustomerPreview(BaseModel):
    id: str
    customer_code: str
    city: str
    subscription_type: str
    orders_count: int
    login_days: int
    last_purchase_days: Optional[int] = None
    risk_score: int
    risk_level: str
    churn_probability: float
    app_type: str


class AudiencePreviewResponse(BaseModel):
    total_candidates_examined: int
    total_matching: int
    excluded_fatigue_count: int
    risk_distribution: Dict[str, int]
    city_breakdown: Dict[str, int]
    avg_risk_score: float
    sample_customers: List[AudienceCustomerPreview]


class OfferRecommendationRequest(BaseModel):
    target_risk_level: str = "HIGH"
    city: Optional[str] = "ALL"
    app_type: str = "Food Delivery App"


class RecommendedOfferItem(BaseModel):
    offer_name: str
    offer_type: str
    discount_value: float
    discount_unit: str
    max_discount_cap_inr: float
    estimated_per_customer_cost_inr: float
    recommended_channel: str
    rationale: str
    business_limits: str
    evidence_disclaimer: str


class EconomicsSimulationRequest(BaseModel):
    target_customer_count: int = Field(default=50, ge=0)
    per_customer_cost_inr: float = Field(default=45.0, ge=0.0)
    assumed_response_rate_pct: float = Field(default=15.0, ge=1.0, le=100.0)
    avg_order_value_inr: float = Field(default=500.0, ge=10.0)
    gross_margin_pct: float = Field(default=40.0, ge=1.0, le=100.0)
    repeat_purchase_factor: float = Field(default=1.4, ge=1.0, le=5.0)
    total_budget_cap_inr: Optional[float] = None


class EconomicsSimulationResponse(BaseModel):
    simulation_label: str
    is_simulation: bool
    target_customer_count: int
    per_customer_cost_inr: float
    total_potential_cost_inr: float
    effective_budget_inr: float
    assumed_response_rate_pct: float
    estimated_saved_count: int
    avg_order_value_inr: float
    gross_margin_pct: float
    repeat_purchase_factor: float
    estimated_revenue_inr: float
    estimated_gross_profit_inr: float
    break_even_customers: int
    break_even_response_rate_pct: float
    estimated_roi_pct: float
    risk_mitigation_summary: str
    documented_assumptions: List[str]


class CampaignCreate(BaseModel):
    name: str = Field(..., min_length=3, max_length=255)
    description: Optional[str] = None
    objective: str = Field(default="Prevent High-Risk Churn", max_length=150)
    target_segment: str = Field(default="All High-Risk Accounts", max_length=100)
    target_risk_level: str = Field(default="HIGH")
    offer: str = Field(..., min_length=2, max_length=255)
    offer_type: str = Field(default="DISCOUNT")
    discount_value: float = Field(default=20.0, ge=0.0)
    discount_unit: str = Field(default="%")
    max_discount_cap_inr: float = Field(default=150.0, ge=0.0)
    total_budget_inr: float = Field(default=5000.0, gt=0.0)
    per_customer_cost_inr: float = Field(default=50.0, ge=0.0)
    action_strength: str = Field(default="Medium")
    audience_filters: Optional[Dict[str, Any]] = None
    control_group_pct: float = Field(default=10.0, ge=0.0, le=50.0)
    is_dry_run: bool = True
    delivery_channel: str = Field(default="EMAIL")
    message_subject: Optional[str] = None
    message_body: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    simulation_assumptions: Optional[Dict[str, Any]] = None

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Campaign name cannot be empty")
        return v.strip()

    @field_validator("total_budget_inr")
    @classmethod
    def validate_budget(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("Campaign budget must be greater than zero")
        return v


class CampaignUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    objective: Optional[str] = None
    target_segment: Optional[str] = None
    target_risk_level: Optional[str] = None
    offer: Optional[str] = None
    offer_type: Optional[str] = None
    discount_value: Optional[float] = None
    max_discount_cap_inr: Optional[float] = None
    total_budget_inr: Optional[float] = None
    per_customer_cost_inr: Optional[float] = None
    action_strength: Optional[str] = None
    audience_filters: Optional[Dict[str, Any]] = None
    control_group_pct: Optional[float] = None
    is_dry_run: Optional[bool] = None
    delivery_channel: Optional[str] = None
    message_subject: Optional[str] = None
    message_body: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


class CampaignApprovalRequest(BaseModel):
    decision: str = Field(default="APPROVE") # APPROVE or REJECT
    notes: Optional[str] = None


class CampaignExecutionRequest(BaseModel):
    is_dry_run: Optional[bool] = None


class CampaignRecipientResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    campaign_id: str
    customer_id: str
    customer_code: str
    customer_email: Optional[str] = None
    risk_level: str
    risk_score: int
    status: str
    delivery_channel: str
    dispatched_at: Optional[datetime] = None
    error_message: Optional[str] = None
    is_dry_run: bool
    is_control_group: bool
    incentive_cost_inr: float
    personalized_message: Optional[str] = None
    opened_at: Optional[datetime] = None
    redeemed_at: Optional[datetime] = None
    created_at: datetime


class CampaignResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    organization_id: str
    name: str
    description: Optional[str] = None
    objective: str = "Prevent High-Risk Churn"
    target_segment: str
    target_risk_level: str
    offer: str
    offer_type: str = "DISCOUNT"
    discount_value: float = 20.0
    discount_unit: str = "%"
    max_discount_cap_inr: float = 150.0
    total_budget_inr: float = 5000.0
    per_customer_cost_inr: float = 50.0
    action_strength: str
    status: str
    target_customer_count: int = 0
    expected_saved_count: int = 0
    expected_risk_reduction_pct: float = 0.0
    estimated_cost_inr: float = 0.0
    audience_filters: Optional[Dict[str, Any]] = None
    control_group_pct: float = 10.0
    is_dry_run: bool = True
    delivery_channel: str = "EMAIL"
    message_subject: Optional[str] = None
    message_body: Optional[str] = None
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    approval_notes: Optional[str] = None
    simulation_assumptions: Optional[Dict[str, Any]] = None
    execution_summary: Optional[Dict[str, Any]] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None


class CampaignSimulationRequest(BaseModel):
    target_segment: str = "ALL"
    target_risk_level: str = "HIGH"
    action: str = "Offer Discount"
    strength: str = "Medium"
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
    target_customer_count: Optional[int] = None
    avg_risk_before: Optional[float] = None
    avg_risk_after: Optional[float] = None
    expected_risk_reduction_pct: Optional[float] = None
    expected_saved_count: Optional[int] = None
    risk_levels_before: Optional[dict] = None
    risk_levels_after: Optional[dict] = None
