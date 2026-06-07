"""
User ORM model.
"""

from datetime import datetime

from sqlalchemy import (
    ARRAY,
    Boolean,
    DateTime,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)

    # Profile
    display_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    bio: Mapped[str | None] = mapped_column(Text, nullable=True)
    avatar_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    language_preference: Mapped[str] = mapped_column(String(10), default="en", nullable=False)
    interests: Mapped[list[str] | None] = mapped_column(ARRAY(Text), nullable=True)

    # Status
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Password reset
    password_reset_token: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)
    password_reset_expires: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    posts: Mapped[list["Post"]] = relationship("Post", back_populates="author", foreign_keys="Post.author_id")  # type: ignore[name-defined]  # noqa: F821
    reactions: Mapped[list["Reaction"]] = relationship("Reaction", back_populates="user")  # type: ignore[name-defined]  # noqa: F821
    community_memberships: Mapped[list["CommunityMember"]] = relationship("CommunityMember", back_populates="user")  # type: ignore[name-defined]  # noqa: F821
    notifications_received: Mapped[list["Notification"]] = relationship(  # type: ignore[name-defined]  # noqa: F821
        "Notification", back_populates="recipient", foreign_keys="Notification.recipient_id"
    )
