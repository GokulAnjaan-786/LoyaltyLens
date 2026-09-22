from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from backend.core.config import settings

# Determine database engine settings
db_url = settings.DATABASE_URL

# Support fallback to SQLite if PostgreSQL URL is default and connection fails or SQLite requested
connect_args = {}
if db_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    db_url,
    pool_pre_ping=True,
    connect_args=connect_args
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """Dependency for providing a SQLAlchemy database session per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
