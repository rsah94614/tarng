"""
Notification service — create, query, and push notifications via WebSocket.
"""
import json
import logging

from sqlalchemy.orm import Session, joinedload

from app.models.notification import Notification
from app.models.user import User

logger = logging.getLogger(__name__)


def create_notification(
    db: Session,
    recipient_id: int,
    notification_type: str,  # reply | mention | community_join
    message: str,
    actor_id: int | None = None,
    post_id: int | None = None,
    community_id: int | None = None,
) -> Notification:
    notif = Notification(
        recipient_id=recipient_id,
        actor_id=actor_id,
        notification_type=notification_type,
        message=message,
        post_id=post_id,
        community_id=community_id,
        is_read=False,
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)
    return notif


def get_notifications(
    db: Session,
    user_id: int,
    skip: int = 0,
    limit: int = 30,
) -> tuple[list[Notification], int, int]:
    """Returns (notifications, total, unread_count)."""
    base_q = db.query(Notification).filter(Notification.recipient_id == user_id)
    total = base_q.count()
    unread_count = base_q.filter(Notification.is_read.is_(False)).count()
    items = (
        base_q
        .options(joinedload(Notification.actor))
        .order_by(Notification.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return items, total, unread_count


def mark_notification_read(db: Session, notification_id: int, user_id: int) -> bool:
    notif = (
        db.query(Notification)
        .filter(Notification.id == notification_id, Notification.recipient_id == user_id)
        .first()
    )
    if not notif:
        return False
    notif.is_read = True
    db.commit()
    return True


def mark_all_read(db: Session, user_id: int) -> int:
    count = (
        db.query(Notification)
        .filter(Notification.recipient_id == user_id, Notification.is_read.is_(False))
        .update({"is_read": True})
    )
    db.commit()
    return count


async def push_notification_ws(notification: Notification, actor: User | None = None) -> None:
    """Publish notification to Redis so WebSocket handler picks it up."""
    try:
        payload = {
            "type": "notification",
            "payload": {
                "id": notification.id,
                "notification_type": notification.notification_type,
                "message": notification.message,
                "is_read": notification.is_read,
                "actor_id": notification.actor_id,
                "actor_username": actor.username if actor else None,
                "actor_avatar_url": actor.avatar_url if actor else None,
                "post_id": notification.post_id,
                "community_id": notification.community_id,
                "created_at": notification.created_at.isoformat(),
            },
        }

        from app.core.config import settings
        if settings.ENVIRONMENT == "development":
            # In single-instance dev mode, just push directly
            from app.websocket.manager import manager
            await manager.send_to_user(notification.recipient_id, payload)
        else:
            from app.db.redis import get_redis
            redis = await get_redis()
            channel = f"user:{notification.recipient_id}:notifications"
            await redis.publish(channel, json.dumps(payload))
    except Exception as exc:
        logger.warning(f"Failed to push WS notification: {exc}")
