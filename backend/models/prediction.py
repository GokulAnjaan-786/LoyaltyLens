import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Integer, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from backend.db.session import Base


class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    customer_id = Column(String(36), ForeignKey("customers.id", ondelete="CASCADE"), nullable=False, index=True)
    churn_probability = Column(Float, nullable=False) # e.g. 0.82
    risk_score = Column(Integer, nullable=False)       # e.g. 82
    risk_level = Column(String(20), nullable=False)    # LOW, MEDIUM, HIGH
    model_version = Column(String(50), default="v1.0-logistic")
    reasons_json = Column(JSON, nullable=True)         # Structured factors
    ml_explanation = Column(Text, nullable=True)       # Feature importance / SHAP summary
    ai_explanation = Column(Text, nullable=True)       # Gemini narrative
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)

    customer = relationship("Customer", back_populates="predictions")


class RiskScore(Base):
    __tablename__ = "risk_scores"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    customer_id = Column(String(36), ForeignKey("customers.id", ondelete="CASCADE"), nullable=False, index=True)
    score = Column(Integer, nullable=False)
    level = Column(String(20), nullable=False) # LOW, MEDIUM, HIGH
    calculated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)

    customer = relationship("Customer", back_populates="risk_scores")
