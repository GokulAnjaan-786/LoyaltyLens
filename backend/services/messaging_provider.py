import os
import smtplib
import uuid
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)


class MessagingProviderService:
    """
    Handles message dispatch for customer retention campaigns.
    Supports real SMTP/Email dispatch when credentials are configured,
    and provides a safe, fully functional Dry-Run mode for local/testing environments.
    Never exposes provider secrets in frontend code.
    """

    def __init__(self):
        self.smtp_host = os.getenv("SMTP_HOST")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        self.smtp_user = os.getenv("SMTP_USER")
        self.smtp_pass = os.getenv("SMTP_PASSWORD")
        self.from_email = os.getenv("SMTP_FROM_EMAIL", "retention@loyaltylens.com")

    def is_provider_configured(self) -> bool:
        """Returns True if external email provider credentials are provided."""
        return bool(self.smtp_host and self.smtp_user and self.smtp_pass)

    def get_provider_status(self) -> Dict[str, Any]:
        """Returns public status of messaging integrations (without exposing credentials)."""
        configured = self.is_provider_configured()
        return {
            "configured": configured,
            "provider_type": "SMTP" if configured else "DRY_RUN_SANDBOX",
            "from_address": self.from_email if configured else "sandbox@loyaltylens.local",
            "dry_run_only": not configured,
            "description": (
                "Real SMTP messaging provider active."
                if configured
                else "Dry-run execution mode active. External delivery credentials not configured in environment."
            )
        }

    def send_retention_message(
        self,
        recipient_email: str,
        subject: str,
        body: str,
        customer_code: str,
        is_dry_run: bool = True
    ) -> Dict[str, Any]:
        """
        Dispatches or simulates message delivery to a single campaign recipient.
        """
        # If dry run requested or provider not configured, execute safely in dry run
        if is_dry_run or not self.is_provider_configured():
            logger.info(
                f"[DRY RUN DISPATCH] Target: {customer_code} ({recipient_email}) | Subject: {subject}"
            )
            return {
                "success": True,
                "is_dry_run": True,
                "provider": "DRY_RUN",
                "message_id": f"dry_{uuid.uuid4().hex[:12]}",
                "status": "DELIVERED",
                "error": None
            }

        # Real SMTP Delivery attempt
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = self.from_email
            msg["To"] = recipient_email
            msg["X-LoyaltyLens-Customer"] = customer_code

            # Attach plain text and HTML versions
            part1 = MIMEText(body, "plain")
            part2 = MIMEText(f"<div style='font-family: sans-serif; line-height: 1.5;'>{body.replace(chr(10), '<br/>')}</div>", "html")
            msg.attach(part1)
            msg.attach(part2)

            with smtplib.SMTP(self.smtp_host, self.smtp_port, timeout=10) as server:
                server.starttls()
                server.login(self.smtp_user, self.smtp_pass)
                server.sendmail(self.from_email, recipient_email, msg.as_string())

            logger.info(f"[REAL DISPATCH SUCCESS] Target: {customer_code} ({recipient_email})")
            return {
                "success": True,
                "is_dry_run": False,
                "provider": "SMTP",
                "message_id": f"smtp_{uuid.uuid4().hex[:12]}",
                "status": "DELIVERED",
                "error": None
            }
        except Exception as e:
            error_msg = f"SMTP dispatch failed: {str(e)}"
            logger.error(f"[REAL DISPATCH FAILED] Target: {customer_code} - {error_msg}")
            return {
                "success": False,
                "is_dry_run": False,
                "provider": "SMTP",
                "message_id": None,
                "status": "FAILED",
                "error": error_msg
            }


messaging_provider = MessagingProviderService()
