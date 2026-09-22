import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from backend.db.session import Base


class Customer(Base):
    __tablename__ = "customers"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    customer_code = Column(String(100), nullable=False, index=True)
    app_type = Column(String(100), default="Food Delivery App")
    subscription_type = Column(String(50), default="Free")
    city = Column(String(100), default="Mumbai", index=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    industry_type = Column(String(100), default="Food Delivery")
    joining_date = Column(DateTime, nullable=True)
    
    # Common Engagement Metrics
    login_days = Column(Integer, default=10) # Activity Frequency
    hours_spent = Column(Float, default=20.0)
    support_tickets = Column(Integer, default=0)
    
    # Food Delivery Specific
    orders_count = Column(Integer, default=5)
    avg_delivery_delay_mins = Column(Integer, default=20)
    app_rating = Column(Float, default=4.2)
    
    # Shopping Specific
    last_purchase_days = Column(Integer, default=10)
    cart_abandon_count = Column(Integer, default=0)
    return_count = Column(Integer, default=0)
    
    # Learning Specific
    last_active_days = Column(Integer, default=5)
    course_progress_percent = Column(Float, default=50.0)
    avg_session_time = Column(Float, default=30.0)
    quiz_attempts = Column(Integer, default=2)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    organization = relationship("Organization", back_populates="customers")
    events = relationship("CustomerEvent", back_populates="customer", cascade="all, delete-orphan")
    predictions = relationship("Prediction", back_populates="customer", cascade="all, delete-orphan")
    risk_scores = relationship("RiskScore", back_populates="customer", cascade="all, delete-orphan")
    recommendations = relationship("RetentionRecommendation", back_populates="customer", cascade="all, delete-orphan")
