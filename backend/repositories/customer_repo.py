from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.models.customer import Customer
from backend.models.prediction import Prediction, RiskScore


class CustomerRepository:
    def get_by_id(self, db: Session, customer_id: str, organization_id: str) -> Optional[Customer]:
        """Gets a single customer belonging strictly to specified organization."""
        return db.query(Customer).filter(
            Customer.id == customer_id,
            Customer.organization_id == organization_id
        ).first()

    def get_by_code(self, db: Session, customer_code: str, organization_id: str) -> Optional[Customer]:
        return db.query(Customer).filter(
            Customer.customer_code == customer_code,
            Customer.organization_id == organization_id
        ).first()

    def list_customers(
        self,
        db: Session,
        organization_id: str,
        app_type: Optional[str] = None,
        city: Optional[str] = None,
        search: Optional[str] = None,
        page: int = 1,
        size: int = 50
    ) -> Tuple[int, List[Customer]]:
        """Lists customers belonging strictly to specified organization with pagination and search."""
        query = db.query(Customer).filter(Customer.organization_id == organization_id)

        if app_type:
            query = query.filter(Customer.app_type == app_type)
        if city:
            query = query.filter(Customer.city == city)
        if search:
            search_pattern = f"%{search}%"
            query = query.filter(
                (Customer.customer_code.ilike(search_pattern)) |
                (Customer.city.ilike(search_pattern)) |
                (Customer.subscription_type.ilike(search_pattern))
            )

        total = query.count()
        items = query.offset((page - 1) * size).limit(size).all()
        return total, items

    def get_all_for_org(self, db: Session, organization_id: str, app_type: Optional[str] = None) -> List[Customer]:
        query = db.query(Customer).filter(Customer.organization_id == organization_id)
        if app_type:
            query = query.filter(Customer.app_type == app_type)
        return query.all()

    def bulk_insert(self, db: Session, customer_dicts: List[dict]) -> int:
        db.bulk_insert_mappings(Customer, customer_dicts)
        db.commit()
        return len(customer_dicts)


customer_repo = CustomerRepository()
