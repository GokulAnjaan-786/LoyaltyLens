from typing import Optional
from pydantic import BaseModel, EmailStr


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None
    organization_name: Optional[str] = "Default Organization"
    industry: Optional[str] = "Food Delivery App"


class UserResponse(BaseModel):
    id: str
    email: str
    full_name: Optional[str] = None
    role: str
    organization_id: str
    organization_name: Optional[str] = None

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
