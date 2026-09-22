import pandas as pd
import numpy as np


class MLDataPreprocessor:
    def __init__(self):
        self.subscription_mapping = {'Free': 0, 'Basic': 1, 'Premium': 2, 'free': 0, 'basic': 1, 'premium': 2}

    def preprocess_df(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Cleans and encodes input DataFrame into ML feature vectors.
        Required features: login_days, hours_spent, support_tickets, subscription_type
        """
        df_clean = df.copy()
        
        # Normalize subscription_type
        if 'subscription_type' in df_clean.columns:
            df_clean['subscription_type'] = df_clean['subscription_type'].astype(str).map(
                lambda x: self.subscription_mapping.get(x, self.subscription_mapping.get(x.capitalize(), 0))
            ).fillna(0).astype(int)
        else:
            df_clean['subscription_type'] = 0

        # Fill defaults for standard feature columns
        if 'login_days' not in df_clean.columns:
            df_clean['login_days'] = 10
        if 'hours_spent' not in df_clean.columns:
            df_clean['hours_spent'] = 20.0
        if 'support_tickets' not in df_clean.columns:
            df_clean['support_tickets'] = 0

        # Fill NAs
        df_clean['login_days'] = df_clean['login_days'].fillna(10).astype(int)
        df_clean['hours_spent'] = df_clean['hours_spent'].fillna(20.0).astype(float)
        df_clean['support_tickets'] = df_clean['support_tickets'].fillna(0).astype(int)

        return df_clean

    def extract_features(self, df: pd.DataFrame) -> pd.DataFrame:
        df_clean = self.preprocess_df(df)
        feature_cols = ['login_days', 'hours_spent', 'support_tickets', 'subscription_type']
        return df_clean[feature_cols]
