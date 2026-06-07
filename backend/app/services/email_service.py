"""
Email service — sends password reset emails.
Falls back to console logging if SMTP is not configured.
"""
import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.core.config import settings

logger = logging.getLogger(__name__)


def _smtp_configured() -> bool:
    return bool(settings.SMTP_HOST and settings.SMTP_USER and settings.SMTP_PASSWORD)


def send_password_reset_email(to_email: str, reset_token: str) -> None:
    """
    Send a password reset email.
    If SMTP is not configured, logs the reset link to the console.
    """
    # Use localhost:3000 for dev, override in prod via env
    base_url = "http://localhost:3000"
    reset_link = f"{base_url}/reset-password?token={reset_token}"

    subject = "Reset your tarng password"
    body_html = f"""
    <html><body>
    <h2>Password Reset</h2>
    <p>You requested a password reset for your tarng account.</p>
    <p><a href="{reset_link}" style="
        display:inline-block;padding:12px 24px;background:#6366f1;
        color:#fff;text-decoration:none;border-radius:8px;font-weight:600;
    ">Reset Password</a></p>
    <p>This link expires in <strong>1 hour</strong>.</p>
    <p>If you didn't request this, you can safely ignore this email.</p>
    </body></html>
    """
    body_text = f"Reset your tarng password: {reset_link}\n\nThis link expires in 1 hour."

    if not _smtp_configured():
        logger.warning("SMTP not configured — logging password reset link to console:")
        logger.info("=" * 60)
        logger.info(f"[PASSWORD RESET] To: {to_email}")
        logger.info(f"[PASSWORD RESET] Link: {reset_link}")
        logger.info("=" * 60)
        return

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{settings.EMAILS_FROM_NAME} <{settings.EMAILS_FROM_EMAIL}>"
        msg["To"] = to_email

        msg.attach(MIMEText(body_text, "plain"))
        msg.attach(MIMEText(body_html, "html"))

        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.ehlo()
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.EMAILS_FROM_EMAIL, to_email, msg.as_string())

        logger.info(f"Password reset email sent to {to_email}")
    except Exception as exc:
        logger.error(f"Failed to send password reset email: {exc}")
        # Don't raise — caller already returned 200 to avoid email enumeration
