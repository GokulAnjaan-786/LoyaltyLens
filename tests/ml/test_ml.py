import pytest
import pandas as pd
from ml.preprocessing.transformer import MLDataPreprocessor
from ml.inference.predictor import predictor_service
from ml.evaluation.metrics import evaluate_model_performance
from ml.training.train import generate_synthetic_training_data


def test_data_preprocessor():
    df = pd.DataFrame([{
        'login_days': 12,
        'hours_spent': 45.0,
        'support_tickets': 2,
        'subscription_type': 'Premium'
    }])
    preprocessor = MLDataPreprocessor()
    X = preprocessor.extract_features(df)
    assert X.shape == (1, 4)
    assert X['subscription_type'].iloc[0] == 2


def test_evaluation_metrics():
    y_true = [1, 0, 1, 0, 1, 0]
    y_pred = [1, 0, 1, 0, 0, 0]
    y_proba = [0.9, 0.1, 0.8, 0.2, 0.4, 0.1]

    metrics = evaluate_model_performance(y_true, y_pred, y_proba)
    assert "accuracy" in metrics
    assert "precision" in metrics
    assert "recall" in metrics
    assert "f1_score" in metrics
    assert "roc_auc" in metrics
    assert "pr_auc" in metrics
    assert "confusion_matrix" in metrics


def test_predictor_service():
    sample = {
        'login_days': 3,
        'hours_spent': 10.0,
        'support_tickets': 4,
        'subscription_type': 'Free'
    }
    res = predictor_service.predict_single(sample)
    assert "churn_probability" in res
    assert 0.0 <= res["churn_probability"] <= 1.0
