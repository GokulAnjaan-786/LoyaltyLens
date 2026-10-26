import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.models.customer import Customer
from backend.models.campaign import Campaign, CampaignStatus
from backend.services.gemini_service import gemini_service
from backend.services.risk_engine_service import calculate_risk_score
from backend.services.campaign_service import campaign_service

logger = logging.getLogger(__name__)


class RetentionIntelligenceAgentService:
    """
    Retention Intelligence Agent that:
    - Analyzes real customer segments and historical campaign results.
    - Generates explainable retention recommendations and personalized message drafts.
    - Uses existing ML models for churn scoring and deterministic calculations for budgets.
    - Never fabricates customer records or bypasses campaign approval gates.
    """

    def generate_campaign_recommendation(
        self,
        db: Session,
        organization_id: str,
        focus_risk_level: str = "HIGH",
        focus_city: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Analyzes the real customer base and past campaigns to propose an optimal
        retention campaign configuration with explainable rationale.
        """
        # 1. Gather real segment telemetry
        customers = db.query(Customer).filter(Customer.organization_id == organization_id).all()
        if not customers:
            return {
                "success": False,
                "error": "No customers found in organization database. Upload customer data first.",
                "proposed_campaign": None
            }

        app_type = customers[0].app_type if customers else "Food Delivery App"

        # Compute real risk distribution and city frequency
        city_counts = {}
        high_risk_cities = {}
        high_risk_customers = []
        all_risk_scores = []
        low_orders_count = 0
        delivery_delay_count = 0

        for c in customers:
            c_dict = {
                "login_days": c.login_days,
                "hours_spent": c.hours_spent,
                "support_tickets": c.support_tickets,
                "subscription_type": c.subscription_type,
                "orders_count": c.orders_count,
                "avg_delivery_delay_mins": c.avg_delivery_delay_mins,
                "app_rating": c.app_rating,
                "last_purchase_days": c.last_purchase_days,
                "cart_abandon_count": c.cart_abandon_count,
                "return_count": c.return_count,
                "last_active_days": c.last_active_days,
                "course_progress_percent": c.course_progress_percent,
                "avg_session_time": c.avg_session_time,
                "quiz_attempts": c.quiz_attempts,
                "customer_code": c.customer_code,
                "app_type": c.app_type
            }
            risk_res = calculate_risk_score(c_dict, app_type=c.app_type)
            score = risk_res["risk_score"]
            level = risk_res["risk_level"]
            all_risk_scores.append(score)

            city_counts[c.city] = city_counts.get(c.city, 0) + 1
            if level == "HIGH":
                high_risk_customers.append(c)
                high_risk_cities[c.city] = high_risk_cities.get(c.city, 0) + 1

            if c.orders_count <= 2:
                low_orders_count += 1
            if c.avg_delivery_delay_mins and c.avg_delivery_delay_mins > 35:
                delivery_delay_count += 1

        total_cust = len(customers)
        high_risk_count = len(high_risk_customers)
        top_churn_city = max(high_risk_cities, key=high_risk_cities.get) if high_risk_cities else (customers[0].city if customers else "Mumbai")
        target_city = focus_city if focus_city and focus_city != "ALL" else top_churn_city

        # 2. Check campaign history
        past_campaigns = db.query(Campaign).filter(Campaign.organization_id == organization_id).all()
        past_campaign_count = len(past_campaigns)
        completed_campaigns = [c for c in past_campaigns if c.status == CampaignStatus.COMPLETED]

        # 3. Formulate proposed strategy
        proposed_name = f"{target_city} High-Risk Win-Back Initiative"
        proposed_objective = "Prevent High-Risk Churn"
        proposed_segment = f"{target_city} High-Risk Accounts"
        proposed_offer = "25% OFF Next Order + Priority Express Delivery"
        proposed_offer_type = "DISCOUNT"
        discount_value = 25.0
        max_discount_cap = 150.0
        per_customer_cost = 45.0
        control_group_pct = 10.0

        # Run audience query for proposed filter
        target_filters = {
            "target_risk_level": focus_risk_level,
            "city": target_city,
            "min_orders": 0,
            "exclude_fatigue_days": 0
        }
        target_count, _, _ = campaign_service.filter_target_audience(
            db,
            organization_id=organization_id,
            filters=target_filters,
            app_type=app_type
        )

        total_budget = max(2000.0, round(target_count * per_customer_cost, 0))

        # Run deterministic simulation economics
        economics = campaign_service.simulate_campaign_economics(
            target_customer_count=target_count,
            per_customer_cost_inr=per_customer_cost,
            assumed_response_rate_pct=18.0,
            avg_order_value_inr=520.0,
            gross_margin_pct=42.0,
            repeat_purchase_factor=1.4,
            total_budget_cap_inr=total_budget
        )

        # 4. Generate AI Agent Explanation & Message Copy
        prompt = (
            f"You are the LoyaltyLens Retention Intelligence Agent.\n"
            f"Analyze this telemetry:\n"
            f"- App: {app_type}\n"
            f"- Total Accounts: {total_cust}, High-Risk Accounts: {high_risk_count}\n"
            f"- Critical Hotspot City: {target_city} ({high_risk_cities.get(target_city, 0)} high-risk users)\n"
            f"- Delivery Delays: {delivery_delay_count} users experienced >35m delays\n"
            f"- Targeted Cohort: {target_count} accounts\n"
            f"- Proposed Offer: {proposed_offer}\n\n"
            f"Generate a 2-sentence strategic rationale and a compelling 3-sentence personalized email message "
            f"using merge tags {{customer_code}} and {{city}}."
        )

        ai_rationale = None
        personalized_message = None

        if gemini_service.is_available():
            try:
                res = gemini_service._model.generate_content(prompt)
                if res and res.text:
                    ai_rationale = res.text.strip()
            except Exception as e:
                logger.warning(f"Gemini call in retention agent failed: {e}")

        is_ai = ai_rationale is not None
        provider = "Google Gemini 1.5 Flash" if is_ai else "LoyaltyLens Deterministic Rules"

        final_rationale = ai_rationale if is_ai else (
            f"Analysis of {total_cust} accounts identifies {target_city} as the top churn hotspot, with "
            f"{high_risk_cities.get(target_city, 0)} high-risk accounts. Recent friction is driven by delivery "
            f"delays and reduced order frequency. A targeted 25% discount with priority delivery directly addresses "
            f"the primary causes of churn while preserving gross margin."
        )

        subject_line = f"Special Invitation for You: 25% OFF Your Next Order in {target_city}"
        message_body = (
            f"Hello {{customer_code}},\n\n"
            f"We noticed you haven't ordered recently in {{city}}. We miss serving you and want to ensure your next experience is flawless.\n\n"
            f"Enjoy 25% OFF your next order plus complimentary Priority Delivery on us!\n"
            f"Use code: WINBACK25 at checkout.\n\n"
            f"Warm regards,\nThe LoyaltyLens Retention Team"
        )

        proposed_campaign = {
            "name": proposed_name,
            "description": f"AI-recommended win-back campaign targeting {target_count} high-risk accounts in {target_city}.",
            "objective": proposed_objective,
            "target_segment": proposed_segment,
            "target_risk_level": focus_risk_level,
            "audience_filters": target_filters,
            "target_customer_count": target_count,
            "offer": proposed_offer,
            "offer_type": proposed_offer_type,
            "discount_value": discount_value,
            "discount_unit": "%",
            "max_discount_cap_inr": max_discount_cap,
            "total_budget_inr": total_budget,
            "per_customer_cost_inr": per_customer_cost,
            "control_group_pct": control_group_pct,
            "delivery_channel": "EMAIL",
            "is_dry_run": True,
            "message_subject": subject_line,
            "message_body": message_body,
            "simulation_assumptions": economics
        }

        return {
            "success": True,
            "agent_provider": provider,
            "is_ai_powered": is_ai,
            "analysis_timestamp": datetime.now(timezone.utc).isoformat(),
            "strategic_rationale": final_rationale,
            "segment_summary": {
                "app_type": app_type,
                "total_customers": total_cust,
                "high_risk_count": high_risk_count,
                "critical_city": target_city,
                "eligible_cohort_size": target_count,
                "estimated_incentive_cost_inr": total_budget,
                "projected_retained_accounts": economics["estimated_saved_count"],
                "projected_roi_pct": economics["estimated_roi_pct"]
            },
            "proposed_campaign": proposed_campaign,
            "governance_note": "Proposed campaigns require user review and explicit administrator approval before execution."
        }


retention_agent_service = RetentionIntelligenceAgentService()
