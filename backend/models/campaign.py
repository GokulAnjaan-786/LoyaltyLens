import uuid
from datetime import datetime, timezone
import enum
from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime, ForeignKey, Text, Enum as SQLEnum, JSON
from sqlalchemy.orm import relationship
from backend.db.session import Base


class CampaignStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    SIMULATED = "SIMULATED"
    PENDING_APPROVAL = "PENDING_APPROVAL"
    APPROVED = "APPROVED"
    SCHEDULED = "SCHEDULED"
    RUNNING = "RUNNING"
    ACTIVE = "ACTIVE"
    PAUSED = "PAUSED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"
    FAILED = "FAILED"


class RecipientStatus(str, enum.Enum):
    PENDING = "PENDING"
    DELIVERED = "DELIVERED"
    FAILED = "FAILED"
    SKIPPED = "SKIPPED"
    CONTROL_GROUP = "CONTROL_GROUP"
    OPENED = "OPENED"
    REDEEMED = "REDEEMED"


class Campaign(Base):
    __tablename__ = "campaigns"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    objective = Column(String(150), default="Prevent High-Risk Churn", nullable=False)
    target_segment = Column(String(100), default="ALL")
    target_risk_level = Column(String(50), default="HIGH") # HIGH, MEDIUM, LOW, ALL
    offer = Column(String(255), nullable=False) # e.g. "20% OFF Next Order", "Free Delivery"
    offer_type = Column(String(50), default="DISCOUNT") # DISCOUNT, LOYALTY_POINTS, FREE_DELIVERY, CASHBACK, WINBACK_MESSAGE
    discount_value = Column(Float, default=20.0)
    discount_unit = Column(String(20), default="%") # %, INR, POINTS
    max_discount_cap_inr = Column(Float, default=150.0)
    total_budget_inr = Column(Float, default=5000.0)
    per_customer_cost_inr = Column(Float, default=50.0)
    action_strength = Column(String(20), default="Medium") # Low, Medium, High
    status = Column(SQLEnum(CampaignStatus), default=CampaignStatus.DRAFT, nullable=False)
    
    # Audience Targeting Filters & Configuration
    audience_filters = Column(JSON, nullable=True) # {city, min_inactivity_days, max_inactivity_days, min_orders, max_orders, subscription_type}
    control_group_pct = Column(Float, default=10.0) # 10% holdout group for incrementality measurement
    is_dry_run = Column(Boolean, default=True)
    delivery_channel = Column(String(50), default="EMAIL") # EMAIL, SMS, PUSH, IN_APP
    message_subject = Column(String(255), nullable=True)
    message_body = Column(Text, nullable=True)

    # Approval Governance
    approved_by = Column(String(150), nullable=True)
    approved_at = Column(DateTime, nullable=True)
    approval_notes = Column(Text, nullable=True)

    # Impact predictions & simulations
    target_customer_count = Column(Integer, default=0)
    expected_saved_count = Column(Integer, default=0)
    expected_risk_reduction_pct = Column(Float, default=0.0)
    estimated_cost_inr = Column(Float, default=0.0)
    simulation_assumptions = Column(JSON, nullable=True)
    execution_summary = Column(JSON, nullable=True)

    start_date = Column(DateTime, nullable=True)
    end_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    organization = relationship("Organization", back_populates="campaigns")
    results = relationship("CampaignResult", back_populates="campaign", cascade="all, delete-orphan")
    recipients = relationship("CampaignRecipient", back_populates="campaign", cascade="all, delete-orphan")


class CampaignRecipient(Base):
    __tablename__ = "campaign_recipients"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    campaign_id = Column(String(36), ForeignKey("campaigns.id", ondelete="CASCADE"), nullable=False, index=True)
    customer_id = Column(String(36), ForeignKey("customers.id", ondelete="CASCADE"), nullable=False, index=True)
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    customer_code = Column(String(100), nullable=False, index=True)
    customer_email = Column(String(255), nullable=True)
    risk_level = Column(String(50), nullable=False)
    risk_score = Column(Integer, nullable=False)
    status = Column(SQLEnum(RecipientStatus), default=RecipientStatus.PENDING, nullable=False)
    delivery_channel = Column(String(50), default="EMAIL")
    dispatched_at = Column(DateTime, nullable=True)
    error_message = Column(Text, nullable=True)
    is_dry_run = Column(Boolean, default=True)
    is_control_group = Column(Boolean, default=False)
    opened_at = Column(DateTime, nullable=True)
    redeemed_at = Column(DateTime, nullable=True)
    incentive_cost_inr = Column(Float, default=0.0)
    personalized_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    campaign = relationship("Campaign", back_populates="recipients")
    customer = relationship("Customer")


class CampaignResult(Base):
    __tablename__ = "campaign_results"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    campaign_id = Column(String(36), ForeignKey("campaigns.id", ondelete="CASCADE"), nullable=False, index=True)
    total_targeted = Column(Integer, default=0)
    converted_count = Column(Integer, default=0)
    churn_prevented_count = Column(Integer, default=0)
    roi_percentage = Column(Float, default=0.0)
    metrics_json = Column(JSON, nullable=True)
    recorded_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    campaign = relationship("Campaign", back_populates="results")
