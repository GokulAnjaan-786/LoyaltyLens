from typing import List, Dict, Any, Optional
from pydantic import BaseModel


class WeeklyBriefResponse(BaseModel):
    generated_at: str
    is_ai_generated: bool
    ai_provider: str # "Google Gemini 1.5 Flash" or "LoyaltyLens Deterministic Engine (Fallback)"
    executive_summary: str
    top_problems: List[str]
    priority_customer_segments: List[str]
    recommended_actions: List[Dict[str, str]]
    suggested_campaigns: List[Dict[str, str]]
    weekly_snapshot: Dict[str, Any]
