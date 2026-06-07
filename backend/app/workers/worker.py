"""
Arq background worker.

Define async task functions here. Register them in WorkerSettings.
Run with: arq app.workers.worker.WorkerSettings
"""
import logging

from arq.connections import RedisSettings

from app.core.config import settings

logger = logging.getLogger(__name__)


# ─── Task Functions ───────────────────────────────────────────
async def send_email_task(ctx: dict, to: str, subject: str, body: str) -> None:
    """Background task: send an email."""
    logger.info(f"Sending email to {to}: {subject}")
    # TODO: implement with smtplib or emails library
    pass


async def process_media_task(ctx: dict, media_id: int) -> None:
    """Background task: post-process uploaded media (thumbnail, transcoding)."""
    logger.info(f"Processing media: id={media_id}")
    # TODO: implement media processing
    pass


async def send_notification_task(ctx: dict, user_id: int, notification: dict) -> None:
    """Background task: persist and push notification to user."""
    logger.info(f"Notification for user {user_id}: {notification}")
    # TODO: save to DB and push via WebSocket/Redis Pub/Sub
    pass


# ─── Startup / Shutdown ───────────────────────────────────────
async def startup(ctx: dict) -> None:
    logger.info("Arq worker starting up")


async def shutdown(ctx: dict) -> None:
    logger.info("Arq worker shutting down")


# ─── Worker Settings ──────────────────────────────────────────
class WorkerSettings:
    functions = [
        send_email_task,
        process_media_task,
        send_notification_task,
    ]
    on_startup = startup
    on_shutdown = shutdown
    redis_settings = RedisSettings.from_dsn(settings.REDIS_URL)
    max_jobs = 10
    job_timeout = 300  # seconds
