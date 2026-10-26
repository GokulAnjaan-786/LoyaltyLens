from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class WasteSummaryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    total_recorded_incentive_cost_inr: float = Field(..., description="Actual recorded incentive costs from recipient dispatches")
    total_incentive_spent_inr: float = Field(..., description="Alias for total recorded incentive costs")
    total_delivery_cost_inr: float = Field(0.0, description="Actual recorded or calculated delivery channel cost")
    total_retention_spend_inr: float = Field(..., description="Sum of incentive cost and delivery cost")
    delivery_cost_status: str = Field(..., description="Availability status of delivery cost data")
    unredeemed_incentive_exposure_inr: float = Field(..., description="Total incentive value issued on unredeemed completed/expired campaigns")
    unredeemed_incentive_cost_inr: float = Field(..., description="Alias for unredeemed incentive exposure")
    weak_campaigns_count: int = Field(..., description="Number of campaigns meeting low-performance criteria with sufficient data")
    low_performing_campaigns_count: int = Field(..., description="Alias for weak campaigns count")
    repeat_incentive_recipients_count: int = Field(..., description="Count of distinct customers receiving repeated incentives without redemption")
    repeated_incentive_recipients_count: int = Field(..., description="Alias for repeat recipients count")
    potential_savings_identified_inr: float = Field(..., description="Identified avoidable or reclaimable budget waste")
    confirmed_realized_savings_inr: float = Field(..., description="Realized savings verified after approved action")
    open_opportunities_count: int = Field(..., description="Count of active unaddressed waste findings")
    under_review_count: int = Field(..., description="Count of findings currently under review")
    resolved_count: int = Field(..., description="Count of resolved waste findings")
    time_period: str = Field(..., description="Audit window analysed")
    lookback_days: int = Field(90, description="Number of lookback days in analysis")
    data_source_description: str = Field(..., description="Source tables and audit verification provenance")
    data_source: str = Field("campaign_recipients, campaigns, customer_features", description="Primary data source label")
    currency: str = "INR"


class WasteOpportunityResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    organization_id: str
    rule_id: str
    rule_version: str
    title: str
    category: str
    campaign_id: Optional[str] = None
    campaign_name: Optional[str] = None
    customer_id: Optional[str] = None
    customer_code: Optional[str] = None
    segment: Optional[str] = None
    affected_spend_inr: float
    potential_savings_inr: float
    realized_savings_inr: float
    evidence_strength: str # HIGH, MEDIUM, LOW
    data_sufficiency: str # SUFFICIENT, INSUFFICIENT_DATA
    finding_summary: str
    evidence_json: Dict[str, Any]
    recommended_action: str
    recommended_action_type: str
    verification_method: Optional[str] = None
    review_status: str # OPEN, UNDER_REVIEW, APPROVED, DISMISSED, RESOLVED
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    resolution_notes: Optional[str] = None
    detected_at: datetime
    updated_at: Optional[datetime] = None


class WasteOpportunityListResponse(BaseModel):
    total: int
    page: int
    size: int
    items: List[WasteOpportunityResponse]
    category_breakdown: Dict[str, int]
    status_breakdown: Dict[str, int]


class WasteReviewActionRequest(BaseModel):
    review_status: str = Field(..., description="Target status: UNDER_REVIEW, APPROVED, DISMISSED, RESOLVED")
    resolution_notes: Optional[str] = Field(None, description="Operational notes or rationale for review decision")
    realized_savings_inr: Optional[float] = Field(0.0, ge=0.0, description="Confirmed realized savings upon resolution")


class WasteAnalysisRunResponse(BaseModel):
    success: bool
    opportunities_detected: int
    total_opportunities_found: int
    new_opportunities: int
    updated_opportunities: int
    total_potential_savings_inr: float
    repeated_incentives_detected: int = 0
    low_performing_campaigns_detected: int = 0
    unnecessary_discounts_detected: int = 0
    budget_leakages_detected: int = 0
    inefficient_segments_detected: int = 0
    rules_executed: List[str]
    analysis_timestamp: datetime
    analyzed_at: Optional[datetime] = None
    ai_executive_summary: Optional[str] = None
    ai_provider: Optional[str] = None
