import numpy as np
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    precision_recall_curve,
    auc,
    confusion_matrix
)
from typing import Dict, Any


def evaluate_model_performance(y_true: np.ndarray, y_pred: np.ndarray, y_proba: np.ndarray) -> Dict[str, Any]:
    """
    Computes complete set of model evaluation metrics:
    Accuracy, Precision, Recall, F1 Score, ROC-AUC, PR-AUC, Confusion Matrix.
    """
    acc = float(accuracy_score(y_true, y_pred))
    prec = float(precision_score(y_true, y_pred, zero_division=0))
    rec = float(recall_score(y_true, y_pred, zero_division=0))
    f1 = float(f1_score(y_true, y_pred, zero_division=0))

    # ROC AUC
    try:
        roc_auc = float(roc_auc_score(y_true, y_proba))
    except Exception:
        roc_auc = 0.5

    # PR AUC
    try:
        precision_pts, recall_pts, _ = precision_recall_curve(y_true, y_proba)
        pr_auc = float(auc(recall_pts, precision_pts))
    except Exception:
        pr_auc = 0.5

    # Confusion Matrix
    cm = confusion_matrix(y_true, y_pred)
    tn, fp, fn, tp = cm.ravel() if cm.shape == (2, 2) else (0, 0, 0, 0)

    cm_dict = {
        "true_negatives": int(tn),
        "false_positives": int(fp),
        "false_negatives": int(fn),
        "true_positives": int(tp),
        "matrix": cm.tolist()
    }

    return {
        "accuracy": round(acc, 4),
        "precision": round(prec, 4),
        "recall": round(rec, 4),
        "f1_score": round(f1, 4),
        "roc_auc": round(roc_auc, 4),
        "pr_auc": round(pr_auc, 4),
        "confusion_matrix": cm_dict,
        "summary": f"Accuracy: {acc:.2%}, F1: {f1:.4f}, ROC-AUC: {roc_auc:.4f}"
    }
