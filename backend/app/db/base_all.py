"""
Import all models here so Alembic autogenerate can detect them.
"""

from app.db.base_class import Base  # noqa: F401
from app.models.community import Community, CommunityMember  # noqa: F401
from app.models.notification import Notification  # noqa: F401
from app.models.post import Post, Reaction  # noqa: F401
from app.models.user import User  # noqa: F401
