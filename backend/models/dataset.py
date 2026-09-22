import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from backend.db.session import Base


class UploadedDataset(Base):
    __tablename__ = "uploaded_datasets"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    filename = Column(String(255), nullable=False)
    file_size_bytes = Column(Integer, default=0)
    total_rows = Column(Integer, default=0)
    valid_rows = Column(Integer, default=0)
    invalid_rows = Column(Integer, default=0)
    imported_rows = Column(Integer, default=0)
    status = Column(String(50), default="PROCESSING") # UPLOADED, VALIDATED, IMPORTED, FAILED
    error_summary = Column(JSON, nullable=True)
    column_mapping = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    organization = relationship("Organization", back_populates="uploaded_datasets")
