import sys
import os
import random
from datetime import datetime, timedelta, timezone

# Ensure UTF-8 output on Windows console
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8')

# Add parent directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from backend.db.session import SessionLocal, engine, Base
from backend.models import Organization, User, UserRole, Customer, Campaign, CampaignStatus
from backend.core.security import get_password_hash
from utils.geodata import get_lat_lon
from ml.training.train import train_and_save_model


def seed_database():
    print("[+] Seeding LoyaltyLens database...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Check existing organization
        org = db.query(Organization).filter(Organization.slug == "acme-retain-org").first()
        if not org:
            org = Organization(
                name="Acme Retention SaaS",
                slug="acme-retain-org",
                industry="Food Delivery App"
            )
            db.add(org)
            db.commit()
            db.refresh(org)
            print(f"[OK] Created Demo Organization: {org.name} ({org.id})")

        # Check existing admin user
        admin = db.query(User).filter(User.email == "admin@loyaltylens.com").first()
        if not admin:
            admin = User(
                email="admin@loyaltylens.com",
                hashed_password=get_password_hash("admin"),
                full_name="LoyaltyLens Admin",
                role=UserRole.ADMIN,
                organization_id=org.id
            )
            db.add(admin)
            print("[OK] Created Admin User: admin@loyaltylens.com / admin")

        analyst = db.query(User).filter(User.email == "analyst@loyaltylens.com").first()
        if not analyst:
            analyst = User(
                email="analyst@loyaltylens.com",
                hashed_password=get_password_hash("analyst123"),
                full_name="Senior Analyst",
                role=UserRole.ANALYST,
                organization_id=org.id
            )
            db.add(analyst)
            print("[OK] Created Analyst User: analyst@loyaltylens.com / analyst123")

        db.commit()

        # Seed Customers if empty
        existing_cust_count = db.query(Customer).filter(Customer.organization_id == org.id).count()
        if existing_cust_count == 0:
            print("[+] Generating 150 synthetic customer profiles with Indian city coordinates...")
            cities = [
                "Mumbai", "Delhi", "Bangalore", "Hyderabad", "Ahmedabad", "Chennai",
                "Kolkata", "Surat", "Pune", "Jaipur", "Lucknow", "Kanpur", "Nagpur",
                "Indore", "Thane", "Bhopal", "Visakhapatnam", "Patna", "Vadodara",
                "Coimbatore", "Trichy", "Madurai", "Kochi", "Mysore", "Gurgaon", "Noida"
            ]
            
            customers = []
            for i in range(1, 151):
                city_name = random.choice(cities)
                lat, lon = get_lat_lon(city_name)
                joining = datetime.now(timezone.utc) - timedelta(days=random.randint(10, 300))

                c = Customer(
                    organization_id=org.id,
                    customer_code=f"CUST-{1000 + i}",
                    app_type="Food Delivery App",
                    subscription_type=random.choice(["Free", "Basic", "Premium"]),
                    city=city_name,
                    latitude=lat,
                    longitude=lon,
                    industry_type="Food Delivery",
                    joining_date=joining,
                    login_days=random.randint(1, 25),
                    hours_spent=random.uniform(5.0, 150.0),
                    support_tickets=random.randint(0, 5),
                    orders_count=random.randint(1, 20),
                    avg_delivery_delay_mins=random.randint(10, 60),
                    app_rating=round(random.uniform(1.5, 5.0), 1),
                    last_purchase_days=random.randint(1, 45),
                    cart_abandon_count=random.randint(0, 6),
                    return_count=random.randint(0, 4),
                    last_active_days=random.randint(1, 20),
                    course_progress_percent=round(random.uniform(5.0, 95.0), 1),
                    avg_session_time=round(random.uniform(5.0, 90.0), 1),
                    quiz_attempts=random.randint(0, 5)
                )
                customers.append(c)
            
            db.bulk_save_objects(customers)
            db.commit()
            print("[OK] Seeded 150 customer records.")

        # Seed sample campaigns
        existing_campaigns = db.query(Campaign).filter(Campaign.organization_id == org.id).count()
        if existing_campaigns == 0:
            c1 = Campaign(
                organization_id=org.id,
                name="Chennai Reactivation Offer",
                description="Targeting high-risk food app users in Chennai with 50% discount",
                target_segment="Chennai Users",
                target_risk_level="HIGH",
                offer="50% OFF Next Order",
                action_strength="High",
                status=CampaignStatus.ACTIVE,
                target_customer_count=35,
                expected_saved_count=12,
                expected_risk_reduction_pct=25.0,
                estimated_cost_inr=600.0,
                start_date=datetime.now(timezone.utc),
                end_date=datetime.now(timezone.utc) + timedelta(days=14)
            )
            db.add(c1)
            db.commit()
            print("[OK] Seeded sample campaigns.")

        # Train ML model baseline
        train_and_save_model()

        print("[SUCCESS] Database seeding finished successfully!")

    except Exception as e:
        print(f"[ERROR] Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
