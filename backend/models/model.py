import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, DateTime, Text, JSON, Boolean
from backend.db.session import Base


class ModelVersion(Base):
    __tablename__ = "model_versions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    version_name = Column(String(100), nullable=False, unique=True, index=True) # e.g. "v1.0-logistic"
    model_type = Column(String(100), nullable=False) # LogisticRegression, RandomForest, XGBoost, LightGBM
    file_path = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=False)
    
    # Evaluation Metrics
    accuracy = Column(Float, nullable=True)
    precision = Column(Float, nullable=True)
    recall = Column(Float, nullable=True)
    f1_score = Column(Float, nullable=True)
    roc_auc = Column(Float, nullable=True)
    pr_auc = Column(Float, nullable=True)
    confusion_matrix_json = Column(JSON, nullable=True)
    metrics_summary_json = Column(JSON, nullable=True)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
