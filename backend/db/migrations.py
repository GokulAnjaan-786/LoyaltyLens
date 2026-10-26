import logging
from sqlalchemy import text
from backend.db.session import engine, Base
import backend.models # Ensure all models are loaded

logger = logging.getLogger("loyaltylens.migrations")


def run_schema_migrations():
    """
    Applies non-destructive schema migrations for existing SQLite databases.
    Adds missing columns to `campaigns` and creates any missing tables (e.g. `campaign_recipients`).
    """
    # 1. Create any missing tables (e.g. campaign_recipients)
    Base.metadata.create_all(bind=engine)

    # 2. Add missing columns to campaigns table if needed
    with engine.connect() as conn:
        try:
            existing_columns = {
                row[1] for row in conn.execute(text("PRAGMA table_info(campaigns)")).fetchall()
            }
        except Exception as e:
            logger.warning(f"Could not inspect campaigns table: {e}")
            return

        column_definitions = [
            ("objective", "VARCHAR(150) DEFAULT 'Prevent High-Risk Churn'"),
            ("offer_type", "VARCHAR(50) DEFAULT 'DISCOUNT'"),
            ("discount_value", "FLOAT DEFAULT 20.0"),
            ("discount_unit", "VARCHAR(20) DEFAULT '%'"),
            ("max_discount_cap_inr", "FLOAT DEFAULT 150.0"),
            ("total_budget_inr", "FLOAT DEFAULT 5000.0"),
            ("per_customer_cost_inr", "FLOAT DEFAULT 50.0"),
            ("audience_filters", "JSON DEFAULT NULL"),
            ("control_group_pct", "FLOAT DEFAULT 10.0"),
            ("is_dry_run", "BOOLEAN DEFAULT 1"),
            ("delivery_channel", "VARCHAR(50) DEFAULT 'EMAIL'"),
            ("message_subject", "VARCHAR(255) DEFAULT NULL"),
            ("message_body", "TEXT DEFAULT NULL"),
            ("approved_by", "VARCHAR(150) DEFAULT NULL"),
            ("approved_at", "DATETIME DEFAULT NULL"),
            ("approval_notes", "TEXT DEFAULT NULL"),
            ("simulation_assumptions", "JSON DEFAULT NULL"),
            ("execution_summary", "JSON DEFAULT NULL"),
        ]

        for col_name, col_type in column_definitions:
            if col_name not in existing_columns:
                try:
                    conn.execute(text(f"ALTER TABLE campaigns ADD COLUMN {col_name} {col_type}"))
                    conn.commit()
                    logger.info(f"Added column {col_name} to campaigns table.")
                except Exception as ex:
                    logger.error(f"Failed to add column {col_name}: {ex}")
