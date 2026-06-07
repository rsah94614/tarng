"""
Notification ORM model.
"""

from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    recipient_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    actor_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    # Type: reply | mention | community_join
    notification_type: Mapped[str] = mapped_column(String(50), nullable=False)

    # Optional references
    post_id: Mapped[int | None] = mapped_column(
        ForeignKey("posts.id", ondelete="CASCADE"), nullable=True
    )
    community_id: Mapped[int | None] = mapped_column(
        ForeignKey("communities.id", ondelete="CASCADE"), nullable=True
    )

    message: Mapped[str] = mapped_column(Text, nullable=False)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False, index=True
    )

    # Relationships
    recipient: Mapped["User"] = relationship(  # type: ignore[name-defined]  # noqa: F821
        "User", back_populates="notifications_received", foreign_keys=[recipient_id]
    )
    actor: Mapped[Optional["User"]] = relationship(  # type: ignore[name-defined]  # noqa: F821
        "User", foreign_keys=[actor_id]
    )
    post: Mapped[Optional["Post"]] = relationship("Post", back_populates="notifications")  # type: ignore[name-defined]  # noqa: F821
    community: Mapped[Optional["Community"]] = relationship("Community")  # type: ignore[name-defined]  # noqa: F821
