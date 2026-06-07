"""
Notification endpoints.
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user_id, get_db
from app.schemas.notification import NotificationListOut, NotificationOut
from app.services import notification_service

router = APIRouter()


@router.get("", response_model=NotificationListOut)
async def get_notifications(
    skip: int = Query(0, ge=0),
    limit: int = Query(30, ge=1, le=100),
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> NotificationListOut:
    """List notifications for the current user, newest first."""
    items, total, unread_count = notification_service.get_notifications(
        db, user_id, skip=skip, limit=limit
    )
    out_items = []
    for n in items:
        out_items.append(NotificationOut(
            id=n.id,
            notification_type=n.notification_type,
            message=n.message,
            is_read=n.is_read,
            actor_id=n.actor_id,
            actor_username=n.actor.username if n.actor else None,
            actor_avatar_url=n.actor.avatar_url if n.actor else None,
            post_id=n.post_id,
            community_id=n.community_id,
            created_at=n.created_at,
        ))
    return NotificationListOut(items=out_items, total=total, unread_count=unread_count)


@router.patch("/read-all", response_model=dict)
async def mark_all_read(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> dict:
    """Mark all notifications as read."""
    count = notification_service.mark_all_read(db, user_id)
    return {"marked_read": count}


@router.patch("/{notification_id}/read", response_model=dict)
async def mark_one_read(
    notification_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> dict:
    """Mark a single notification as read."""
    ok = notification_service.mark_notification_read(db, notification_id, user_id)
    if not ok:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"marked_read": True}
