import math
import random
import logging
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_

from backend.models.customer import Customer
from backend.models.campaign import Campaign, CampaignRecipient, CampaignResult, CampaignStatus, RecipientStatus
from backend.models.audit import AuditLog
from backend.services.risk_engine_service import calculate_risk_score
from backend.services.reason_engine_service import generate_structured_reasons
from backend.services.messaging_provider import messaging_provider
from backend.core.config import settings

logger = logging.getLogger(__name__)


class CampaignService:
    """
    Core business logic service for LoyaltyLens Retention Campaigns:
    - Audience Targeting & Filtering
    - Offer Recommendation Engine
    - Retention Campaign Simulator & Economics
    - Approval Governance & Lifecycle Management
    - Idempotent Execution Engine (Dry-Run & Real Provider)
    - Performance Tracking & Control Group Lift
    """

    def filter_target_audience(
        self,
        db: Session,
        organization_id: str,
        filters: Dict[str, Any],
        app_type: Optional[str] = None
    ) -> Tuple[int, List[Dict[str, Any]], Dict[str, Any]]:
        """
        Intelligently filters real organization customers by churn risk, location,
        orders, inactivity, and subscription tier.
        Applies fatigue rules to prevent spamming users recently targeted.
        Never fabricates customers or churn metrics.
        """
        query = db.query(Customer).filter(Customer.organization_id == organization_id)

        if app_type:
            query = query.filter(Customer.app_type == app_type)

        # 1. Location / City Filter
        city = filters.get("city")
        if city and city != "ALL":
            if isinstance(city, list):
                query = query.filter(Customer.city.in_(city))
            else:
                query = query.filter(Customer.city == city)

        # 2. Subscription Type Filter
        sub_type = filters.get("subscription_type")
        if sub_type and sub_type != "ALL":
            query = query.filter(Customer.subscription_type == sub_type)

        # 3. Inactivity / Activity Days Filter
        min_inactivity = filters.get("min_inactivity_days")
        if min_inactivity is not None and min_inactivity > 0:
            query = query.filter(
                or_(
                    Customer.last_purchase_days >= min_inactivity,
                    Customer.last_active_days >= min_inactivity,
                    Customer.login_days <= max(1, 30 - min_inactivity)
                )
            )

        max_inactivity = filters.get("max_inactivity_days")
        if max_inactivity is not None and max_inactivity > 0:
            query = query.filter(
                and_(
                    or_(
                        Customer.last_purchase_days <= max_inactivity,
                        Customer.last_purchase_days == None
                    ),
                    or_(
                        Customer.last_active_days <= max_inactivity,
                        Customer.last_active_days == None
                    )
                )
            )

        # 4. Order Count Range Filter
        min_orders = filters.get("min_orders")
        if min_orders is not None:
            query = query.filter(Customer.orders_count >= min_orders)

        max_orders = filters.get("max_orders")
        if max_orders is not None:
            query = query.filter(Customer.orders_count <= max_orders)

        all_candidates = query.all()

        # 5. Fatigue Exclusions: Check if customer was targeted in any active/completed campaign within last N days
        fatigue_days = filters.get("exclude_fatigue_days", 0)
        fatigued_customer_ids = set()
        if fatigue_days and fatigue_days > 0:
            cutoff = datetime.now(timezone.utc) - timedelta(days=fatigue_days)
            recent_recipients = db.query(CampaignRecipient.customer_id).filter(
                CampaignRecipient.organization_id == organization_id,
                CampaignRecipient.created_at >= cutoff,
                CampaignRecipient.status != RecipientStatus.FAILED
            ).all()
            fatigued_customer_ids = {r[0] for r in recent_recipients}

        target_risk_level = filters.get("target_risk_level", "HIGH")
        min_risk_score = filters.get("min_risk_score", 0)
        max_risk_score = filters.get("max_risk_score", 100)

        matched_customers = []
        risk_dist = {"HIGH": 0, "MEDIUM": 0, "LOW": 0}
        city_breakdown = {}
        excluded_fatigue_count = 0

        for c in all_candidates:
            if c.id in fatigued_customer_ids:
                excluded_fatigue_count += 1
                continue

            # Compute real business risk score and level
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
            c_score = risk_res["risk_score"]
            c_level = risk_res["risk_level"]

            # Filter by risk level
            if target_risk_level != "ALL":
                if target_risk_level == "HIGH" and c_level != "HIGH":
                    continue
                elif target_risk_level == "MEDIUM" and c_level != "MEDIUM":
                    continue
                elif target_risk_level == "LOW" and c_level != "LOW":
                    continue
                elif target_risk_level == "HIGH_OR_MEDIUM" and c_level not in ["HIGH", "MEDIUM"]:
                    continue

            # Filter by explicit score range
            if not (min_risk_score <= c_score <= max_risk_score):
                continue

            risk_dist[c_level] = risk_dist.get(c_level, 0) + 1
            city_breakdown[c.city] = city_breakdown.get(c.city, 0) + 1

            matched_customers.append({
                "id": c.id,
                "customer_code": c.customer_code,
                "city": c.city,
                "subscription_type": c.subscription_type,
                "orders_count": c.orders_count,
                "login_days": c.login_days,
                "last_purchase_days": c.last_purchase_days,
                "risk_score": c_score,
                "risk_level": c_level,
                "churn_probability": round(c_score / 100.0, 2),
                "app_type": c.app_type,
                "app_rating": c.app_rating
            })

        analytics = {
            "total_candidates_examined": len(all_candidates),
            "total_matching": len(matched_customers),
            "excluded_fatigue_count": excluded_fatigue_count,
            "risk_distribution": risk_dist,
            "city_breakdown": city_breakdown,
            "avg_risk_score": round(sum(c["risk_score"] for c in matched_customers) / len(matched_customers), 1) if matched_customers else 0.0
        }

        return len(matched_customers), matched_customers, analytics

    def recommend_offers_for_audience(
        self,
        audience_sample: List[Dict[str, Any]],
        app_type: str = "Food Delivery App"
    ) -> List[Dict[str, Any]]:
        """
        Recommends suitable retention offers using transparent, configurable business rules
        anchored directly to the target cohort's observed churn reasons.
        Explains why each offer is recommended and includes business constraints.
        """
        if not audience_sample:
            return [
                {
                    "offer_name": "General Win-Back 20% Discount",
                    "offer_type": "DISCOUNT",
                    "discount_value": 20.0,
                    "discount_unit": "%",
                    "max_discount_cap_inr": 150.0,
                    "estimated_per_customer_cost_inr": 45.0,
                    "recommended_channel": "EMAIL",
                    "rationale": "Standard win-back incentive for re-engaging customers with dormant purchase patterns.",
                    "business_limits": "Max discount ₹150; valid for 14 days; 1 redemption per account.",
                    "evidence_disclaimer": "Retention improvement is subject to customer redemption; measured uplift must be tracked against a holdout control group."
                }
            ]

        # Aggregate observed cohort friction points
        total_users = len(audience_sample)
        avg_score = sum(c.get("risk_score", 50) for c in audience_sample) / total_users
        low_orders_count = sum(1 for c in audience_sample if c.get("orders_count", 0) <= 2)
        low_rating_count = sum(1 for c in audience_sample if c.get("app_rating", 5.0) < 3.5)
        dormant_count = sum(1 for c in audience_sample if (c.get("last_purchase_days") or 0) > 20)

        pct_low_orders = round((low_orders_count / total_users) * 100)
        pct_low_rating = round((low_rating_count / total_users) * 100)
        pct_dormant = round((dormant_count / total_users) * 100)

        recommendations = []

        # 1. Primary Discount Recommendation
        if pct_dormant >= 30 or avg_score >= 60:
            recommendations.append({
                "offer_name": "High-Impact Win-Back 25% Off",
                "offer_type": "DISCOUNT",
                "discount_value": 25.0,
                "discount_unit": "%",
                "max_discount_cap_inr": 175.0,
                "estimated_per_customer_cost_inr": 55.0,
                "recommended_channel": "EMAIL",
                "rationale": f"{pct_dormant}% of this cohort has been inactive for >20 days with an average risk score of {avg_score:.1f}. A 25% discount removes price friction for reactivating high-intent orders.",
                "business_limits": "Max discount cap of ₹175; minimum order value ₹300; single-use token.",
                "evidence_disclaimer": "Recommended based on dormancy patterns. Retention impact requires post-campaign redemption verification."
            })

        # 2. Free Delivery / Logistics Friction Offer
        if "Food" in app_type or pct_low_rating >= 25:
            recommendations.append({
                "offer_name": "3x Free Priority Delivery Pass",
                "offer_type": "FREE_DELIVERY",
                "discount_value": 100.0,
                "discount_unit": "%",
                "max_discount_cap_inr": 120.0,
                "estimated_per_customer_cost_inr": 40.0,
                "recommended_channel": "PUSH",
                "rationale": f"Logistics delays and delivery fees are primary churn causes in {app_type}. Waiving delivery fees on 3 orders restores user trust without excessive margin dilution.",
                "business_limits": "Valid for next 3 consecutive orders within 21 days; capped at ₹40/delivery.",
                "evidence_disclaimer": "Incentive cost is capped; incremental retention must be measured against holdout accounts."
            })

        # 3. Loyalty Points Multiplier
        recommendations.append({
            "offer_name": "Double Loyalty Points (2x Reward Points)",
            "offer_type": "LOYALTY_POINTS",
            "discount_value": 200.0,
            "discount_unit": "POINTS",
            "max_discount_cap_inr": 100.0,
            "estimated_per_customer_cost_inr": 25.0,
            "recommended_channel": "IN_APP",
            "rationale": f"{pct_low_orders}% of the target audience placed 2 or fewer orders. A points multiplier incentivizes repeat purchasing and habit formation with lower upfront cash cost.",
            "business_limits": "Points expire in 45 days if unused; non-transferable.",
            "evidence_disclaimer": "Non-cash incentive; lower immediate cost, but depends on customer awareness."
        })

        # 4. VIP Concierge / Apology Credit
        if avg_score >= 70 or pct_low_rating >= 30:
            recommendations.append({
                "offer_name": "VIP Priority Care + ₹100 Wallet Credit",
                "offer_type": "CASHBACK",
                "discount_value": 100.0,
                "discount_unit": "INR",
                "max_discount_cap_inr": 100.0,
                "estimated_per_customer_cost_inr": 100.0,
                "recommended_channel": "EMAIL",
                "rationale": f"Severe dissatisfaction detected ({pct_low_rating}% low ratings). Direct wallet compensation paired with VIP support routing directly remedies critical retention risks.",
                "business_limits": "Direct wallet credit; restricted to verified accounts; requires manager approval.",
                "evidence_disclaimer": "High incentive cost; reserved strictly for critical accounts with high CLV."
            })

        return recommendations

    def simulate_campaign_economics(
        self,
        target_customer_count: int,
        per_customer_cost_inr: float,
        assumed_response_rate_pct: float = 15.0,
        avg_order_value_inr: float = 500.0,
        gross_margin_pct: float = 40.0,
        repeat_purchase_factor: float = 1.4,
        total_budget_cap_inr: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Calculates campaign economics, total incentive cost, estimated revenue,
        break-even point, and ROI using clearly documented mathematical assumptions.
        Clearly labels all simulation results as hypothetical projections.
        """
        # Clamp inputs
        target_customer_count = max(0, int(target_customer_count))
        per_customer_cost_inr = max(0.0, float(per_customer_cost_inr))
        assumed_response_rate_pct = max(1.0, min(100.0, float(assumed_response_rate_pct)))
        avg_order_value_inr = max(50.0, float(avg_order_value_inr))
        gross_margin_pct = max(1.0, min(100.0, float(gross_margin_pct)))
        repeat_purchase_factor = max(1.0, min(5.0, float(repeat_purchase_factor)))

        total_potential_cost_inr = round(target_customer_count * per_customer_cost_inr, 2)
        if total_budget_cap_inr and total_budget_cap_inr > 0:
            effective_budget_inr = min(total_budget_cap_inr, total_potential_cost_inr)
        else:
            effective_budget_inr = total_potential_cost_inr

        # Estimated retained customers based on assumed response rate
        estimated_saved_count = int(round(target_customer_count * (assumed_response_rate_pct / 100.0)))
        
        # Expected incremental revenue
        estimated_revenue_inr = round(estimated_saved_count * avg_order_value_inr * repeat_purchase_factor, 2)
        
        # Gross profit earned from incremental orders
        estimated_gross_profit_inr = round(estimated_revenue_inr * (gross_margin_pct / 100.0), 2)

        # Break-even calculation: how many accounts must be retained to cover total cost?
        margin_per_order = avg_order_value_inr * (gross_margin_pct / 100.0) * repeat_purchase_factor
        if margin_per_order > 0:
            break_even_customers = int(math.ceil(total_potential_cost_inr / margin_per_order))
            break_even_response_rate_pct = round((break_even_customers / target_customer_count * 100.0), 2) if target_customer_count > 0 else 0.0
        else:
            break_even_customers = 0
            break_even_response_rate_pct = 0.0

        # ROI percentage
        if total_potential_cost_inr > 0:
            net_benefit = estimated_gross_profit_inr - total_potential_cost_inr
            roi_pct = round((net_benefit / total_potential_cost_inr) * 100.0, 1)
        else:
            roi_pct = 0.0

        return {
            "simulation_label": "HYPOTHETICAL SIMULATION - BASED ON USER ASSUMPTIONS",
            "is_simulation": True,
            "target_customer_count": target_customer_count,
            "per_customer_cost_inr": per_customer_cost_inr,
            "total_potential_cost_inr": total_potential_cost_inr,
            "effective_budget_inr": effective_budget_inr,
            "assumed_response_rate_pct": assumed_response_rate_pct,
            "estimated_saved_count": estimated_saved_count,
            "avg_order_value_inr": avg_order_value_inr,
            "gross_margin_pct": gross_margin_pct,
            "repeat_purchase_factor": repeat_purchase_factor,
            "estimated_revenue_inr": estimated_revenue_inr,
            "estimated_gross_profit_inr": estimated_gross_profit_inr,
            "break_even_customers": break_even_customers,
            "break_even_response_rate_pct": break_even_response_rate_pct,
            "estimated_roi_pct": roi_pct,
            "risk_mitigation_summary": (
                f"Campaign targets {target_customer_count} accounts with an estimated cost of ₹{total_potential_cost_inr:,.0f}. "
                f"At an assumed {assumed_response_rate_pct}% conversion rate, retaining {estimated_saved_count} customers "
                f"yields ~₹{estimated_revenue_inr:,.0f} in revenue and ~₹{estimated_gross_profit_inr:,.0f} gross profit "
                f"({roi_pct}% projected ROI). Break-even requires retaining {break_even_customers} accounts."
            ),
            "documented_assumptions": [
                f"Response/conversion rate modeled at {assumed_response_rate_pct}%.",
                f"Average Order Value (AOV) modeled at ₹{avg_order_value_inr:.0f}.",
                f"Gross margin modeled at {gross_margin_pct}%.",
                f"Repeat order multiplier modeled at {repeat_purchase_factor}x within 60 days.",
                "Actual performance depends on customer redemption and must be verified post-execution."
            ]
        }

    def execute_campaign(
        self,
        db: Session,
        campaign_id: str,
        organization_id: str,
        user_name: str,
        is_dry_run_override: Optional[bool] = None
    ) -> Dict[str, Any]:
        """
        Executes campaign with strict idempotency and lifecycle safeguards:
        - Must be APPROVED or SCHEDULED
        - Cannot be re-executed if already RUNNING or COMPLETED
        - Partitions audience into Treatment Group and Holdout Control Group
        - Dispatches via messaging provider (or safe dry-run sandbox)
        - Records individual recipient states and execution summary
        """
        campaign = db.query(Campaign).filter(
            Campaign.id == campaign_id,
            Campaign.organization_id == organization_id
        ).first()

        if not campaign:
            raise ValueError("Campaign not found")

        # Idempotency check: Cannot re-execute if already completed or active
        if campaign.status in [CampaignStatus.COMPLETED, CampaignStatus.RUNNING]:
            raise ValueError(f"Campaign is already in '{campaign.status.value}' state. Duplicate execution prevented.")

        if campaign.status not in [CampaignStatus.APPROVED, CampaignStatus.SCHEDULED, CampaignStatus.PAUSED]:
            raise ValueError(f"Campaign cannot be executed while in '{campaign.status.value}' status. Explicit approval is required first.")

        # Determine dry-run setting
        is_dry_run = is_dry_run_override if is_dry_run_override is not None else campaign.is_dry_run

        # Mark campaign as RUNNING
        campaign.status = CampaignStatus.RUNNING
        db.commit()

        # Re-query eligible audience matching saved filters
        filters = dict(campaign.audience_filters) if campaign.audience_filters else {
            "target_risk_level": campaign.target_risk_level,
            "city": "ALL"
        }
        if is_dry_run:
            filters["exclude_fatigue_days"] = 0

        _, target_customers, _ = self.filter_target_audience(
            db,
            organization_id=organization_id,
            filters=filters
        )

        if not target_customers:
            campaign.status = CampaignStatus.FAILED
            campaign.execution_summary = {
                "error": "No eligible customers found matching campaign audience filters at execution time.",
                "executed_at": datetime.now(timezone.utc).isoformat(),
                "attempted": 0,
                "delivered": 0
            }
            db.commit()
            raise ValueError("No eligible customers matched the campaign criteria.")

        control_pct = float(campaign.control_group_pct or 10.0) / 100.0
        dispatched_recipients = []
        attempted_count = 0
        delivered_count = 0
        failed_count = 0
        control_count = 0
        total_incentive_spent = 0.0

        provider_status = messaging_provider.get_provider_status()

        for c_info in target_customers:
            # Random holdout assignment for incrementality measurement
            is_control = random.random() < control_pct
            customer_code = c_info["customer_code"]
            customer_email = f"{customer_code.lower()}@customer.loyaltylens.com"

            # Create personalized win-back message
            personalized_msg = (
                f"Hello {customer_code},\n\n"
                f"We noticed you have not ordered recently in {c_info.get('city', 'your area')}. "
                f"We value your loyalty and want to make your next experience exceptional.\n\n"
                f"Exclusive Offer: {campaign.offer}\n"
                f"Use code: RETAIN-{campaign.id[:6].upper()} at checkout.\n\n"
                f"— The LoyaltyLens Customer Care Team"
            )

            if is_control:
                # Holdout control group: Do not send external message
                control_count += 1
                recipient = CampaignRecipient(
                    campaign_id=campaign.id,
                    customer_id=c_info["id"],
                    organization_id=organization_id,
                    customer_code=customer_code,
                    customer_email=customer_email,
                    risk_level=c_info["risk_level"],
                    risk_score=c_info["risk_score"],
                    status=RecipientStatus.CONTROL_GROUP,
                    delivery_channel=campaign.delivery_channel or "EMAIL",
                    dispatched_at=datetime.now(timezone.utc),
                    is_dry_run=is_dry_run,
                    is_control_group=True,
                    incentive_cost_inr=0.0,
                    personalized_message=personalized_msg
                )
                db.add(recipient)
            else:
                # Treatment group: Dispatch via messaging provider
                attempted_count += 1
                dispatch_res = messaging_provider.send_retention_message(
                    recipient_email=customer_email,
                    subject=campaign.message_subject or f"Special Retention Offer: {campaign.offer}",
                    body=campaign.message_body or personalized_msg,
                    customer_code=customer_code,
                    is_dry_run=is_dry_run
                )

                if dispatch_res["success"]:
                    delivered_count += 1
                    status = RecipientStatus.DELIVERED
                    cost = float(campaign.per_customer_cost_inr or 40.0)
                    total_incentive_spent += cost
                    error_msg = None
                else:
                    failed_count += 1
                    status = RecipientStatus.FAILED
                    cost = 0.0
                    error_msg = dispatch_res.get("error")

                recipient = CampaignRecipient(
                    campaign_id=campaign.id,
                    customer_id=c_info["id"],
                    organization_id=organization_id,
                    customer_code=customer_code,
                    customer_email=customer_email,
                    risk_level=c_info["risk_level"],
                    risk_score=c_info["risk_score"],
                    status=status,
                    delivery_channel=campaign.delivery_channel or "EMAIL",
                    dispatched_at=datetime.now(timezone.utc),
                    is_dry_run=is_dry_run,
                    is_control_group=False,
                    incentive_cost_inr=cost,
                    personalized_message=personalized_msg,
                    error_message=error_msg
                )
                db.add(recipient)

        # Update campaign state and summary
        campaign.status = CampaignStatus.COMPLETED
        campaign.is_dry_run = is_dry_run
        campaign.target_customer_count = len(target_customers)

        summary = {
            "executed_by": user_name,
            "executed_at": datetime.now(timezone.utc).isoformat(),
            "is_dry_run": is_dry_run,
            "provider_type": provider_status["provider_type"],
            "total_targeted": len(target_customers),
            "attempted_sends": attempted_count,
            "delivered_count": delivered_count,
            "failed_count": failed_count,
            "control_group_count": control_count,
            "total_incentive_spent_inr": round(total_incentive_spent, 2)
        }
        campaign.execution_summary = summary

        # Create or update CampaignResult
        existing_res = db.query(CampaignResult).filter(CampaignResult.campaign_id == campaign.id).first()
        if not existing_res:
            res_record = CampaignResult(
                campaign_id=campaign.id,
                total_targeted=len(target_customers),
                converted_count=0,
                churn_prevented_count=0,
                roi_percentage=0.0,
                metrics_json=summary
            )
            db.add(res_record)
        else:
            existing_res.total_targeted = len(target_customers)
            existing_res.metrics_json = summary

        # Log audit entry
        audit = AuditLog(
            organization_id=organization_id,
            action="CAMPAIGN_EXECUTED",
            details={
                "campaign_id": campaign.id,
                "campaign_name": campaign.name,
                "is_dry_run": is_dry_run,
                "delivered": delivered_count,
                "control_group": control_count,
                "attempted": attempted_count
            }
        )
        db.add(audit)
        db.commit()
        db.refresh(campaign)

        return summary

    def get_campaign_performance(self, db: Session, campaign_id: str, organization_id: str) -> Dict[str, Any]:
        """
        Computes real-time performance tracking metrics, distinguishes unavailable metrics,
        and evaluates incremental lift against holdout control groups.
        """
        campaign = db.query(Campaign).filter(
            Campaign.id == campaign_id,
            Campaign.organization_id == organization_id
        ).first()

        if not campaign:
            raise ValueError("Campaign not found")

        recipients = db.query(CampaignRecipient).filter(
            CampaignRecipient.campaign_id == campaign_id
        ).all()

        total_targeted = len(recipients)
        delivered_count = sum(1 for r in recipients if r.status == RecipientStatus.DELIVERED)
        failed_count = sum(1 for r in recipients if r.status == RecipientStatus.FAILED)
        control_count = sum(1 for r in recipients if r.is_control_group)
        treatment_count = total_targeted - control_count

        opened_count = sum(1 for r in recipients if r.opened_at is not None or r.status == RecipientStatus.OPENED)
        redeemed_count = sum(1 for r in recipients if r.redeemed_at is not None or r.status == RecipientStatus.REDEEMED)
        total_cost_inr = sum(float(r.incentive_cost_inr or 0.0) for r in recipients)

        # Evaluate Incrementality Lift (Treatment vs Control)
        # Treatment response rate vs Control natural response rate
        treatment_redeemed = sum(1 for r in recipients if not r.is_control_group and (r.redeemed_at or r.status == RecipientStatus.REDEEMED))
        treatment_rate = (treatment_redeemed / treatment_count * 100.0) if treatment_count > 0 else 0.0

        control_redeemed = sum(1 for r in recipients if r.is_control_group and (r.redeemed_at or r.status == RecipientStatus.REDEEMED))
        control_rate = (control_redeemed / control_count * 100.0) if control_count > 0 else 0.0

        incremental_lift_pct = round(treatment_rate - control_rate, 2)

        # Distinguish tracking availability (e.g. webhook tracking connected vs unavailable)
        tracking_provider = messaging_provider.get_provider_status()
        clicks_available = False # Set to True if SendGrid/Mailgun click tracking webhook is active

        return {
            "campaign_id": campaign.id,
            "campaign_name": campaign.name,
            "status": campaign.status.value,
            "is_dry_run": campaign.is_dry_run,
            "delivery_channel": campaign.delivery_channel or "EMAIL",
            "total_targeted": total_targeted,
            "treatment_group_count": treatment_count,
            "control_group_count": control_count,
            "delivered_count": delivered_count,
            "failed_count": failed_count,
            "delivery_rate_pct": round((delivered_count / treatment_count * 100.0), 1) if treatment_count > 0 else 0.0,
            
            # Engagement Metrics
            "opened_count": opened_count,
            "open_rate_pct": round((opened_count / delivered_count * 100.0), 1) if delivered_count > 0 else 0.0,
            "clicks_count": None if not clicks_available else 0,
            "clicks_metric_status": "N/A - External click tracking webhook not connected" if not clicks_available else "ACTIVE",
            "redeemed_count": redeemed_count,
            "redemption_rate_pct": round((redeemed_count / delivered_count * 100.0), 1) if delivered_count > 0 else 0.0,
            
            # Financial & Lift Metrics
            "total_incentive_spent_inr": round(total_cost_inr, 2),
            "treatment_conversion_rate_pct": round(treatment_rate, 2),
            "control_conversion_rate_pct": round(control_rate, 2),
            "incremental_retention_lift_pct": incremental_lift_pct,
            "control_group_configured": control_count > 0,
            "execution_summary": campaign.execution_summary
        }

    def record_recipient_interaction(
        self,
        db: Session,
        campaign_id: str,
        organization_id: str,
        customer_code: Optional[str] = None,
        event_type: str = "REDEEM" # "OPEN" or "REDEEM"
    ) -> Dict[str, Any]:
        """
        Records or simulates an open or redemption event for testing tracking pipelines.
        """
        query = db.query(CampaignRecipient).filter(
            CampaignRecipient.campaign_id == campaign_id,
            CampaignRecipient.organization_id == organization_id
        )
        if customer_code:
            query = query.filter(CampaignRecipient.customer_code == customer_code)
        else:
            # Pick a delivered recipient that hasn't redeemed yet
            query = query.filter(
                CampaignRecipient.status == RecipientStatus.DELIVERED,
                CampaignRecipient.redeemed_at == None
            )

        recipient = query.first()
        if not recipient:
            raise ValueError("No eligible delivered recipient found to record interaction.")

        now = datetime.now(timezone.utc)
        if event_type == "OPEN":
            recipient.opened_at = now
            recipient.status = RecipientStatus.OPENED
        elif event_type == "REDEEM":
            recipient.redeemed_at = now
            recipient.status = RecipientStatus.REDEEMED

        db.commit()
        db.refresh(recipient)

        return {
            "success": True,
            "customer_code": recipient.customer_code,
            "event_type": event_type,
            "updated_status": recipient.status.value,
            "timestamp": now.isoformat()
        }


campaign_service = CampaignService()
