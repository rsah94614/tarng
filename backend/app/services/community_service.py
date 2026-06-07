"""
Community (Wave) service.
"""

import logging
import re

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.community import Community, CommunityMember
from app.schemas.community import CommunityCreate

logger = logging.getLogger(__name__)


def _slugify(name: str) -> str:
    slug = name.lower().strip()
    slug = re.sub(r"[^\w\s-]", "", slug)
    slug = re.sub(r"[\s_-]+", "-", slug)
    slug = slug.strip("-")
    return slug


def _unique_slug(db: Session, base_slug: str) -> str:
    slug = base_slug
    counter = 1
    while db.query(Community).filter(Community.slug == slug).first():
        slug = f"{base_slug}-{counter}"
        counter += 1
    return slug


def create_community(db: Session, payload: CommunityCreate, creator_id: int) -> Community:
    base_slug = _slugify(payload.name)
    slug = _unique_slug(db, base_slug)

    community = Community(
        name=payload.name,
        slug=slug,
        description=payload.description,
        is_public=payload.is_public,
        created_by_id=creator_id,
    )
    db.add(community)
    db.flush()  # get ID before adding member

    # Auto-join creator as owner
    membership = CommunityMember(
        community_id=community.id,
        user_id=creator_id,
        role="owner",
    )
    db.add(membership)
    db.commit()
    db.refresh(community)
    return community


def get_community_by_slug(db: Session, slug: str) -> Community | None:
    return db.query(Community).filter(Community.slug == slug).first()


def get_community_by_id(db: Session, community_id: int) -> Community | None:
    return db.query(Community).filter(Community.id == community_id).first()


def list_communities(db: Session, skip: int = 0, limit: int = 20) -> tuple[list[Community], int]:
    total = db.query(func.count(Community.id)).scalar() or 0
    communities = (
        db.query(Community)
        .filter(Community.is_public.is_(True))
        .order_by(Community.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return communities, total


def join_community(db: Session, community_id: int, user_id: int) -> CommunityMember:
    existing = (
        db.query(CommunityMember)
        .filter(CommunityMember.community_id == community_id, CommunityMember.user_id == user_id)
        .first()
    )
    if existing:
        return existing

    membership = CommunityMember(
        community_id=community_id,
        user_id=user_id,
        role="member",
    )
    db.add(membership)
    db.commit()
    db.refresh(membership)
    return membership


def leave_community(db: Session, community_id: int, user_id: int) -> bool:
    membership = (
        db.query(CommunityMember)
        .filter(CommunityMember.community_id == community_id, CommunityMember.user_id == user_id)
        .first()
    )
    if not membership or membership.role == "owner":
        return False
    db.delete(membership)
    db.commit()
    return True


def is_member(db: Session, community_id: int, user_id: int) -> bool:
    return (
        db.query(CommunityMember)
        .filter(CommunityMember.community_id == community_id, CommunityMember.user_id == user_id)
        .first()
    ) is not None


def get_member_count(db: Session, community_id: int) -> int:
    return (
        db.query(func.count(CommunityMember.id))
        .filter(CommunityMember.community_id == community_id)
        .scalar()
        or 0
    )
