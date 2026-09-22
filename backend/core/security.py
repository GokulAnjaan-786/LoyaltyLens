import hashlib
import hmac
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any, Union
import jwt
from backend.core.config import settings

try:
    from passlib.context import CryptContext
    pwd_context = CryptContext(schemes=["argon2", "bcrypt"], deprecated="auto")
    USE_PASSLIB = True
except Exception:
    USE_PASSLIB = False


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies plain password against stored hash (Argon2 / PBKDF2 fallback)."""
    if USE_PASSLIB and (hashed_password.startswith("$argon2") or hashed_password.startswith("$2b$")):
        try:
            return pwd_context.verify(plain_password, hashed_password)
        except Exception:
            pass
    
    # Simple fallback or plain-hash check for seed data compatibility
    if ":" in hashed_password:
        salt, h_val = hashed_password.split(":", 1)
        computed = hashlib.pbkdf2_hmac('sha256', plain_password.encode('utf-8'), salt.encode('utf-8'), 100000).hex()
        return hmac.compare_digest(computed, h_val)
    
    return plain_password == hashed_password


def get_password_hash(password: str) -> str:
    """Generates secure password hash."""
    if USE_PASSLIB:
        try:
            return pwd_context.hash(password)
        except Exception:
            pass
            
    salt = secrets.token_hex(16)
    computed = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), 100000).hex()
    return f"{salt}:{computed}"


def create_access_token(subject: Union[str, Any], organization_id: str, role: str, expires_delta: timedelta = None) -> str:
    """Generates signed JWT access token containing sub, org_id, and role claims."""
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {
        "sub": str(subject),
        "org_id": str(organization_id),
        "role": str(role),
        "exp": expire,
        "iat": datetime.now(timezone.utc)
    }
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.ALGORITHM)
    return encoded_jwt


def decode_token(token: str) -> dict:
    """Decodes and validates signed JWT token."""
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.ALGORITHM])
        return payload
    except jwt.PyJWTError:
        return None
