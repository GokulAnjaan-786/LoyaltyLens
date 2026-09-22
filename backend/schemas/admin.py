from typing import List, Dict, Any, Optional
from pydantic import BaseModel


class ModelEvaluationResponse(BaseModel):
    id: str
    version_name: str
    model_type: str
    is_active: bool
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    roc_auc: float
    pr_auc: float
    confusion_matrix: Dict[str, Any]
    metrics_summary: Dict[str, Any]


class DatasetImportResponse(BaseModel):
    dataset_id: str
    filename: str
    total_rows: int
    valid_rows: int
    invalid_rows: int
    imported_rows: int
    status: str
    errors: List[str]
