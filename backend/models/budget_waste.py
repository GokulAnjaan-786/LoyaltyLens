import uuid
from datetime import datetime, timezone
import enum
from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime, ForeignKey, Text, Enum as SQLEnum, JSON
from sqlalchemy.orm import relationship
from backend.db.session import Base


class WasteCategory(str, enum.Enum):
    REPEATED_INCENTIVES = "REPEATED_INCENTIVES"
    LOW_PERFORMING_CAMPAIGN = "LOW_PERFORMING_CAMPAIGN"
    UNNECESSARY_DISCOUNT = "UNNECESSARY_DISCOUNT"
    BUDGET_LEAKAGE = "BUDGET_LEAKAGE"
    INEFFICIENT_SEGMENT = "INEFFICIENT_SEGMENT"


class WasteReviewStatus(str, enum.Enum):
    OPEN = "OPEN"
    UNDER_REVIEW = "UNDER_REVIEW"
    APPROVED = "APPROVED"
    DISMISSED = "DISMISSED"
    RESOLVED = "RESOLVED"


class EvidenceStrength(str, enum.Enum):
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


class DataSufficiency(str, enum.Enum):
    SUFFICIENT = "SUFFICIENT"
    INSUFFICIENT_DATA = "INSUFFICIENT_DATA"


class BudgetWasteOpportunity(Base):
    __tablename__ = "budget_waste_opportunities"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    rule_id = Column(String(100), nullable=False, index=True)
    rule_version = Column(String(20), default="1.0", nullable=False)
    title = Column(String(255), nullable=False)
    category = Column(SQLEnum(WasteCategory), nullable=False, index=True)

    # Associated entities
    campaign_id = Column(String(36), ForeignKey("campaigns.id", ondelete="SET NULL"), nullable=True, index=True)
    customer_id = Column(String(36), ForeignKey("customers.id", ondelete="SET NULL"), nullable=True, index=True)
    customer_code = Column(String(100), nullable=True, index=True)
    segment = Column(String(100), nullable=True)

    # Financial Exposure & Potential vs Confirmed Savings
    affected_spend_inr = Column(Float, default=0.0, nullable=False)
    potential_savings_inr = Column(Float, default=0.0, nullable=False)
    realized_savings_inr = Column(Float, default=0.0, nullable=False)

    # Evidentiary Rigor
    evidence_strength = Column(SQLEnum(EvidenceStrength), default=EvidenceStrength.MEDIUM, nullable=False)
    data_sufficiency = Column(SQLEnum(DataSufficiency), default=DataSufficiency.SUFFICIENT, nullable=False)

    # Detailed Narrative & Evidence
    finding_summary = Column(Text, nullable=False)
    evidence_json = Column(JSON, nullable=False) # structured calculations, records, dates, control comparisons
    recommended_action = Column(Text, nullable=False)
    recommended_action_type = Column(String(100), default="REVIEW_CAMPAIGN", nullable=False)
    verification_method = Column(Text, nullable=True)

    # Governance & Review Lifecycle
    review_status = Column(SQLEnum(WasteReviewStatus), default=WasteReviewStatus.OPEN, nullable=False, index=True)
    reviewed_by = Column(String(150), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    resolution_notes = Column(Text, nullable=True)

    detected_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    campaign = relationship("Campaign")
    customer = relationship("Customer")
