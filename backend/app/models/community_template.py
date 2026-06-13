"""
CommunityTemplate ORM model — data-driven, customizable templates for Waves.

Templates define a set of extra sections that get auto-created when a Wave
is created with that template. Admins can create/edit templates freely.
"""

from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base_class import Base


class CommunityTemplate(Base):
    """
    A reusable template that defines which extra sections a Wave gets on creation.

    The `sections` JSONB column stores an ordered list of section definitions:
    [
        {"name": "Announcements", "section_type": "announcements", "icon": "megaphone"},
        {"name": "Study Materials", "section_type": "resources", "icon": "book-open"},
        ...
    ]

    Templates are fully user-managed — the system seeds a few defaults but admins
    can create, edit, or delete any template.
    """

    __tablename__ = "community_templates"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    slug: Mapped[str] = mapped_column(String(120), unique=True, index=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    icon: Mapped[str | None] = mapped_column(String(50), nullable=True)  # lucide icon name

    # Ordered list of section definitions
    sections: Mapped[list | None] = mapped_column(JSONB, default=list, nullable=False)

    is_system: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )  # system-provided templates (can't be deleted by non-superadmins)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )
