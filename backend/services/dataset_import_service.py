import io
import pandas as pd
import numpy as np
from typing import Dict, Any, List
from utils.geodata import get_lat_lon


def parse_and_validate_dataset(file_content: bytes, filename: str, app_type: str = "Food Delivery App") -> Dict[str, Any]:
    """
    Parses CSV/XLSX file contents, detects schema, validates row data integrity,
    identifies missing/invalid/duplicate rows, and returns preview stats.
    """
    errors = []
    
    try:
        if filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(file_content))
        else:
            df = pd.read_excel(io.BytesIO(file_content))
    except Exception as e:
        return {
            "success": False,
            "error": f"Failed to parse file: {str(e)}",
            "total_rows": 0,
            "valid_rows": 0,
            "invalid_rows": 0,
            "duplicate_rows": 0,
            "columns": [],
            "preview": []
        }

    total_rows = len(df)
    if total_rows == 0:
        return {
            "success": False,
            "error": "Dataset is empty.",
            "total_rows": 0,
            "valid_rows": 0,
            "invalid_rows": 0,
            "duplicate_rows": 0,
            "columns": list(df.columns),
            "preview": []
        }

    # Detect Customer ID / Code column
    customer_col = None
    for col in df.columns:
        if str(col).lower().replace('_', '').replace(' ', '') in ['customerid', 'id', 'custid', 'customercode', 'code']:
            customer_col = col
            break

    if not customer_col:
        errors.append("Column 'customer_id' not found in file header. Generated synthetic IDs will be used if confirmed.")
        df['customer_code'] = [f"CUST-{i + 1000}" for i in range(total_rows)]
    else:
        df['customer_code'] = df[customer_col].astype(str)

    # Detect duplicates
    duplicates_count = int(df.duplicated(subset=['customer_code']).sum())

    # Detect city / location column
    city_col = None
    for col in df.columns:
        if str(col).lower().replace('_', '').replace(' ', '') in ['city', 'region', 'location', 'locality']:
            city_col = col
            break
    
    if city_col:
        df['city'] = df[city_col].astype(str).str.strip().str.title()
    else:
        df['city'] = "Mumbai"

    # Validate numbers
    invalid_rows_count = 0
    numeric_cols = ['login_days', 'hours_spent', 'support_tickets', 'orders_count', 'avg_delivery_delay_mins', 'app_rating']
    
    for col in numeric_cols:
        if col in df.columns:
            non_numeric = pd.to_numeric(df[col], errors='coerce').isna().sum()
            invalid_rows_count += int(non_numeric)

    valid_rows_count = max(0, total_rows - invalid_rows_count)

    # Preview data (first 5 rows converted to dicts)
    preview_df = df.head(5).copy()
    preview_df = preview_df.where(pd.notnull(preview_df), None)

    return {
        "success": True,
        "filename": filename,
        "total_rows": total_rows,
        "valid_rows": valid_rows_count,
        "invalid_rows": invalid_rows_count,
        "duplicate_rows": duplicates_count,
        "columns": list(df.columns),
        "detected_customer_column": customer_col,
        "detected_city_column": city_col,
        "errors": errors,
        "preview": preview_df.to_dict(orient='records')
    }


def prepare_dataset_for_db_import(df: pd.DataFrame, org_id: str, app_type: str = "Food Delivery App") -> List[dict]:
    """
    Transforms a validated DataFrame into SQLAlchemy Customer entity dictionary objects.
    """
    records = []
    
    for i, row in df.iterrows():
        code = str(row.get('customer_code', f"CUST-{i+1000}"))
        city_val = str(row.get('city', 'Mumbai')).strip().title()
        lat, lon = get_lat_lon(city_val)

        rec = {
            "organization_id": org_id,
            "customer_code": code,
            "app_type": app_type,
            "subscription_type": str(row.get('subscription_type', 'Free')).capitalize(),
            "city": city_val if city_val else "Mumbai",
            "latitude": lat,
            "longitude": lon,
            "industry_type": str(row.get('industry_type', 'Food Delivery')),
            "login_days": int(row.get('login_days', 10)) if pd.notnull(row.get('login_days')) else 10,
            "hours_spent": float(row.get('hours_spent', 20.0)) if pd.notnull(row.get('hours_spent')) else 20.0,
            "support_tickets": int(row.get('support_tickets', 0)) if pd.notnull(row.get('support_tickets')) else 0,
            "orders_count": int(row.get('orders_count', 5)) if pd.notnull(row.get('orders_count')) else 5,
            "avg_delivery_delay_mins": int(row.get('avg_delivery_delay_mins', 20)) if pd.notnull(row.get('avg_delivery_delay_mins')) else 20,
            "app_rating": float(row.get('app_rating', 4.2)) if pd.notnull(row.get('app_rating')) else 4.2,
            "last_purchase_days": int(row.get('last_purchase_days', 10)) if pd.notnull(row.get('last_purchase_days')) else 10,
            "cart_abandon_count": int(row.get('cart_abandon_count', 0)) if pd.notnull(row.get('cart_abandon_count')) else 0,
            "return_count": int(row.get('return_count', 0)) if pd.notnull(row.get('return_count')) else 0,
            "last_active_days": int(row.get('last_active_days', 5)) if pd.notnull(row.get('last_active_days')) else 5,
            "course_progress_percent": float(row.get('course_progress_percent', 50.0)) if pd.notnull(row.get('course_progress_percent')) else 50.0,
            "avg_session_time": float(row.get('avg_session_time', 30.0)) if pd.notnull(row.get('avg_session_time')) else 30.0,
            "quiz_attempts": int(row.get('quiz_attempts', 2)) if pd.notnull(row.get('quiz_attempts')) else 2
        }
        records.append(rec)

    return records
