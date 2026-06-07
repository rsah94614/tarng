"""
Pydantic schemas for Notification endpoints.
"""
from datetime import datetime

from pydantic import BaseModel


class NotificationOut(BaseModel):
    id: int
    notification_type: str  # reply | mention | community_join
    message: str
    is_read: bool
    actor_id: int | None
    actor_username: str | None = None
    actor_avatar_url: str | None = None
    post_id: int | None
    community_id: int | None
    created_at: datetime

    model_config = {"from_attributes": True}


class NotificationListOut(BaseModel):
    items: list[NotificationOut]
    total: int
    unread_count: int
