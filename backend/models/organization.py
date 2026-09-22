import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime
from sqlalchemy.orm import relationship
from backend.db.session import Base


class Organization(Base):
    __tablename__ = "organizations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False, index=True)
    slug = Column(String(255), nullable=False, unique=True, index=True)
    industry = Column(String(100), default="Food Delivery App")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    users = relationship("User", back_populates="organization", cascade="all, delete-orphan")
    customers = relationship("Customer", back_populates="organization", cascade="all, delete-orphan")
    campaigns = relationship("Campaign", back_populates="organization", cascade="all, delete-orphan")
    uploaded_datasets = relationship("UploadedDataset", back_populates="organization", cascade="all, delete-orphan")
