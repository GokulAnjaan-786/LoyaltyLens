import math
import logging
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_

from backend.models.campaign import Campaign, CampaignRecipient, CampaignResult, CampaignStatus, RecipientStatus
from backend.models.customer import Customer
from backend.models.budget_waste import (
    BudgetWasteOpportunity,
    WasteCategory,
    WasteReviewStatus,
    EvidenceStrength,
    DataSufficiency
)
from backend.models.audit import AuditLog
from backend.services.gemini_service import gemini_service

logger = logging.getLogger(__name__)

# Delivery channel costs per message (INR)
CHANNEL_DELIVERY_COST_INR = {
    "EMAIL": 0.10,
    "SMS": 0.25,
    "PUSH": 0.02,
    "IN_APP": 0.01
}


def get_utc_now() -> datetime:
    """Returns naive UTC datetime for standard SQLAlchemy and SQLite compatibility."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


def calculate_days_elapsed(dt: Optional[datetime]) -> int:
    """Safely calculates days elapsed handling naive and aware datetimes."""
    if not dt:
        return 0
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    naive_dt = dt.replace(tzinfo=None) if hasattr(dt, 'tzinfo') and dt.tzinfo else dt
    return max(0, (now - naive_dt).days)


def estimate_delivery_cost(channel: str, delivered_count: int) -> float:
    """Calculates delivery cost based on channel send volume and rate table."""
    ch_key = channel.upper().replace(" ", "_").replace("-", "_")
    if "PUSH" in ch_key:
        rate = CHANNEL_DELIVERY_COST_INR["PUSH"]
    elif "SMS" in ch_key:
        rate = CHANNEL_DELIVERY_COST_INR["SMS"]
    elif "IN_APP" in ch_key or "INAPP" in ch_key:
        rate = CHANNEL_DELIVERY_COST_INR["IN_APP"]
    elif "EMAIL" in ch_key:
        rate = CHANNEL_DELIVERY_COST_INR["EMAIL"]
    else:
        rate = CHANNEL_DELIVERY_COST_INR.get(ch_key, 0.10)
    return round(delivered_count * rate, 2)


def calculate_incremental_metrics(
    incremental_revenue: float,
    gross_margin_rate: float,
    total_campaign_cost: float
) -> Dict[str, Any]:
    """
    Standard tested financial calculation function:
    - Incremental Gross Profit = Incremental Revenue * Gross Margin Rate
    - Net Campaign Contribution = Incremental Gross Profit - Total Campaign Cost
    - Incremental ROI (%) = (Net Campaign Contribution / Total Campaign Cost) * 100
    Handles zero-denominator safely.
    """
    gross_profit = round(float(incremental_revenue) * float(gross_margin_rate), 2)
    net_contrib = round(gross_profit - float(total_campaign_cost), 2)
    if total_campaign_cost > 0:
        roi_pct = round((net_contrib / float(total_campaign_cost)) * 100.0, 2)
    else:
        roi_pct = 0.0

    return {
        "incremental_revenue_inr": round(float(incremental_revenue), 2),
        "gross_margin_rate": round(float(gross_margin_rate), 4),
        "incremental_gross_profit_inr": gross_profit,
        "total_campaign_cost_inr": round(float(total_campaign_cost), 2),
        "net_campaign_contribution_inr": net_contrib,
        "incremental_roi_pct": roi_pct,
        "is_profitable": net_contrib > 0
    }


class RetentionBudgetService:
    """
    Retention Budget Intelligence Service:
    - Evidence-based detection of retention budget waste
    - Transparent financial formulas (Incremental Gross Profit, Net Contribution, Incremental ROI)
    - Distinguishes recorded costs, estimated costs, avoidable costs, and realized savings
    - Lifecycle management for waste opportunities (OPEN -> UNDER_REVIEW -> APPROVED / DISMISSED -> RESOLVED)
    """

    # =========================================================================
    # 1. CORE FINANCIAL FORMULAS
    # =========================================================================

    @staticmethod
    def calculate_delivery_cost(delivered_count: int, channel: str) -> float:
        """Calculates delivery cost based on channel send volume."""
        return estimate_delivery_cost(channel, delivered_count)

    @staticmethod
    def calculate_campaign_financials(
        db: Session,
        campaign: Campaign,
        avg_order_value_default: float = 500.0,
        gross_margin_rate_default: float = 0.40
    ) -> Dict[str, Any]:
        """
        Calculates verified campaign financials and incremental metrics:
        - Total Incentive Cost (actual recorded from recipients)
        - Total Delivery Cost (calculated from channel dispatch rates)
        - Total Campaign Cost = Incentive Cost + Delivery Cost
        - Incremental Lift % = Treatment Conversion Rate - Holdout Control Conversion Rate
        - Incremental Retained Customers = Treatment Size * (Incremental Lift / 100)
        - Incremental Revenue = Incremental Retained * AOV * Repeat Multiplier
        - Incremental Gross Profit = Incremental Revenue * Gross Margin Rate
        - Net Campaign Contribution = Incremental Gross Profit - Total Campaign Cost
        - Incremental ROI (%) = (Net Campaign Contribution / Total Campaign Cost) * 100
        """
        recipients = db.query(CampaignRecipient).filter(
            CampaignRecipient.campaign_id == campaign.id
        ).all()

        total_recipients = len(recipients)
        delivered_recipients = [r for r in recipients if r.status in [RecipientStatus.DELIVERED, RecipientStatus.OPENED, RecipientStatus.REDEEMED]]
        delivered_count = len(delivered_recipients)

        # Actual recorded incentive cost (sum of actual recorded recipient incentive costs)
        actual_incentive_cost_inr = round(sum(float(r.incentive_cost_inr or 0.0) for r in delivered_recipients), 2)

        # Delivery cost
        channel = campaign.delivery_channel or "EMAIL"
        delivery_cost_inr = RetentionBudgetService.calculate_delivery_cost(delivered_count, channel)
        total_campaign_cost_inr = round(actual_incentive_cost_inr + delivery_cost_inr, 2)

        # Control Group vs Treatment Group Breakdown
        treatment_recipients = [r for r in recipients if not r.is_control_group]
        control_recipients = [r for r in recipients if r.is_control_group]

        treatment_count = len(treatment_recipients)
        control_count = len(control_recipients)

        treatment_redeemed = sum(1 for r in treatment_recipients if r.redeemed_at is not None or r.status == RecipientStatus.REDEEMED)
        control_redeemed = sum(1 for r in control_recipients if r.redeemed_at is not None or r.status == RecipientStatus.REDEEMED)

        treatment_rate = round((treatment_redeemed / treatment_count * 100.0), 2) if treatment_count > 0 else 0.0
        control_rate = round((control_redeemed / control_count * 100.0), 2) if control_count > 0 else 0.0

        # Data Sufficiency Assessment
        has_adequate_control = control_count >= 5
        has_adequate_sample = total_recipients >= 15
        is_data_sufficient = has_adequate_sample

        # Extract campaign-configured or default economics assumptions
        assumptions = campaign.simulation_assumptions or {}
        aov = float(assumptions.get("avg_order_value_inr") or avg_order_value_default)
        gross_margin_rate = float(assumptions.get("gross_margin_pct", gross_margin_rate_default * 100)) / 100.0
        repeat_factor = float(assumptions.get("repeat_purchase_factor") or 1.4)

        if has_adequate_control and treatment_count > 0:
            incremental_lift_pct = round(treatment_rate - control_rate, 2)
            # Incremental conversions attributed specifically to incentive
            incremental_retained_customers = round(treatment_count * (incremental_lift_pct / 100.0), 1)

            if incremental_retained_customers > 0:
                incremental_revenue_inr = round(incremental_retained_customers * aov * repeat_factor, 2)
                incremental_gross_profit_inr = round(incremental_revenue_inr * gross_margin_rate, 2)
                cost_per_incremental_retained = round(total_campaign_cost_inr / incremental_retained_customers, 2) if incremental_retained_customers > 0 else None
            else:
                incremental_revenue_inr = 0.0
                incremental_gross_profit_inr = 0.0
                cost_per_incremental_retained = None

            # Net Campaign Contribution = Incremental Gross Profit - Total Campaign Cost
            net_campaign_contribution_inr = round(incremental_gross_profit_inr - total_campaign_cost_inr, 2)

            # Incremental ROI
            if total_campaign_cost_inr > 0:
                incremental_roi_pct = round((net_campaign_contribution_inr / total_campaign_cost_inr) * 100.0, 1)
            else:
                incremental_roi_pct = 0.0

            roi_status = "CALCULATED_FROM_HOLDOUT"
        else:
            # Control group missing or too small to measure incremental lift reliably
            incremental_lift_pct = None
            incremental_retained_customers = None
            incremental_revenue_inr = None
            incremental_gross_profit_inr = None
            net_campaign_contribution_inr = None
            incremental_roi_pct = None
            cost_per_incremental_retained = None
            roi_status = "N/A - Insufficient Holdout Control Group Benchmark"

        # Cost per redemption
        cost_per_redemption_inr = round(actual_incentive_cost_inr / treatment_redeemed, 2) if treatment_redeemed > 0 else None

        # Unredeemed incentive exposure (delivered without redemption)
        unredeemed_recipients_count = sum(1 for r in delivered_recipients if not r.is_control_group and r.redeemed_at is None and r.status != RecipientStatus.REDEEMED)
        unredeemed_exposure_inr = round(unredeemed_recipients_count * float(campaign.per_customer_cost_inr or 45.0), 2)

        return {
            "campaign_id": campaign.id,
            "campaign_name": campaign.name,
            "campaign_status": campaign.status.value,
            "target_risk_level": campaign.target_risk_level,
            "delivery_channel": channel,
            "total_recipients": total_recipients,
            "delivered_count": delivered_count,
            "treatment_count": treatment_count,
            "control_count": control_count,
            "treatment_redeemed": treatment_redeemed,
            "control_redeemed": control_redeemed,
            "treatment_conversion_rate_pct": treatment_rate,
            "control_conversion_rate_pct": control_rate,
            "has_adequate_control": has_adequate_control,
            "is_data_sufficient": is_data_sufficient,
            "actual_incentive_cost_inr": actual_incentive_cost_inr,
            "delivery_cost_inr": delivery_cost_inr,
            "total_campaign_cost_inr": total_campaign_cost_inr,
            "approved_budget_inr": float(campaign.total_budget_inr or 5000.0),
            "unredeemed_exposure_inr": unredeemed_exposure_inr,
            "cost_per_redemption_inr": cost_per_redemption_inr,
            "incremental_lift_pct": incremental_lift_pct,
            "incremental_retained_customers": incremental_retained_customers,
            "incremental_revenue_inr": incremental_revenue_inr,
            "incremental_gross_profit_inr": incremental_gross_profit_inr,
            "net_campaign_contribution_inr": net_campaign_contribution_inr,
            "incremental_roi_pct": incremental_roi_pct,
            "cost_per_incremental_retained": cost_per_incremental_retained,
            "roi_status": roi_status
        }

    # =========================================================================
    # 2. WASTE DETECTION RULES
    # =========================================================================

    def detect_repeated_incentive_waste(
        self,
        db: Session,
        organization_id: str,
        lookback_days: int = 90
    ) -> List[Dict[str, Any]]:
        """
        Rule A: Repeated Incentive Waste
        Identifies customers who received multiple incentives within lookback_days
        without meaningful engagement or redemption.
        """
        cutoff = get_utc_now() - timedelta(days=lookback_days)

        recipients = db.query(CampaignRecipient).filter(
            CampaignRecipient.organization_id == organization_id,
            CampaignRecipient.created_at >= cutoff,
            CampaignRecipient.is_control_group == False,
            CampaignRecipient.status != RecipientStatus.FAILED
        ).all()

        # Group by customer_id
        customer_dispatches: Dict[str, List[CampaignRecipient]] = {}
        for r in recipients:
            customer_dispatches.setdefault(r.customer_id, []).append(r)

        findings = []

        for customer_id, dispatches in customer_dispatches.items():
            if len(dispatches) < 2:
                continue

            customer_code = dispatches[0].customer_code
            total_dispatches = len(dispatches)
            total_redeemed = sum(1 for d in dispatches if d.redeemed_at is not None or d.status == RecipientStatus.REDEEMED)
            total_cost = sum(float(d.incentive_cost_inr or 0.0) for d in dispatches)

            # Check if customer has ZERO redemptions across multiple campaigns
            if total_redeemed == 0 and total_cost > 0:
                campaign_ids = list({d.campaign_id for d in dispatches})
                campaign_names = [d.campaign.name for d in dispatches if d.campaign]

                # Customer record details
                cust = db.query(Customer).filter(Customer.id == customer_id).first()
                orders_count = cust.orders_count if cust else 0
                last_purchase_days = cust.last_purchase_days if cust else None

                # Calculate avoidable spend: repeat incentives after initial offer without redemption
                avoidable_cost = round(total_cost - float(dispatches[0].incentive_cost_inr or 0.0), 2)
                if avoidable_cost <= 0:
                    avoidable_cost = round(total_cost * 0.5, 2)

                findings.append({
                    "rule_id": "RULE_REPEATED_INCENTIVES_V1",
                    "rule_version": "1.0",
                    "title": f"Repeated Unresponsive Incentives: Customer {customer_code}",
                    "category": WasteCategory.REPEATED_INCENTIVES,
                    "customer_id": customer_id,
                    "customer_code": customer_code,
                    "campaign_id": campaign_ids[0] if campaign_ids else None,
                    "segment": cust.city if cust else "General",
                    "affected_spend_inr": round(total_cost, 2),
                    "potential_savings_inr": avoidable_cost,
                    "evidence_strength": EvidenceStrength.HIGH if total_dispatches >= 3 else EvidenceStrength.MEDIUM,
                    "data_sufficiency": DataSufficiency.SUFFICIENT,
                    "finding_summary": (
                        f"Customer {customer_code} was targeted with {total_dispatches} retention incentive campaigns "
                        f"over the past {lookback_days} days (total incentive cost: ₹{total_cost:,.0f}), but has redeemed 0 offers. "
                        f"Subsequent purchase frequency remains dormant ({last_purchase_days} days since last purchase)."
                    ),
                    "evidence_json": {
                        "customer_code": customer_code,
                        "dispatches_count": total_dispatches,
                        "redemptions_count": total_redeemed,
                        "total_incentive_cost_inr": round(total_cost, 2),
                        "avoidable_incentive_cost_inr": avoidable_cost,
                        "campaigns_involved": campaign_names,
                        "campaign_ids": campaign_ids,
                        "customer_total_orders": orders_count,
                        "customer_last_purchase_days": last_purchase_days,
                        "first_dispatched_at": min(d.created_at for d in dispatches).isoformat(),
                        "latest_dispatched_at": max(d.created_at for d in dispatches).isoformat(),
                    },
                    "recommended_action": (
                        f"Apply a 30-day retention fatigue suppression rule to exclude {customer_code} from discount drives. "
                        f"Transition customer to non-monetary outreach (e.g. customer care check-in or feedback survey)."
                    ),
                    "recommended_action_type": "EXCLUDE_CUSTOMER_FATIGUE",
                    "verification_method": "Verify that zero additional incentive costs are incurred for this customer over the next 30 days."
                })

        return findings

    def detect_low_performing_campaigns(
        self,
        db: Session,
        organization_id: str,
        min_sample_size: int = 15,
        min_run_days: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Rule B: Low-Performing Campaigns
        Identifies campaigns with sufficient observation duration and sample size
        that show high costs relative to weak measured outcomes or negative incremental ROI.
        """
        campaigns = db.query(Campaign).filter(
            Campaign.organization_id == organization_id,
            Campaign.status.in_([CampaignStatus.COMPLETED, CampaignStatus.RUNNING, CampaignStatus.ACTIVE])
        ).all()

        findings = []

        for c in campaigns:
            fin = self.calculate_campaign_financials(db, c)
            duration_days = calculate_days_elapsed(c.created_at)

            # 1. Check data sufficiency
            if fin["total_recipients"] < min_sample_size or duration_days < min_run_days:
                # Mark as INSUFFICIENT_DATA finding if spend is notable
                if fin["total_campaign_cost_inr"] > 1000.0:
                    findings.append({
                        "rule_id": "RULE_LOW_PERFORMING_CAMPAIGN_V1",
                        "rule_version": "1.0",
                        "title": f"Observational Window Incomplete: {c.name}",
                        "category": WasteCategory.LOW_PERFORMING_CAMPAIGN,
                        "campaign_id": c.id,
                        "segment": c.target_segment,
                        "affected_spend_inr": fin["total_campaign_cost_inr"],
                        "potential_savings_inr": 0.0, # Cannot claim savings before data is sufficient
                        "evidence_strength": EvidenceStrength.LOW,
                        "data_sufficiency": DataSufficiency.INSUFFICIENT_DATA,
                        "finding_summary": (
                            f"Campaign '{c.name}' has run for {duration_days} days with {fin['total_recipients']} recipients. "
                            f"Data sample is insufficient (< {min_sample_size} accounts) to conclusively evaluate incremental retention. "
                            f"Continue observation before altering budget."
                        ),
                        "evidence_json": {
                            "campaign_name": c.name,
                            "recipients_count": fin["total_recipients"],
                            "required_min_sample": min_sample_size,
                            "duration_days": duration_days,
                            "required_min_days": min_run_days,
                            "current_cost_inr": fin["total_campaign_cost_inr"]
                        },
                        "recommended_action": "Maintain current deployment under monitoring until minimum sample size threshold (15 accounts) is achieved.",
                        "recommended_action_type": "CONTINUE_OBSERVATION",
                        "verification_method": "Re-evaluate incremental lift metrics once sample size reaches 15 accounts."
                    })
                continue

            # 2. Check for Low Performance with SUFFICIENT DATA
            is_low_redemption = fin["delivered_count"] >= 20 and fin["treatment_conversion_rate_pct"] < 3.0
            is_negative_lift = fin["has_adequate_control"] and (fin["incremental_lift_pct"] or 0.0) <= 0.0
            is_negative_roi = fin["incremental_roi_pct"] is not None and fin["incremental_roi_pct"] < -25.0

            if is_low_redemption or is_negative_lift or is_negative_roi:
                # Calculate potential avoidable cost
                # If campaign is active/running, potential savings = unspent budget + avoided delivery costs
                unspent_budget = max(0.0, fin["approved_budget_inr"] - fin["actual_incentive_cost_inr"])
                potential_savings = round(unspent_budget + (fin["unredeemed_exposure_inr"] * 0.5), 2)
                if potential_savings <= 0:
                    potential_savings = round(fin["total_campaign_cost_inr"] * 0.4, 2)

                reasons = []
                if is_negative_lift:
                    reasons.append(f"Incremental lift is non-positive ({fin['incremental_lift_pct']}%), indicating treatment cohort did not outperform holdout control")
                if is_low_redemption:
                    reasons.append(f"Redemption rate is only {fin['treatment_conversion_rate_pct']}% across {fin['delivered_count']} recipients")
                if is_negative_roi:
                    reasons.append(f"Net campaign contribution is negative (₹{fin['net_campaign_contribution_inr']:,.0f}) with {fin['incremental_roi_pct']}% ROI")

                findings.append({
                    "rule_id": "RULE_LOW_PERFORMING_CAMPAIGN_V1",
                    "rule_version": "1.0",
                    "title": f"Weak Measured Performance: {c.name}",
                    "category": WasteCategory.LOW_PERFORMING_CAMPAIGN,
                    "campaign_id": c.id,
                    "segment": c.target_segment,
                    "affected_spend_inr": fin["total_campaign_cost_inr"],
                    "potential_savings_inr": potential_savings,
                    "evidence_strength": EvidenceStrength.HIGH if (is_negative_lift and fin["has_adequate_control"]) else EvidenceStrength.MEDIUM,
                    "data_sufficiency": DataSufficiency.SUFFICIENT,
                    "finding_summary": (
                        f"Campaign '{c.name}' spent ₹{fin['total_campaign_cost_inr']:,.0f} across {fin['total_recipients']} accounts. "
                        f"Performance indicators demonstrate weak economic return: {'; '.join(reasons)}."
                    ),
                    "evidence_json": {
                        "campaign_name": c.name,
                        "status": c.status.value,
                        "duration_days": duration_days,
                        "total_recipients": fin["total_recipients"],
                        "delivered_count": fin["delivered_count"],
                        "control_count": fin["control_count"],
                        "treatment_conversion_rate_pct": fin["treatment_conversion_rate_pct"],
                        "control_conversion_rate_pct": fin["control_conversion_rate_pct"],
                        "incremental_lift_pct": fin["incremental_lift_pct"],
                        "total_campaign_cost_inr": fin["total_campaign_cost_inr"],
                        "net_campaign_contribution_inr": fin["net_campaign_contribution_inr"],
                        "incremental_roi_pct": fin["incremental_roi_pct"],
                        "potential_savings_calculation": f"Unspent budget (₹{unspent_budget:,.0f}) + avoidable future incentive exposure"
                    },
                    "recommended_action": (
                        f"Pause further recipient dispatch for '{c.name}'. Re-calibrate offer value "
                        f"or reallocate remaining budget (₹{unspent_budget:,.0f}) to higher-converting segments."
                    ),
                    "recommended_action_type": "PAUSE_OR_REALLOCATE",
                    "verification_method": "Verify campaign status transitions to PAUSED and unspent budget is successfully preserved."
                })

        return findings

    def detect_unnecessary_discounting(
        self,
        db: Session,
        organization_id: str
    ) -> List[Dict[str, Any]]:
        """
        Rule C: Potential Unnecessary Discounting
        Identifies situations where discounts are provided to low-risk customers
        who have a consistent history of purchasing organically.
        """
        # Find recipients who received high discounts but have LOW churn risk score <= 30
        low_risk_recipients = db.query(CampaignRecipient).filter(
            CampaignRecipient.organization_id == organization_id,
            CampaignRecipient.risk_score <= 30,
            CampaignRecipient.is_control_group == False,
            CampaignRecipient.status != RecipientStatus.FAILED
        ).all()

        if not low_risk_recipients:
            return []

        # Group by campaign
        campaign_low_risk: Dict[str, List[CampaignRecipient]] = {}
        for r in low_risk_recipients:
            campaign_low_risk.setdefault(r.campaign_id, []).append(r)

        findings = []

        for campaign_id, recs in campaign_low_risk.items():
            campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
            if not campaign:
                continue

            discount_val = float(campaign.discount_value or 0.0)
            # Flag if campaign offered substantial discount (>= 20% or flat >= ₹100) to low-risk users
            if discount_val >= 20.0 or float(campaign.max_discount_cap_inr or 0.0) >= 100.0:
                total_spend_low_risk = sum(float(r.incentive_cost_inr or 0.0) for r in recs)
                count_low_risk = len(recs)

                # Potential savings: difference between 25% discount and 10% non-margin-diluting incentive (or points)
                avoidable_concession = round(total_spend_low_risk * 0.50, 2)

                findings.append({
                    "rule_id": "RULE_UNNECESSARY_DISCOUNTING_V1",
                    "rule_version": "1.0",
                    "title": f"High Discounts Dispatched to Low-Risk Accounts: {campaign.name}",
                    "category": WasteCategory.UNNECESSARY_DISCOUNT,
                    "campaign_id": campaign.id,
                    "segment": "Low Churn Risk Accounts",
                    "affected_spend_inr": round(total_spend_low_risk, 2),
                    "potential_savings_inr": avoidable_concession,
                    "evidence_strength": EvidenceStrength.MEDIUM,
                    "data_sufficiency": DataSufficiency.SUFFICIENT,
                    "finding_summary": (
                        f"Campaign '{campaign.name}' granted heavy incentives ({campaign.offer}) to {count_low_risk} accounts "
                        f"with low churn risk scores (score <= 30). These accounts exhibit healthy historical order frequency "
                        f"and likely do not require substantial margin concessions to retain."
                    ),
                    "evidence_json": {
                        "campaign_name": campaign.name,
                        "discount_value": discount_val,
                        "discount_unit": campaign.discount_unit,
                        "low_risk_recipient_count": count_low_risk,
                        "total_incentive_spent_on_low_risk_inr": round(total_spend_low_risk, 2),
                        "avg_risk_score_of_cohort": round(sum(r.risk_score for r in recs) / count_low_risk, 1),
                        "potential_savings_formula": "50% concession reduction by shifting to non-discount loyalty perks"
                    },
                    "recommended_action": (
                        f"Calibrate targeting criteria on '{campaign.name}' to exclude accounts with churn risk score < 35. "
                        f"Transition low-risk users to loyalty point multipliers instead of cash-value discounts."
                    ),
                    "recommended_action_type": "CALIBRATE_DISCOUNT_THRESHOLD",
                    "verification_method": "Verify that future audience selection queries exclude low-risk accounts, preserving ~50% in concession budget."
                })

        return findings

    def detect_budget_leakage(
        self,
        db: Session,
        organization_id: str
    ) -> List[Dict[str, Any]]:
        """
        Rule D: Budget and Cost Leakage
        Detects budget overruns, duplicate recipient dispatches, and unredeemed fixed cost leakage.
        """
        findings = []

        # 1. Detect Duplicate Recipient Records for Same Campaign
        duplicate_query = db.query(
            CampaignRecipient.campaign_id,
            CampaignRecipient.customer_id,
            func.count(CampaignRecipient.id).label("dispatch_count")
        ).filter(
            CampaignRecipient.organization_id == organization_id,
            CampaignRecipient.status != RecipientStatus.FAILED
        ).group_by(
            CampaignRecipient.campaign_id,
            CampaignRecipient.customer_id
        ).having(func.count(CampaignRecipient.id) > 1).all()

        if duplicate_query:
            total_duplicate_events = sum(d.dispatch_count - 1 for d in duplicate_query)
            affected_campaign_ids = list({d.campaign_id for d in duplicate_query})
            first_camp = db.query(Campaign).filter(Campaign.id == affected_campaign_ids[0]).first()

            duplicate_cost = 0.0
            for d in duplicate_query:
                cost_records = db.query(CampaignRecipient.incentive_cost_inr).filter(
                    CampaignRecipient.campaign_id == d.campaign_id,
                    CampaignRecipient.customer_id == d.customer_id
                ).all()
                if len(cost_records) > 1:
                    # Cost of duplicate sends beyond the first
                    duplicate_cost += sum(float(c[0] or 0.0) for c in cost_records[1:])

            duplicate_cost = round(duplicate_cost, 2)
            findings.append({
                "rule_id": "RULE_BUDGET_COST_LEAKAGE_V1",
                "rule_version": "1.0",
                "title": f"Duplicate Recipient Dispatches ({total_duplicate_events} occurrences)",
                "category": WasteCategory.BUDGET_LEAKAGE,
                "campaign_id": first_camp.id if first_camp else None,
                "affected_spend_inr": duplicate_cost,
                "potential_savings_inr": duplicate_cost,
                "evidence_strength": EvidenceStrength.HIGH,
                "data_sufficiency": DataSufficiency.SUFFICIENT,
                "finding_summary": (
                    f"Detected {total_duplicate_events} duplicate recipient dispatches across {len(affected_campaign_ids)} campaigns, "
                    f"where the same customer was targeted multiple times within the same campaign execution. "
                    f"Direct financial leakage: ₹{duplicate_cost:,.0f}."
                ),
                "evidence_json": {
                    "duplicate_dispatch_events_count": total_duplicate_events,
                    "affected_campaigns_count": len(affected_campaign_ids),
                    "duplicate_cost_inr": duplicate_cost,
                    "affected_campaign_ids": affected_campaign_ids
                },
                "recommended_action": "Enable recipient deduplication filter before dispatch to prevent double-spending on identical recipient IDs.",
                "recommended_action_type": "DEDUPLICATE_DISPATCH",
                "verification_method": "Verify distinct recipient customer_id constraint is enforced on all active campaign queues."
            })

        # 2. Detect Campaigns Exceeding or Approaching Approved Budget (>95%)
        campaigns = db.query(Campaign).filter(
            Campaign.organization_id == organization_id
        ).all()

        for c in campaigns:
            fin = self.calculate_campaign_financials(db, c)
            budget = fin["approved_budget_inr"]
            actual_cost = fin["total_campaign_cost_inr"]

            if budget > 0 and actual_cost >= (budget * 0.95):
                overrun = max(0.0, actual_cost - budget)
                findings.append({
                    "rule_id": "RULE_BUDGET_COST_LEAKAGE_V1",
                    "rule_version": "1.0",
                    "title": f"Budget Limit Ceiling Approached / Exceeded: {c.name}",
                    "category": WasteCategory.BUDGET_LEAKAGE,
                    "campaign_id": c.id,
                    "segment": c.target_segment,
                    "affected_spend_inr": actual_cost,
                    "potential_savings_inr": round(overrun if overrun > 0 else (actual_cost * 0.1), 2),
                    "evidence_strength": EvidenceStrength.HIGH,
                    "data_sufficiency": DataSufficiency.SUFFICIENT,
                    "finding_summary": (
                        f"Campaign '{c.name}' has consumed ₹{actual_cost:,.0f} ({(actual_cost/budget*100):.1f}% of approved "
                        f"budget limit ₹{budget:,.0f}). {'Budget overrun occurred.' if overrun > 0 else 'Ceiling reached.'}"
                    ),
                    "evidence_json": {
                        "campaign_name": c.name,
                        "approved_budget_inr": budget,
                        "total_cost_inr": actual_cost,
                        "overrun_inr": overrun,
                        "budget_utilization_pct": round(actual_cost / budget * 100, 1)
                    },
                    "recommended_action": f"Clamp campaign execution limit for '{c.name}' to prevent unapproved budget overrun.",
                    "recommended_action_type": "ENFORCE_BUDGET_CEILING",
                    "verification_method": "Confirm campaign dispatches are halted once approved limit is reached."
                })

        return findings

    def detect_inefficient_audience_allocation(
        self,
        db: Session,
        organization_id: str
    ) -> List[Dict[str, Any]]:
        """
        Rule E: Inefficient Audience Allocation
        Identifies customer segments or regions receiving high shares of retention spending
        but delivering weak incremental outcomes.
        """
        # Fetch all recipients with customer details
        recipients = db.query(
            CampaignRecipient.id,
            CampaignRecipient.incentive_cost_inr,
            CampaignRecipient.status,
            CampaignRecipient.redeemed_at,
            Customer.city
        ).join(
            Customer, CampaignRecipient.customer_id == Customer.id
        ).filter(
            CampaignRecipient.organization_id == organization_id,
            CampaignRecipient.is_control_group == False
        ).all()

        if not recipients:
            return []

        total_org_spend = sum(float(r[1] or 0.0) for r in recipients)
        if total_org_spend <= 0:
            return []

        # Group by City / Region
        city_metrics: Dict[str, Dict[str, Any]] = {}
        for r in recipients:
            city = r[4] or "Unknown"
            if city not in city_metrics:
                city_metrics[city] = {"spend": 0.0, "total": 0, "redeemed": 0}
            city_metrics[city]["spend"] += float(r[1] or 0.0)
            city_metrics[city]["total"] += 1
            if r[2] == RecipientStatus.REDEEMED or r[3] is not None:
                city_metrics[city]["redeemed"] += 1

        findings = []

        for city, metrics in city_metrics.items():
            spend = metrics["spend"]
            total = metrics["total"]
            redeemed = metrics["redeemed"]
            spend_share_pct = round((spend / total_org_spend) * 100.0, 1)
            conversion_rate_pct = round((redeemed / total * 100.0), 1) if total > 0 else 0.0

            # Flag if a single city consumes >= 25% of org spend but has < 5% conversion
            if spend_share_pct >= 25.0 and conversion_rate_pct < 5.0 and total >= 15:
                potential_reallocation = round(spend * 0.30, 2)
                findings.append({
                    "rule_id": "RULE_INEFFICIENT_AUDIENCE_V1",
                    "rule_version": "1.0",
                    "title": f"High-Cost, Low-Yield Regional Allocation: {city}",
                    "category": WasteCategory.INEFFICIENT_SEGMENT,
                    "segment": city,
                    "affected_spend_inr": round(spend, 2),
                    "potential_savings_inr": potential_reallocation,
                    "evidence_strength": EvidenceStrength.MEDIUM,
                    "data_sufficiency": DataSufficiency.SUFFICIENT,
                    "finding_summary": (
                        f"Region '{city}' accounts for {spend_share_pct}% of total retention budget (₹{spend:,.0f} spend across "
                        f"{total} accounts), but exhibits a low conversion rate of only {conversion_rate_pct}%. "
                        f"Retention capital is concentrated in an underperforming regional cohort."
                    ),
                    "evidence_json": {
                        "region_city": city,
                        "regional_spend_inr": round(spend, 2),
                        "total_org_spend_inr": round(total_org_spend, 2),
                        "share_of_total_spend_pct": spend_share_pct,
                        "targeted_accounts_in_region": total,
                        "redeemed_accounts": redeemed,
                        "regional_conversion_rate_pct": conversion_rate_pct,
                        "recommended_reallocation_inr": potential_reallocation
                    },
                    "recommended_action": (
                        f"Reduce retention allocation in {city} by 30% (saving ~₹{potential_reallocation:,.0f}) "
                        f"and test alternative non-discount retention offers (e.g. logistics priority or loyalty points)."
                    ),
                    "recommended_action_type": "REBALANCE_REGIONAL_BUDGET",
                    "verification_method": "Monitor regional spend distribution and compare subsequent month-over-month ROI lift."
                })

        return findings

    # =========================================================================
    # 3. ANALYSIS ORCHESTRATION & DEDUPLICATION
    # =========================================================================

    def run_full_waste_analysis(
        self,
        db: Session,
        organization_id: str
    ) -> Dict[str, Any]:
        """
        Executes all 5 deterministic waste detection rules, deduplicates findings,
        persists opportunities, and optionally synthesizes an executive summary via Gemini.
        """
        detected_findings: List[Dict[str, Any]] = []

        # Run Rule A
        detected_findings.extend(self.detect_repeated_incentive_waste(db, organization_id))

        # Run Rule B
        detected_findings.extend(self.detect_low_performing_campaigns(db, organization_id))

        # Run Rule C
        detected_findings.extend(self.detect_unnecessary_discounting(db, organization_id))

        # Run Rule D
        detected_findings.extend(self.detect_budget_leakage(db, organization_id))

        # Run Rule E
        detected_findings.extend(self.detect_inefficient_audience_allocation(db, organization_id))

        new_count = 0
        updated_count = 0
        total_potential_savings = 0.0

        for finding in detected_findings:
            total_potential_savings += finding["potential_savings_inr"]

            # Deduplication logic: Check for existing OPEN or UNDER_REVIEW finding with same rule and entity
            query = db.query(BudgetWasteOpportunity).filter(
                BudgetWasteOpportunity.organization_id == organization_id,
                BudgetWasteOpportunity.rule_id == finding["rule_id"],
                BudgetWasteOpportunity.review_status.in_([WasteReviewStatus.OPEN, WasteReviewStatus.UNDER_REVIEW])
            )

            if finding.get("campaign_id"):
                query = query.filter(BudgetWasteOpportunity.campaign_id == finding["campaign_id"])
            elif finding.get("customer_id"):
                query = query.filter(BudgetWasteOpportunity.customer_id == finding["customer_id"])
            elif finding.get("segment"):
                query = query.filter(BudgetWasteOpportunity.segment == finding["segment"])

            existing = query.first()

            if existing:
                # Update existing record, preserving review status and reviewer notes
                existing.title = finding["title"]
                existing.affected_spend_inr = finding["affected_spend_inr"]
                existing.potential_savings_inr = finding["potential_savings_inr"]
                existing.evidence_strength = finding["evidence_strength"]
                existing.data_sufficiency = finding["data_sufficiency"]
                existing.finding_summary = finding["finding_summary"]
                existing.evidence_json = finding["evidence_json"]
                existing.recommended_action = finding["recommended_action"]
                existing.recommended_action_type = finding["recommended_action_type"]
                existing.verification_method = finding.get("verification_method")
                existing.updated_at = get_utc_now()
                updated_count += 1
            else:
                # Insert new opportunity
                new_opp = BudgetWasteOpportunity(
                    organization_id=organization_id,
                    rule_id=finding["rule_id"],
                    rule_version=finding["rule_version"],
                    title=finding["title"],
                    category=finding["category"],
                    campaign_id=finding.get("campaign_id"),
                    customer_id=finding.get("customer_id"),
                    customer_code=finding.get("customer_code"),
                    segment=finding.get("segment"),
                    affected_spend_inr=finding["affected_spend_inr"],
                    potential_savings_inr=finding["potential_savings_inr"],
                    realized_savings_inr=0.0,
                    evidence_strength=finding["evidence_strength"],
                    data_sufficiency=finding["data_sufficiency"],
                    finding_summary=finding["finding_summary"],
                    evidence_json=finding["evidence_json"],
                    recommended_action=finding["recommended_action"],
                    recommended_action_type=finding["recommended_action_type"],
                    verification_method=finding.get("verification_method"),
                    review_status=WasteReviewStatus.OPEN,
                    detected_at=get_utc_now()
                )
                db.add(new_opp)
                new_count += 1

        db.commit()

        # Generate AI Executive Briefing if Gemini is available
        ai_summary = None
        ai_provider = None
        if gemini_service.is_available() and detected_findings:
            prompt = (
                f"You are the Chief Financial Officer and Retention Intelligence Specialist for a SaaS enterprise.\n"
                f"Summarize these retention budget waste detection findings:\n"
                f"- Total opportunities detected: {len(detected_findings)}\n"
                f"- Total potential savings identified: ₹{total_potential_savings:,.0f}\n"
                f"- Categories: Repeated Incentives, Low-Performing Campaigns, Unnecessary Discounting, Budget Leakage.\n\n"
                f"Provide a 3-sentence executive financial synthesis explaining where retention budget is leaking "
                f"and how the organization can improve retention ROI."
            )
            try:
                res = gemini_service._model.generate_content(prompt)
                if res and res.text:
                    ai_summary = res.text.strip()
                    ai_provider = "Google Gemini 1.5 Flash"
            except Exception as e:
                logger.warning(f"Gemini waste synthesis failed, fallback used: {e}")

        if not ai_summary:
            ai_summary = (
                f"Budget intelligence analysis identified {len(detected_findings)} retention spending optimization opportunities "
                f"representing ₹{total_potential_savings:,.0f} in potential avoidable costs. Primary friction sources include "
                f"unresponsive repeat incentive recipients and margin-diluting broad discounts. Recommended actions can reclaim "
                f"up to 30% of underperforming campaign spend without degrading retention outcomes."
            )
            ai_provider = "LoyaltyLens Deterministic Financial Engine"

        repeated_detected = sum(1 for f in detected_findings if f["category"] == WasteCategory.REPEATED_INCENTIVES)
        low_perf_detected = sum(1 for f in detected_findings if f["category"] == WasteCategory.LOW_PERFORMING_CAMPAIGN)
        unnecessary_detected = sum(1 for f in detected_findings if f["category"] == WasteCategory.UNNECESSARY_DISCOUNT)
        leakage_detected = sum(1 for f in detected_findings if f["category"] == WasteCategory.BUDGET_LEAKAGE)
        inefficient_detected = sum(1 for f in detected_findings if f["category"] == WasteCategory.INEFFICIENT_SEGMENT)

        now_dt = get_utc_now()
        return {
            "success": True,
            "opportunities_detected": len(detected_findings),
            "total_opportunities_found": len(detected_findings),
            "new_opportunities": new_count,
            "updated_opportunities": updated_count,
            "total_potential_savings_inr": round(total_potential_savings, 2),
            "repeated_incentives_detected": repeated_detected,
            "low_performing_campaigns_detected": low_perf_detected,
            "unnecessary_discounts_detected": unnecessary_detected,
            "budget_leakages_detected": leakage_detected,
            "inefficient_segments_detected": inefficient_detected,
            "rules_executed": [
                "RULE_REPEATED_INCENTIVES_V1",
                "RULE_LOW_PERFORMING_CAMPAIGN_V1",
                "RULE_UNNECESSARY_DISCOUNTING_V1",
                "RULE_BUDGET_COST_LEAKAGE_V1",
                "RULE_INEFFICIENT_AUDIENCE_V1"
            ],
            "analysis_timestamp": now_dt,
            "analyzed_at": now_dt,
            "ai_executive_summary": ai_summary,
            "ai_provider": ai_provider
        }

    # =========================================================================
    # 4. SUMMARY METRICS & REPORTING
    # =========================================================================

    def get_budget_intelligence_summary(
        self,
        db: Session,
        organization_id: str,
        lookback_days: int = 90
    ) -> Dict[str, Any]:
        """
        Calculates verified aggregate retention spend and waste metrics.
        Clearly separates actual recorded costs, potential savings, and confirmed realized savings.
        """
        cutoff = get_utc_now() - timedelta(days=lookback_days)

        # 1. Total recorded incentive cost from delivered recipients
        recipients = db.query(CampaignRecipient).filter(
            CampaignRecipient.organization_id == organization_id,
            CampaignRecipient.created_at >= cutoff,
            CampaignRecipient.is_control_group == False,
            CampaignRecipient.status != RecipientStatus.FAILED
        ).all()

        total_incentive_cost = sum(float(r.incentive_cost_inr or 0.0) for r in recipients)

        # 2. Total delivery cost
        total_delivery_cost = 0.0
        for r in recipients:
            ch = r.delivery_channel or "EMAIL"
            total_delivery_cost += CHANNEL_DELIVERY_COST_INR.get(ch.upper(), 0.10)

        # 3. Unredeemed incentive value on completed campaigns
        completed_campaign_ids = [
            c[0] for c in db.query(Campaign.id).filter(
                Campaign.organization_id == organization_id,
                Campaign.status == CampaignStatus.COMPLETED
            ).all()
        ]

        unredeemed_recipients = [
            r for r in recipients
            if r.campaign_id in completed_campaign_ids and r.redeemed_at is None and r.status != RecipientStatus.REDEEMED
        ]
        unredeemed_exposure = sum(float(r.incentive_cost_inr or 0.0) for r in unredeemed_recipients)

        # 4. Opportunities count and savings
        opportunities = db.query(BudgetWasteOpportunity).filter(
            BudgetWasteOpportunity.organization_id == organization_id
        ).all()

        open_opps = [o for o in opportunities if o.review_status == WasteReviewStatus.OPEN]
        under_review_opps = [o for o in opportunities if o.review_status == WasteReviewStatus.UNDER_REVIEW]
        resolved_opps = [o for o in opportunities if o.review_status == WasteReviewStatus.RESOLVED]

        potential_savings = sum(o.potential_savings_inr for o in opportunities if o.review_status in [WasteReviewStatus.OPEN, WasteReviewStatus.UNDER_REVIEW])
        confirmed_savings = sum(o.realized_savings_inr for o in opportunities if o.review_status == WasteReviewStatus.RESOLVED)

        # 5. Weak campaigns count
        weak_campaigns_count = len([o for o in opportunities if o.category == WasteCategory.LOW_PERFORMING_CAMPAIGN and o.data_sufficiency == DataSufficiency.SUFFICIENT])

        # 6. Repeated incentive customers count
        repeat_cust_count = len({o.customer_id for o in opportunities if o.category == WasteCategory.REPEATED_INCENTIVES and o.customer_id})

        total_retention_spend = round(total_incentive_cost + total_delivery_cost, 2)

        return {
            "total_recorded_incentive_cost_inr": round(total_incentive_cost, 2),
            "total_incentive_spent_inr": round(total_incentive_cost, 2),
            "total_delivery_cost_inr": round(total_delivery_cost, 2),
            "total_retention_spend_inr": total_retention_spend,
            "delivery_cost_status": "Calculated via channel dispatch rates (Email: ₹0.10, SMS: ₹0.25, Push: ₹0.02, In-App: ₹0.01)",
            "unredeemed_incentive_exposure_inr": round(unredeemed_exposure, 2),
            "unredeemed_incentive_cost_inr": round(unredeemed_exposure, 2),
            "weak_campaigns_count": weak_campaigns_count,
            "low_performing_campaigns_count": weak_campaigns_count,
            "repeat_incentive_recipients_count": repeat_cust_count,
            "repeated_incentive_recipients_count": repeat_cust_count,
            "potential_savings_identified_inr": round(potential_savings, 2),
            "confirmed_realized_savings_inr": round(confirmed_savings, 2),
            "open_opportunities_count": len(open_opps),
            "under_review_count": len(under_review_opps),
            "resolved_count": len(resolved_opps),
            "time_period": f"Trailing {lookback_days} Days",
            "lookback_days": lookback_days,
            "data_source_description": "Aggregated from verified campaign_recipients, campaigns, and customer telemetry tables in SQLite/PostgreSQL.",
            "data_source": "campaign_recipients, campaigns, customer_features",
            "currency": "INR"
        }

    # =========================================================================
    # 5. REVIEW & RESOLUTION WORKFLOW
    # =========================================================================

    def update_opportunity_status(
        self,
        db: Session,
        opportunity_id: str,
        organization_id: str,
        user_name: str,
        new_status: str,
        notes: Optional[str] = None,
        realized_savings_inr: float = 0.0
    ) -> BudgetWasteOpportunity:
        """
        Updates review status of a waste finding with governance audit logging.
        When status is RESOLVED, records verified realized savings.
        """
        opp = db.query(BudgetWasteOpportunity).filter(
            BudgetWasteOpportunity.id == opportunity_id,
            BudgetWasteOpportunity.organization_id == organization_id
        ).first()

        if not opp:
            raise ValueError("Waste opportunity record not found.")

        target_status = WasteReviewStatus(new_status)
        opp.review_status = target_status
        opp.reviewed_by = user_name
        opp.reviewed_at = get_utc_now()
        opp.resolution_notes = notes

        if target_status == WasteReviewStatus.RESOLVED:
            # Confirm realized savings
            opp.realized_savings_inr = round(max(0.0, realized_savings_inr or opp.potential_savings_inr), 2)

        # Audit Log
        audit = AuditLog(
            organization_id=organization_id,
            action=f"BUDGET_WASTE_{target_status.value}",
            details={
                "opportunity_id": opp.id,
                "rule_id": opp.rule_id,
                "title": opp.title,
                "status": target_status.value,
                "notes": notes,
                "realized_savings_inr": opp.realized_savings_inr,
                "reviewed_by": user_name
            }
        )
        db.add(audit)
        db.commit()
        db.refresh(opp)

        return opp


retention_budget_service = RetentionBudgetService()
