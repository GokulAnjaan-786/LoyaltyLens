from typing import List, Optional, Tuple, Dict, Any
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import or_

from backend.models.campaign import Campaign, CampaignResult, CampaignStatus, CampaignRecipient, RecipientStatus


class CampaignRepository:
    def get_by_id(self, db: Session, campaign_id: str, organization_id: str) -> Optional[Campaign]:
        return db.query(Campaign).filter(
            Campaign.id == campaign_id,
            Campaign.organization_id == organization_id
        ).first()

    def list_campaigns(
        self,
        db: Session,
        organization_id: str,
        status: Optional[str] = None,
        search: Optional[str] = None
    ) -> List[Campaign]:
        query = db.query(Campaign).filter(Campaign.organization_id == organization_id)

        if status and status != "ALL":
            query = query.filter(Campaign.status == status)

        if search:
            search_pat = f"%{search}%"
            query = query.filter(
                or_(
                    Campaign.name.ilike(search_pat),
                    Campaign.objective.ilike(search_pat),
                    Campaign.offer.ilike(search_pat),
                    Campaign.target_segment.ilike(search_pat)
                )
            )

        return query.order_by(Campaign.created_at.desc()).all()

    def create_campaign(self, db: Session, campaign_data: dict) -> Campaign:
        campaign = Campaign(**campaign_data)
        db.add(campaign)
        db.commit()
        db.refresh(campaign)
        return campaign

    def update_campaign(
        self,
        db: Session,
        campaign_id: str,
        organization_id: str,
        update_data: Dict[str, Any]
    ) -> Optional[Campaign]:
        campaign = self.get_by_id(db, campaign_id, organization_id)
        if not campaign:
            return None

        # Filter out None values
        for k, v in update_data.items():
            if v is not None and hasattr(campaign, k):
                setattr(campaign, k, v)

        campaign.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(campaign)
        return campaign

    def delete_campaign(self, db: Session, campaign_id: str, organization_id: str) -> bool:
        campaign = self.get_by_id(db, campaign_id, organization_id)
        if not campaign:
            return False

        # Only allow deleting drafts, simulated, or cancelled campaigns
        if campaign.status not in [CampaignStatus.DRAFT, CampaignStatus.SIMULATED, CampaignStatus.CANCELLED]:
            raise ValueError(f"Cannot delete campaign in '{campaign.status.value}' state. Active or completed campaigns must be cancelled or preserved for audit.")

        db.delete(campaign)
        db.commit()
        return True

    def update_status(
        self,
        db: Session,
        campaign_id: str,
        organization_id: str,
        new_status: CampaignStatus
    ) -> Optional[Campaign]:
        c = self.get_by_id(db, campaign_id, organization_id)
        if c:
            c.status = new_status
            c.updated_at = datetime.now(timezone.utc)
            db.commit()
            db.refresh(c)
        return c

    def record_approval(
        self,
        db: Session,
        campaign_id: str,
        organization_id: str,
        approved_by: str,
        notes: Optional[str] = None,
        is_approved: bool = True
    ) -> Optional[Campaign]:
        c = self.get_by_id(db, campaign_id, organization_id)
        if not c:
            return None

        if is_approved:
            c.status = CampaignStatus.APPROVED
            c.approved_by = approved_by
            c.approved_at = datetime.now(timezone.utc)
            c.approval_notes = notes
        else:
            c.status = CampaignStatus.DRAFT
            c.approval_notes = f"Rejected: {notes}" if notes else "Rejected by approver"

        c.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(c)
        return c

    def get_recipients(
        self,
        db: Session,
        campaign_id: str,
        status: Optional[str] = None,
        search: Optional[str] = None,
        page: int = 1,
        size: int = 50
    ) -> Tuple[int, List[CampaignRecipient]]:
        query = db.query(CampaignRecipient).filter(CampaignRecipient.campaign_id == campaign_id)

        if status and status != "ALL":
            query = query.filter(CampaignRecipient.status == status)

        if search:
            search_pat = f"%{search}%"
            query = query.filter(
                or_(
                    CampaignRecipient.customer_code.ilike(search_pat),
                    CampaignRecipient.customer_email.ilike(search_pat)
                )
            )

        total = query.count()
        items = query.order_by(CampaignRecipient.created_at.desc()).offset((page - 1) * size).limit(size).all()
        return total, items


campaign_repo = CampaignRepository()
