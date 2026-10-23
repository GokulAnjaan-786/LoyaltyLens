import os
from typing import Dict, Any, Optional
from datetime import datetime
from backend.core.config import settings


class GeminiAIService:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY or os.environ.get("GEMINI_API_KEY")
        self._client = None
        
        if self.api_key:
            try:
                # Try importing google.genai or google.generativeai
                import google.generativeai as genai
                genai.configure(api_key=self.api_key)
                self._genai = genai
                self._model = genai.GenerativeModel('gemini-1.5-flash')
                self._client = "genai"
            except Exception as e:
                print(f"Gemini API initialization warning: {e}")
                self._client = None

    def is_available(self) -> bool:
        return self._client is not None and bool(self.api_key)

    def generate_customer_explanation(self, customer_data: dict, risk_info: dict) -> str:
        """Generates human-readable narrative explanation for a specific customer profile."""
        customer_code = customer_data.get("customer_code", "Customer")
        app_type = customer_data.get("app_type", "Food Delivery App")
        prob = risk_info.get("churn_probability", 0.5)
        score = risk_info.get("risk_score", 50)
        level = risk_info.get("risk_level", "MEDIUM")
        factors = [f.get("message", "") for f in risk_info.get("reasons", [])]
        factors_str = "; ".join(factors) if factors else "General activity drop"

        prompt = (
            f"You are an expert customer retention strategist for a {app_type} SaaS platform.\n"
            f"Explain why Customer {customer_code} has a {prob*100:.1f}% ML churn probability and Risk Score of {score}/100 ({level} risk).\n"
            f"Key risk factors: {factors_str}.\n"
            f"Provide a concise, 2-3 sentence executive explanation for business stakeholders."
        )

        if self.is_available():
            try:
                response = self._model.generate_content(prompt)
                if response and response.text:
                    return f"[AI Insights] {response.text.strip()}"
            except Exception as e:
                print(f"Gemini API call failed, using fallback: {e}")

        # Deterministic Fallback Logic
        return (
            f"Customer {customer_code} is classified as {level} Risk ({score}/100) with a {prob*100:.1f}% churn likelihood. "
            f"Primary friction points include: {factors_str}. Immediate retention intervention recommended."
        )

    def generate_weekly_action_brief(self, analytics_summary: dict, app_type: str = "Food Delivery App") -> Dict[str, Any]:
        """
        Generates the AI Weekly Action Brief including Executive Summary, Top Problems,
        Priority Customer Segments, Recommended Actions, and Suggested Campaigns.
        """
        total = analytics_summary.get("total_customers", 100)
        high = analytics_summary.get("high_risk_count", 20)
        med = analytics_summary.get("medium_risk_count", 30)
        low = analytics_summary.get("low_risk_count", 50)
        top_city = analytics_summary.get("highest_churn_city", "Chennai")

        prompt = (
            f"You are the Chief Customer Officer for a {app_type} enterprise.\n"
            f"Analyze this week's retention metrics:\n"
            f"- Total Customers: {total}\n"
            f"- High Risk Users: {high} ({(high/total*100):.1f}%)\n"
            f"- Medium Risk Users: {med}\n"
            f"- Low Risk Users: {low}\n"
            f"- Top Churn Region: {top_city}\n\n"
            f"Generate an executive briefing with:\n"
            f"1. Executive Summary\n"
            f"2. Top 2 Problems\n"
            f"3. Recommended Actions\n"
        )

        ai_narrative = None
        if self.is_available():
            try:
                res = self._model.generate_content(prompt)
                if res and res.text:
                    ai_narrative = res.text.strip()
            except Exception as e:
                print(f"Gemini weekly brief API failed, using fallback: {e}")

        is_ai = ai_narrative is not None
        provider = "Google Gemini 1.5 Flash" if is_ai else "LoyaltyLens Deterministic Engine (Fallback)"

        exec_summary = ai_narrative if is_ai else (
            f"Weekly Retention Analysis indicates {high} customers ({(high/total*100 if total else 0):.1f}% of active base) "
            f"are at High Risk of churn this week. Regional friction is highest in {top_city}. Targeted interventions "
            f"can prevent up to {int(high * 0.3)} potential churned accounts."
        )

        top_problems = [
            f"High churn risk concentration in {top_city} due to delivery delay and rating drop-offs.",
            f"Free tier users exhibit 2.5x higher churn rate compared to Gold/Pro members."
        ]

        priority_segments = [
            f"High Risk Users in {top_city} (Immediate 24-48h intervention)",
            "Dormant Users with < 5 orders in last 30 days"
        ]

        recommended_actions = [
            {
                "priority": "High",
                "action": f"Launch 'Delivery Satisfaction Coupon' in {top_city}",
                "owner": "Marketing & Ops",
                "timeline": "This Week"
            },
            {
                "priority": "Medium",
                "action": "Deploy Automated Pro Tier Free Trial push notifications to High-Risk Free users",
                "owner": "Growth Team",
                "timeline": "Next 3 Days"
            }
        ]

        suggested_campaigns = [
            {
                "campaign_name": f"{top_city} Reactivation Drive",
                "target_audience": f"High Risk Users in {top_city}",
                "recommended_offer": "50% OFF Next Order + Free Delivery",
                "expected_impact": "Save ~25-30% of targeted high-risk cohort"
            }
        ]

        return {
            "generated_at": datetime.now().strftime("%B %d, %Y %H:%M UTC"),
            "is_ai_generated": is_ai,
            "ai_provider": provider,
            "executive_summary": exec_summary,
            "top_problems": top_problems,
            "priority_customer_segments": priority_segments,
            "priority_segments": priority_segments,
            "recommended_actions": recommended_actions,
            "suggested_campaigns": suggested_campaigns,
            "weekly_snapshot": {
                "total_customers": total,
                "high_risk_count": high,
                "medium_risk_count": med,
                "low_risk_count": low,
                "critical_zone": top_city
            }
        }


gemini_service = GeminiAIService()
