from typing import Optional
from sqlalchemy.orm import Session
from backend.models.user import User, UserRole
from backend.models.organization import Organization
from backend.core.security import get_password_hash


class UserRepository:
    def get_by_id(self, db: Session, user_id: str) -> Optional[User]:
        return db.query(User).filter(User.id == user_id).first()

    def get_by_email(self, db: Session, email: str) -> Optional[User]:
        return db.query(User).filter(User.email == email).first()

    def create_user(
        self,
        db: Session,
        email: str,
        password: str,
        organization_id: str,
        full_name: Optional[str] = None,
        role: UserRole = UserRole.ANALYST
    ) -> User:
        hashed_pwd = get_password_hash(password)
        db_user = User(
            email=email.lower().strip(),
            hashed_password=hashed_pwd,
            organization_id=organization_id,
            full_name=full_name,
            role=role
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user

    def create_organization(self, db: Session, name: str, slug: str, industry: str = "Food Delivery App") -> Organization:
        org = Organization(name=name, slug=slug, industry=industry)
        db.add(org)
        db.commit()
        db.refresh(org)
        return org


user_repo = UserRepository()
