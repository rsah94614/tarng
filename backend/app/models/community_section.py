"""
CommunitySection ORM model — dynamic sections within a Wave.
"""

from datetime import datetime

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
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base


class CommunitySection(Base):
    """
    A section within a Wave (community).

    Section types:
      - feed: Standard post feed
      - discussion: Threaded discussions
      - members: Member list (built-in, no posts)
      - about: Community info (built-in, no posts)
      - announcements: Official posts (admin-only posting)
      - resources: Links/files
      - custom: User-defined (renders as generic feed)
    """

    __tablename__ = "community_sections"

    __table_args__ = (
        UniqueConstraint("community_id", "slug", name="uq_community_section_slug"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    community_id: Mapped[int] = mapped_column(
        ForeignKey("communities.id", ondelete="CASCADE"), nullable=False, index=True
    )

    section_type: Mapped[str] = mapped_column(
        String(50), nullable=False
    )  # feed | discussion | members | about | announcements | resources | custom

    name: Mapped[str] = mapped_column(String(100), nullable=False)
    slug: Mapped[str] = mapped_column(String(120), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    icon: Mapped[str | None] = mapped_column(String(50), nullable=True)  # lucide icon name

    position: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_default: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_visible: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    config: Mapped[dict | None] = mapped_column(JSONB, default=dict, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    community: Mapped["Community"] = relationship(  # type: ignore[name-defined]  # noqa: F821
        "Community", back_populates="sections"
    )
    posts: Mapped[list["Post"]] = relationship(  # type: ignore[name-defined]  # noqa: F821
        "Post", back_populates="section"
    )
