"""
Post, Comment (nested via parent_id), and Reaction ORM models.
"""

from datetime import datetime
from typing import Optional

from sqlalchemy import (
    ARRAY,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base


class Post(Base):
    """
    Unified table for posts, comments, and replies.
    - parent_id = None  → top-level post
    - parent_id = post  → comment on that post
    - parent_id = comment → reply to that comment
    community_id is set only on top-level posts.
    """

    __tablename__ = "posts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    # Authorship
    author_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )

    # Community (only on root posts)
    community_id: Mapped[int | None] = mapped_column(
        ForeignKey("communities.id", ondelete="SET NULL"), nullable=True, index=True
    )

    # Section (which section this post belongs to)
    section_id: Mapped[int | None] = mapped_column(
        ForeignKey("community_sections.id", ondelete="SET NULL"), nullable=True, index=True
    )

    # Content
    content: Mapped[str] = mapped_column(Text, nullable=False)
    content_type: Mapped[str] = mapped_column(
        String(20), default="text", nullable=False
    )  # text | markdown
    image_urls: Mapped[list[str] | None] = mapped_column(ARRAY(Text), nullable=True)
    post_metadata: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    # Threading — self-referential
    parent_id: Mapped[int | None] = mapped_column(
        ForeignKey("posts.id", ondelete="CASCADE"), nullable=True, index=True
    )

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False, index=True
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    author: Mapped["User"] = relationship(  # type: ignore[name-defined]  # noqa: F821
        "User", back_populates="posts", foreign_keys=[author_id]
    )
    community: Mapped[Optional["Community"]] = relationship(  # type: ignore[name-defined]  # noqa: F821
        "Community", back_populates="posts"
    )
    section: Mapped[Optional["CommunitySection"]] = relationship(  # type: ignore[name-defined]  # noqa: F821
        "CommunitySection", back_populates="posts"
    )
    parent: Mapped[Optional["Post"]] = relationship(
        "Post", back_populates="children", remote_side="Post.id", foreign_keys=[parent_id]
    )
    children: Mapped[list["Post"]] = relationship(
        "Post", back_populates="parent", foreign_keys=[parent_id], cascade="all, delete-orphan"
    )
    reactions: Mapped[list["Reaction"]] = relationship(
        "Reaction", back_populates="post", cascade="all, delete-orphan"
    )
    notifications: Mapped[list["Notification"]] = relationship(  # type: ignore[name-defined]  # noqa: F821
        "Notification", back_populates="post"
    )
    poll: Mapped[Optional["Poll"]] = relationship(  # type: ignore[name-defined]  # noqa: F821
        "Poll", back_populates="post", uselist=False, cascade="all, delete-orphan"
    )
    event: Mapped[Optional["Event"]] = relationship(  # type: ignore[name-defined]  # noqa: F821
        "Event", back_populates="post", uselist=False, cascade="all, delete-orphan"
    )


class Reaction(Base):
    """Like / Insightful / Helpful — one per user per post."""

    __tablename__ = "reactions"

    __table_args__ = (UniqueConstraint("user_id", "post_id", name="uq_user_post_reaction"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    post_id: Mapped[int] = mapped_column(
        ForeignKey("posts.id", ondelete="CASCADE"), nullable=False, index=True
    )
    reaction_type: Mapped[str] = mapped_column(
        String(20), nullable=False  # like | insightful | helpful
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="reactions")  # type: ignore[name-defined]  # noqa: F821
    post: Mapped["Post"] = relationship("Post", back_populates="reactions")
