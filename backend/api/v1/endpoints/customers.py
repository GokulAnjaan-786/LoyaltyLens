from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session

from backend.db.session import get_db
from backend.api.deps import get_current_user
from backend.models.user import User
from backend.schemas.customer import CustomerListResponse, CustomerResponse
from backend.repositories.customer_repo import customer_repo
from backend.services.prediction_service import run_full_customer_analysis
from backend.services.gemini_service import gemini_service
from backend.services.dataset_import_service import parse_and_validate_dataset, prepare_dataset_for_db_import
from backend.schemas.admin import DatasetImportResponse

router = APIRouter()


@router.get("", response_model=CustomerListResponse, summary="List Organization Customers with Pagination")
def list_customers(
    app_type: Optional[str] = None,
    city: Optional[str] = None,
    search: Optional[str] = None,
    page: int = 1,
    size: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    total, customers = customer_repo.list_customers(
        db,
        organization_id=current_user.organization_id,
        app_type=app_type,
        city=city,
        search=search,
        page=page,
        size=size
    )

    items = []
    for c in customers:
        c_dict = {
            "login_days": c.login_days,
            "hours_spent": c.hours_spent,
            "support_tickets": c.support_tickets,
            "subscription_type": c.subscription_type,
            "orders_count": c.orders_count,
            "avg_delivery_delay_mins": c.avg_delivery_delay_mins,
            "app_rating": c.app_rating,
            "last_purchase_days": c.last_purchase_days,
            "cart_abandon_count": c.cart_abandon_count,
            "return_count": c.return_count,
            "last_active_days": c.last_active_days,
            "course_progress_percent": c.course_progress_percent,
            "avg_session_time": c.avg_session_time,
            "quiz_attempts": c.quiz_attempts,
            "customer_code": c.customer_code,
            "app_type": c.app_type
        }
        analysis = run_full_customer_analysis(c_dict, app_type=c.app_type)

        res = CustomerResponse(
            id=c.id,
            organization_id=c.organization_id,
            customer_code=c.customer_code,
            app_type=c.app_type,
            subscription_type=c.subscription_type,
            city=c.city,
            latitude=c.latitude,
            longitude=c.longitude,
            industry_type=c.industry_type,
            joining_date=c.joining_date,
            login_days=c.login_days,
            hours_spent=c.hours_spent,
            support_tickets=c.support_tickets,
            orders_count=c.orders_count,
            avg_delivery_delay_mins=c.avg_delivery_delay_mins,
            app_rating=c.app_rating,
            last_purchase_days=c.last_purchase_days,
            cart_abandon_count=c.cart_abandon_count,
            return_count=c.return_count,
            last_active_days=c.last_active_days,
            course_progress_percent=c.course_progress_percent,
            avg_session_time=c.avg_session_time,
            quiz_attempts=c.quiz_attempts,
            created_at=c.created_at,
            churn_probability=analysis["churn_probability"],
            risk_score=analysis["risk_score"],
            risk_level=analysis["risk_level"],
            reasons=analysis["reasons"],
            recommendations=analysis["recommendations"]
        )
        items.append(res)

    return CustomerListResponse(
        total=total,
        page=page,
        size=size,
        items=items
    )


@router.get("/{customer_id}", response_model=CustomerResponse, summary="Get Single Customer Profile 360")
def get_customer(
    customer_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    c = customer_repo.get_by_id(db, customer_id=customer_id, organization_id=current_user.organization_id)
    if not c:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")

    c_dict = {
        "login_days": c.login_days,
        "hours_spent": c.hours_spent,
        "support_tickets": c.support_tickets,
        "subscription_type": c.subscription_type,
        "orders_count": c.orders_count,
        "avg_delivery_delay_mins": c.avg_delivery_delay_mins,
        "app_rating": c.app_rating,
        "last_purchase_days": c.last_purchase_days,
        "cart_abandon_count": c.cart_abandon_count,
        "return_count": c.return_count,
        "last_active_days": c.last_active_days,
        "course_progress_percent": c.course_progress_percent,
        "avg_session_time": c.avg_session_time,
        "quiz_attempts": c.quiz_attempts,
        "customer_code": c.customer_code,
        "app_type": c.app_type
    }
    analysis = run_full_customer_analysis(c_dict, app_type=c.app_type)
    ai_narrative = gemini_service.generate_customer_explanation(c_dict, analysis)

    return CustomerResponse(
        id=c.id,
        organization_id=c.organization_id,
        customer_code=c.customer_code,
        app_type=c.app_type,
        subscription_type=c.subscription_type,
        city=c.city,
        latitude=c.latitude,
        longitude=c.longitude,
        industry_type=c.industry_type,
        joining_date=c.joining_date,
        login_days=c.login_days,
        hours_spent=c.hours_spent,
        support_tickets=c.support_tickets,
        orders_count=c.orders_count,
        avg_delivery_delay_mins=c.avg_delivery_delay_mins,
        app_rating=c.app_rating,
        last_purchase_days=c.last_purchase_days,
        cart_abandon_count=c.cart_abandon_count,
        return_count=c.return_count,
        last_active_days=c.last_active_days,
        course_progress_percent=c.course_progress_percent,
        avg_session_time=c.avg_session_time,
        quiz_attempts=c.quiz_attempts,
        created_at=c.created_at,
        churn_probability=analysis["churn_probability"],
        risk_score=analysis["risk_score"],
        risk_level=analysis["risk_level"],
        reasons=analysis["reasons"],
        recommendations=analysis["recommendations"],
        ai_explanation=ai_narrative
    )


@router.post("/import", response_model=DatasetImportResponse, summary="Import Customer Dataset CSV / XLSX")
async def import_dataset(
    file: UploadFile = File(...),
    app_type: str = Form("Food Delivery App"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    contents = await file.read()
    val_res = parse_and_validate_dataset(contents, file.filename, app_type=app_type)

    if not val_res["success"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=val_res["error"])

    # Re-parse into DF for conversion
    import io
    import pandas as pd
    if file.filename.endswith('.csv'):
        df = pd.read_csv(io.BytesIO(contents))
    else:
        df = pd.read_excel(io.BytesIO(contents))

    db_records = prepare_dataset_for_db_import(df, current_user.organization_id, app_type=app_type)
    imported_count = customer_repo.bulk_insert(db, db_records)

    return DatasetImportResponse(
        dataset_id="import-" + file.filename,
        filename=file.filename,
        total_rows=val_res["total_rows"],
        valid_rows=val_res["valid_rows"],
        invalid_rows=val_res["invalid_rows"],
        imported_rows=imported_count,
        status="IMPORTED",
        errors=val_res["errors"]
    )
