from typing import List, Optional
from sqlalchemy.orm import Session
from backend.models.campaign import Campaign, CampaignResult, CampaignStatus


class CampaignRepository:
    def get_by_id(self, db: Session, campaign_id: str, organization_id: str) -> Optional[Campaign]:
        return db.query(Campaign).filter(
            Campaign.id == campaign_id,
            Campaign.organization_id == organization_id
        ).first()

    def list_campaigns(self, db: Session, organization_id: str) -> List[Campaign]:
        return db.query(Campaign).filter(Campaign.organization_id == organization_id).order_by(Campaign.created_at.desc()).all()

    def create_campaign(self, db: Session, campaign_data: dict) -> Campaign:
        campaign = Campaign(**campaign_data)
        db.add(campaign)
        db.commit()
        db.refresh(campaign)
        return campaign

    def update_status(self, db: Session, campaign_id: str, organization_id: str, new_status: CampaignStatus) -> Optional[Campaign]:
        c = self.get_by_id(db, campaign_id, organization_id)
        if c:
            c.status = new_status
            db.commit()
            db.refresh(c)
        return c


campaign_repo = CampaignRepository()
