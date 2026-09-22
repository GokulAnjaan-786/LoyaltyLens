import sys
import os
import json
import pickle
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

from ml.preprocessing.transformer import MLDataPreprocessor
from ml.evaluation.metrics import evaluate_model_performance


def generate_synthetic_training_data(n_samples: int = 1000) -> pd.DataFrame:
    """Generates synthetic food delivery dataset for training initial baseline model."""
    np.random.seed(42)
    cities = ["Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai", "Kolkata", "Pune", "Jaipur", "Ahmedabad", "Surat"]
    
    data = {
        'customer_id': [f"CUST-{1000 + i}" for i in range(n_samples)],
        'login_days': np.random.randint(1, 25, n_samples),
        'hours_spent': np.random.randint(20, 150, n_samples),
        'support_tickets': np.random.randint(0, 6, n_samples),
        'subscription_type': np.random.choice(['Free', 'Basic', 'Premium'], n_samples, p=[0.6, 0.3, 0.1]),
        'City': np.random.choice(cities, n_samples),
        'orders_count': np.random.randint(1, 20, n_samples),
        'avg_delivery_delay_mins': np.random.randint(10, 60, n_samples),
        'app_rating': np.random.uniform(1.0, 5.0, n_samples).round(1)
    }
    df = pd.DataFrame(data)

    churn_prob = np.zeros(n_samples)
    churn_prob += (25 - df['login_days']) * 0.02
    churn_prob += (150 - df['hours_spent']) * 0.002
    churn_prob += df['support_tickets'] * 0.15
    churn_prob += (df['avg_delivery_delay_mins'] - 30) * 0.005
    churn_prob += (5 - df['app_rating']) * 0.1
    churn_prob += np.where(df['subscription_type'] == 'Free', 0.2, 0)
    churn_prob += np.where(df['subscription_type'] == 'Basic', 0.1, 0)
    churn_prob += np.where(df['City'] == 'Chennai', 0.15, 0)
    churn_prob += np.where(df['City'] == 'Bangalore', -0.1, 0)

    churn_prob = np.clip(churn_prob, 0, 1)
    df['churn'] = np.random.binomial(1, churn_prob)

    return df


def train_and_save_model(model_dir: str = "ml/models", model_type: str = "LogisticRegression"):
    """
    Trains specified ML model, computes evaluation metrics, and persists versioned artifacts.
    """
    os.makedirs(model_dir, exist_ok=True)
    
    df = generate_synthetic_training_data()
    preprocessor = MLDataPreprocessor()
    X = preprocessor.extract_features(df)
    y = df['churn']

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    if model_type == "RandomForest":
        model = RandomForestClassifier(n_estimators=100, random_state=42)
        version_name = "v1.1-randomforest"
    else:
        model = LogisticRegression(random_state=42)
        version_name = "v1.0-logistic"

    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    y_proba = model.predict_proba(X_test)[:, 1]

    metrics = evaluate_model_performance(y_test, y_pred, y_proba)
    metrics["version_name"] = version_name
    metrics["model_type"] = model_type
    metrics["is_demo_synthetic_data"] = True

    model_path = os.path.join(model_dir, "churn_model.pkl")
    legacy_model_path = os.path.join("model", "churn_model.pkl")
    os.makedirs("model", exist_ok=True)

    with open(model_path, 'wb') as f:
        pickle.dump(model, f)
    with open(legacy_model_path, 'wb') as f:
        pickle.dump(model, f)

    metrics_path = os.path.join(model_dir, "metrics.json")
    with open(metrics_path, 'w') as f:
        json.dump(metrics, f, indent=2)

    print(f"[OK] Model {version_name} trained. Accuracy: {metrics['accuracy']:.4f}, ROC-AUC: {metrics['roc_auc']:.4f}")
    return metrics, model_path


if __name__ == "__main__":
    train_and_save_model()
