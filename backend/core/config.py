import os
from typing import List, Optional

try:
    from pydantic_settings import BaseSettings, SettingsConfigDict
    
    class Settings(BaseSettings):
        PROJECT_NAME: str = "LoyaltyLens Customer Retention Intelligence Platform"
        VERSION: str = "2.0.0"
        API_V1_STR: str = "/api/v1"
        
        ENV: str = "development"
        DEBUG: bool = True
        
        DATABASE_URL: str = "sqlite:///./loyaltylens.db"
        
        JWT_SECRET: str = "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7"
        ALGORITHM: str = "HS256"
        ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7
        
        GEMINI_API_KEY: Optional[str] = None
        REDIS_URL: str = "redis://localhost:6379/0"
        
        CORS_ORIGINS: List[str] = [
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:8000",
        ]
        
        FOOD_LOW_LOGIN_DAYS: int = 5
        FOOD_LOW_ORDERS_COUNT: int = 3
        FOOD_HIGH_DELIVERY_DELAY: int = 40
        FOOD_LOW_APP_RATING: float = 3.0
        FOOD_HIGH_SUPPORT_TICKETS: int = 3
        
        SHOPPING_LAST_PURCHASE_DAYS: int = 30
        SHOPPING_LOW_ORDERS: int = 2
        SHOPPING_CART_ABANDON: int = 3
        SHOPPING_HIGH_RETURNS: int = 2
        SHOPPING_SUPPORT_TICKETS: int = 3
        
        LEARNING_LAST_ACTIVE_DAYS: int = 14
        LEARNING_LOW_PROGRESS_PCT: int = 30
        LEARNING_LOW_SESSION_TIME: int = 10
        LEARNING_LOW_QUIZ_ATTEMPTS: int = 2
        LEARNING_SUPPORT_TICKETS: int = 3
        
        LOW_RISK_MAX: int = 30
        MEDIUM_RISK_MAX: int = 60

        model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    settings = Settings()

except Exception:
    class ManualSettings:
        PROJECT_NAME: str = os.getenv("PROJECT_NAME", "LoyaltyLens Customer Retention Intelligence Platform")
        VERSION: str = "2.0.0"
        API_V1_STR: str = "/api/v1"
        
        ENV: str = os.getenv("ENV", "development")
        DEBUG: bool = True
        
        DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./loyaltylens.db")
        
        JWT_SECRET: str = os.getenv("JWT_SECRET", "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7")
        ALGORITHM: str = "HS256"
        ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7
        
        GEMINI_API_KEY: Optional[str] = os.getenv("GEMINI_API_KEY")
        REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
        
        CORS_ORIGINS: List[str] = [
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:8000",
        ]
        
        FOOD_LOW_LOGIN_DAYS: int = 5
        FOOD_LOW_ORDERS_COUNT: int = 3
        FOOD_HIGH_DELIVERY_DELAY: int = 40
        FOOD_LOW_APP_RATING: float = 3.0
        FOOD_HIGH_SUPPORT_TICKETS: int = 3
        
        SHOPPING_LAST_PURCHASE_DAYS: int = 30
        SHOPPING_LOW_ORDERS: int = 2
        SHOPPING_CART_ABANDON: int = 3
        SHOPPING_HIGH_RETURNS: int = 2
        SHOPPING_SUPPORT_TICKETS: int = 3
        
        LEARNING_LAST_ACTIVE_DAYS: int = 14
        LEARNING_LOW_PROGRESS_PCT: int = 30
        LEARNING_LOW_SESSION_TIME: int = 10
        LEARNING_LOW_QUIZ_ATTEMPTS: int = 2
        LEARNING_SUPPORT_TICKETS: int = 3
        
        LOW_RISK_MAX: int = 30
        MEDIUM_RISK_MAX: int = 60

    settings = ManualSettings()
