from typing import List, Dict, Any, Optional, Union
from pydantic import BaseModel, Field


class WeeklyBriefResponse(BaseModel):
    generated_at: str = ""
    is_ai_generated: bool = False
    ai_provider: str = "LoyaltyLens Deterministic Engine (Fallback)"
    executive_summary: str = ""
    top_problems: List[str] = Field(default_factory=list)
    priority_customer_segments: List[str] = Field(default_factory=list)
    priority_segments: List[str] = Field(default_factory=list)
    recommended_actions: List[Union[Dict[str, Any], str]] = Field(default_factory=list)
    suggested_campaigns: List[Union[Dict[str, Any], str]] = Field(default_factory=list)
    weekly_snapshot: Dict[str, Any] = Field(default_factory=dict)
