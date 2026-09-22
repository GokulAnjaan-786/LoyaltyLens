import os
import pickle
import pandas as pd
import numpy as np
from typing import Dict, Any, List
from ml.preprocessing.transformer import MLDataPreprocessor


class ChurnPredictor:
    def __init__(self, model_path: str = None):
        if not model_path:
            # Look in ml/models or model/
            if os.path.exists("ml/models/churn_model.pkl"):
                model_path = "ml/models/churn_model.pkl"
            elif os.path.exists("model/churn_model.pkl"):
                model_path = "model/churn_model.pkl"

        self.model = None
        self.model_version = "v1.0-logistic"
        self.preprocessor = MLDataPreprocessor()

        if model_path and os.path.exists(model_path):
            try:
                with open(model_path, 'rb') as f:
                    self.model = pickle.load(f)
            except Exception as e:
                print(f"Warning: Could not load model from {model_path}: {e}")

    def predict_single(self, customer_data: dict) -> Dict[str, Any]:
        """
        Runs ML prediction for a single customer.
        Returns churn_probability (0.00 to 1.00) and model_version.
        """
        df = pd.DataFrame([customer_data])
        X = self.preprocessor.extract_features(df)

        if self.model:
            try:
                proba = float(self.model.predict_proba(X)[0][1])
            except Exception:
                proba = 0.5
        else:
            # Fallback heuristic if model file absent
            login_days = customer_data.get("login_days", 10)
            tickets = customer_data.get("support_tickets", 0)
            proba = float(np.clip((25 - login_days) * 0.03 + tickets * 0.1, 0.05, 0.95))

        return {
            "churn_probability": round(proba, 4),
            "model_version": self.model_version
        }

    def predict_batch(self, customers_list: List[dict]) -> List[Dict[str, Any]]:
        """
        Runs vectorized ML batch prediction for multiple customers.
        """
        if not customers_list:
            return []

        df = pd.DataFrame(customers_list)
        X = self.preprocessor.extract_features(df)

        results = []
        if self.model:
            try:
                probas = self.model.predict_proba(X)[:, 1]
            except Exception:
                probas = np.full(len(customers_list), 0.5)

            for i, p in enumerate(probas):
                results.append({
                    "churn_probability": round(float(p), 4),
                    "model_version": self.model_version
                })
        else:
            for item in customers_list:
                results.append(self.predict_single(item))

        return results


# Global singleton instance
predictor_service = ChurnPredictor()
