import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from backend.db.session import Base


class RetentionRecommendation(Base):
    __tablename__ = "retention_recommendations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    customer_id = Column(String(36), ForeignKey("customers.id", ondelete="CASCADE"), nullable=False, index=True)
    problem_summary = Column(Text, nullable=False)
    recommended_action = Column(Text, nullable=False)
    action_type = Column(String(100), nullable=False) # DISCOUNT, FREE_DELIVERY, SUPPORT, MENTOR
    offer_details = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)

    customer = relationship("Customer", back_populates="recommendations")
