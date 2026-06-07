"""
Community (Wave) ORM models.
"""

from datetime import datetime
from typing import Optional

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base


class Community(Base):
    __tablename__ = "communities"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    slug: Mapped[str] = mapped_column(String(120), unique=True, index=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    avatar_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    banner_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    is_public: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    created_by_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    creator: Mapped[Optional["User"]] = relationship("User", foreign_keys=[created_by_id])  # type: ignore[name-defined]  # noqa: F821
    members: Mapped[list["CommunityMember"]] = relationship(
        "CommunityMember", back_populates="community"
    )
    posts: Mapped[list["Post"]] = relationship("Post", back_populates="community")  # type: ignore[name-defined]  # noqa: F821

    @property
    def member_count(self) -> int:
        return len(self.members)


class CommunityMember(Base):
    __tablename__ = "community_members"

    __table_args__ = (UniqueConstraint("community_id", "user_id", name="uq_community_member"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    community_id: Mapped[int] = mapped_column(
        ForeignKey("communities.id", ondelete="CASCADE"), nullable=False
    )
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    role: Mapped[str] = mapped_column(
        String(20), default="member", nullable=False
    )  # owner | moderator | member

    joined_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    community: Mapped["Community"] = relationship("Community", back_populates="members")
    user: Mapped["User"] = relationship("User", back_populates="community_memberships")  # type: ignore[name-defined]  # noqa: F821
