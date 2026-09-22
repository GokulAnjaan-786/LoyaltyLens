from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.db.session import get_db
from backend.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, UserResponse
from backend.repositories.user_repo import user_repo
from backend.core.security import verify_password, create_access_token
from backend.api.deps import get_current_user
from backend.models.user import User

router = APIRouter()


@router.post("/login", response_model=TokenResponse, summary="User Authentication Login")
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = user_repo.get_by_email(db, email=request.email)
    if not user or not verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    token = create_access_token(
        subject=user.id,
        organization_id=user.organization_id,
        role=user.role.value
    )
    
    org_name = user.organization.name if user.organization else "Default Organization"
    
    user_res = UserResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role.value,
        organization_id=user.organization_id,
        organization_name=org_name
    )
    
    return TokenResponse(access_token=token, user=user_res)


@router.post("/register", response_model=TokenResponse, summary="Register New Organization & User")
def register(request: RegisterRequest, db: Session = Depends(get_db)):
    existing = user_repo.get_by_email(db, email=request.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists"
        )
    
    # Create Organization
    slug = request.organization_name.lower().replace(' ', '-').replace('_', '-') + "-org"
    org = user_repo.create_organization(
        db,
        name=request.organization_name or "Default Organization",
        slug=slug,
        industry=request.industry or "Food Delivery App"
    )
    
    # Create User as ADMIN
    user = user_repo.create_user(
        db,
        email=request.email,
        password=request.password,
        organization_id=org.id,
        full_name=request.full_name,
        role="ADMIN"
    )
    
    token = create_access_token(
        subject=user.id,
        organization_id=user.organization_id,
        role=user.role.value
    )
    
    user_res = UserResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role.value,
        organization_id=user.organization_id,
        organization_name=org.name
    )
    
    return TokenResponse(access_token=token, user=user_res)


@router.get("/me", response_model=UserResponse, summary="Get Current Logged In User Profile")
def get_me(current_user: User = Depends(get_current_user)):
    org_name = current_user.organization.name if current_user.organization else "Default Organization"
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.role.value,
        organization_id=current_user.organization_id,
        organization_name=org_name
    )
