import uuid
from datetime import datetime, timezone
import enum
from sqlalchemy import Column, String, Float, Integer, DateTime, ForeignKey, Text, Enum as SQLEnum, JSON
from sqlalchemy.orm import relationship
from backend.db.session import Base


class CampaignStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    SIMULATED = "SIMULATED"
    ACTIVE = "ACTIVE"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class Campaign(Base):
    __tablename__ = "campaigns"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    target_segment = Column(String(100), default="ALL")
    target_risk_level = Column(String(50), default="HIGH") # HIGH, MEDIUM, LOW, ALL
    offer = Column(String(255), nullable=False) # e.g. "50% OFF Next Order", "Free Delivery"
    action_strength = Column(String(20), default="Medium") # Low, Medium, High
    status = Column(SQLEnum(CampaignStatus), default=CampaignStatus.DRAFT, nullable=False)
    
    # Impact predictions
    target_customer_count = Column(Integer, default=0)
    expected_saved_count = Column(Integer, default=0)
    expected_risk_reduction_pct = Column(Float, default=0.0)
    estimated_cost_inr = Column(Float, default=0.0)

    start_date = Column(DateTime, nullable=True)
    end_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    organization = relationship("Organization", back_populates="campaigns")
    results = relationship("CampaignResult", back_populates="campaign", cascade="all, delete-orphan")


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
