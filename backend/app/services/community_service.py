"""
Community (Wave) service — nesting, sections, templates, permissions.
"""

import logging
import re

from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.models.community import Community, CommunityMember
from app.models.community_section import CommunitySection
from app.models.community_template import CommunityTemplate
from app.schemas.community import CommunityCreate, SectionCreate

logger = logging.getLogger(__name__)

MAX_DEPTH = 3

# ─── Default sections created for every Wave ─────────────────

DEFAULT_SECTIONS = [
    {"name": "Feed", "section_type": "feed", "icon": "rss", "position": 0, "is_default": True},
    {"name": "Discussions", "section_type": "discussion", "icon": "message-circle", "position": 1, "is_default": True},
    {"name": "Members", "section_type": "members", "icon": "users", "position": 2, "is_default": True},
    {"name": "About", "section_type": "about", "icon": "info", "position": 3, "is_default": True},
]

VALID_SECTION_TYPES = {"feed", "discussion", "members", "about", "announcements", "resources", "custom"}


# ─── Helpers ──────────────────────────────────────────────────


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


def _unique_section_slug(db: Session, community_id: int, base_slug: str) -> str:
    slug = base_slug
    counter = 1
    while (
        db.query(CommunitySection)
        .filter(CommunitySection.community_id == community_id, CommunitySection.slug == slug)
        .first()
    ):
        slug = f"{base_slug}-{counter}"
        counter += 1
    return slug


# ─── Permissions ──────────────────────────────────────────────


def get_member_role(db: Session, community_id: int, user_id: int) -> str | None:
    """Get the user's role in a community, or None if not a member."""
    member = (
        db.query(CommunityMember)
        .filter(CommunityMember.community_id == community_id, CommunityMember.user_id == user_id)
        .first()
    )
    return member.role if member else None


def can_manage_wave(role: str | None) -> bool:
    return role in ("owner", "admin")


def can_moderate(role: str | None) -> bool:
    return role in ("owner", "admin", "moderator")


def can_create_sub_wave(role: str | None, current_depth: int) -> bool:
    return role in ("owner", "admin") and current_depth < MAX_DEPTH


def can_post_in_section(role: str | None, section_type: str) -> bool:
    if section_type == "announcements":
        return role in ("owner", "admin")
    return role is not None  # any member can post


# ─── Community CRUD ───────────────────────────────────────────


def create_community(db: Session, payload: CommunityCreate, creator_id: int) -> Community:
    """
    Create a Wave with default sections + optional template sections.
    If parent_id is set, creates a sub-Wave with depth/path validation.
    """
    parent = None
    depth = 0
    path = ""

    if payload.parent_id:
        parent = get_community_by_id(db, payload.parent_id)
        if not parent:
            raise ValueError("Parent Wave not found")
        if parent.depth >= MAX_DEPTH:
            raise ValueError(f"Maximum nesting depth of {MAX_DEPTH} reached")
        depth = parent.depth + 1

    base_slug = _slugify(payload.name)
    slug = _unique_slug(db, base_slug)

    community = Community(
        name=payload.name,
        slug=slug,
        description=payload.description,
        is_public=payload.is_public,
        created_by_id=creator_id,
        parent_id=payload.parent_id,
        depth=depth,
        template_id=payload.template_id,
    )
    db.add(community)
    db.flush()  # get ID before building path and adding members/sections

    # Build materialized path
    if parent:
        community.path = f"{parent.path}.{community.id}" if parent.path else str(community.id)
    else:
        community.path = str(community.id)

    # Auto-join creator as owner
    membership = CommunityMember(
        community_id=community.id,
        user_id=creator_id,
        role="owner",
    )
    db.add(membership)

    # Create default sections
    _create_default_sections(db, community.id)

    # Create template sections if template_id specified
    if payload.template_id:
        _create_template_sections(db, community.id, payload.template_id)

    db.commit()
    db.refresh(community)
    return community


def update_community(db: Session, community_id: int, payload: dict) -> Community | None:
    community = get_community_by_id(db, community_id)
    if not community:
        return None
    if "name" in payload and payload["name"] is not None:
        community.name = payload["name"]
    if "description" in payload:
        community.description = payload["description"]
    if "is_public" in payload and payload["is_public"] is not None:
        community.is_public = payload["is_public"]
    if "avatar_url" in payload:
        community.avatar_url = payload["avatar_url"]
    if "banner_url" in payload:
        community.banner_url = payload["banner_url"]
        
    db.commit()
    db.refresh(community)
    return community


def archive_community(db: Session, community_id: int) -> bool:
    community = get_community_by_id(db, community_id)
    if not community:
        return False
    community.is_archived = True
    db.commit()
    return True


def get_community_by_slug(db: Session, slug: str) -> Community | None:
    return (
        db.query(Community)
        .options(joinedload(Community.sections), joinedload(Community.members))
        .filter(Community.slug == slug, Community.is_archived.is_(False))
        .first()
    )


def get_community_by_id(db: Session, community_id: int) -> Community | None:
    return (
        db.query(Community)
        .options(joinedload(Community.sections), joinedload(Community.members))
        .filter(Community.id == community_id, Community.is_archived.is_(False))
        .first()
    )


def list_communities(db: Session, skip: int = 0, limit: int = 20) -> tuple[list[Community], int]:
    """List public root-level Waves (no parents)."""
    q = (
        db.query(Community)
        .options(joinedload(Community.sections), joinedload(Community.members))
        .filter(Community.is_public.is_(True), Community.is_archived.is_(False), Community.parent_id.is_(None))
    )
    total = q.count()
    communities = q.order_by(Community.created_at.desc()).offset(skip).limit(limit).all()
    return communities, total


# ─── Nesting ─────────────────────────────────────────────────


def get_children(db: Session, community_id: int) -> list[Community]:
    """Get direct child Waves."""
    return (
        db.query(Community)
        .options(joinedload(Community.sections), joinedload(Community.members))
        .filter(Community.parent_id == community_id, Community.is_archived.is_(False))
        .order_by(Community.created_at.asc())
        .all()
    )


def get_ancestors(db: Session, community: Community) -> list[Community]:
    """
    Get ancestor chain using the materialized path.
    Returns list from root to immediate parent (excludes self).
    """
    if not community.path:
        return []

    path_ids = [int(x) for x in community.path.split(".")]
    # Remove self from path
    if path_ids and path_ids[-1] == community.id:
        path_ids = path_ids[:-1]

    if not path_ids:
        return []

    ancestors = (
        db.query(Community)
        .filter(Community.id.in_(path_ids))
        .all()
    )
    # Sort by depth to maintain order
    ancestors.sort(key=lambda c: c.depth)
    return ancestors


# ─── Membership ───────────────────────────────────────────────


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


def get_members(db: Session, community_id: int) -> list[CommunityMember]:
    """Get all members of a community with user data."""
    return (
        db.query(CommunityMember)
        .options(joinedload(CommunityMember.user))
        .filter(CommunityMember.community_id == community_id)
        .order_by(CommunityMember.joined_at.asc())
        .all()
    )


def update_member_role(
    db: Session, community_id: int, target_user_id: int, new_role: str, actor_role: str
) -> CommunityMember | None:
    """Change a member's role. Only owner/admin can do this. Cannot change owner role."""
    if not can_manage_wave(actor_role):
        return None

    member = (
        db.query(CommunityMember)
        .filter(CommunityMember.community_id == community_id, CommunityMember.user_id == target_user_id)
        .first()
    )
    if not member:
        return None
    if member.role == "owner":
        return None  # cannot demote the owner

    member.role = new_role
    db.commit()
    db.refresh(member)
    return member


def remove_member(db: Session, community_id: int, target_user_id: int, actor_role: str) -> bool:
    if not can_manage_wave(actor_role):
        return False

    member = (
        db.query(CommunityMember)
        .filter(CommunityMember.community_id == community_id, CommunityMember.user_id == target_user_id)
        .first()
    )
    if not member or member.role == "owner":
        return False

    db.delete(member)
    db.commit()
    return True


# ─── Sections ─────────────────────────────────────────────────


def _create_default_sections(db: Session, community_id: int) -> None:
    """Create the universal default sections for a Wave."""
    for section_def in DEFAULT_SECTIONS:
        slug = _slugify(section_def["name"])
        section = CommunitySection(
            community_id=community_id,
            section_type=section_def["section_type"],
            name=section_def["name"],
            slug=slug,
            icon=section_def.get("icon"),
            position=section_def["position"],
            is_default=section_def["is_default"],
        )
        db.add(section)


def _create_template_sections(db: Session, community_id: int, template_id: int) -> None:
    """Create additional sections from a template."""
    template = db.query(CommunityTemplate).filter(CommunityTemplate.id == template_id).first()
    if not template or not template.sections:
        return

    # Start position after defaults
    start_pos = len(DEFAULT_SECTIONS)
    for i, section_def in enumerate(template.sections):
        slug = _unique_section_slug(db, community_id, _slugify(section_def.get("name", "section")))
        section = CommunitySection(
            community_id=community_id,
            section_type=section_def.get("section_type", "custom"),
            name=section_def["name"],
            slug=slug,
            icon=section_def.get("icon"),
            position=start_pos + i,
            is_default=False,
        )
        db.add(section)


def get_sections(db: Session, community_id: int) -> list[CommunitySection]:
    """Get ordered sections for a community."""
    return (
        db.query(CommunitySection)
        .filter(CommunitySection.community_id == community_id)
        .order_by(CommunitySection.position.asc())
        .all()
    )


def get_section_by_slug(db: Session, community_id: int, section_slug: str) -> CommunitySection | None:
    return (
        db.query(CommunitySection)
        .filter(CommunitySection.community_id == community_id, CommunitySection.slug == section_slug)
        .first()
    )


def create_section(db: Session, community_id: int, payload: SectionCreate) -> CommunitySection:
    """Create a custom section. Position is appended at the end."""
    max_pos = (
        db.query(func.max(CommunitySection.position))
        .filter(CommunitySection.community_id == community_id)
        .scalar()
        or 0
    )

    slug = _unique_section_slug(db, community_id, _slugify(payload.name))

    section = CommunitySection(
        community_id=community_id,
        section_type=payload.section_type if payload.section_type in VALID_SECTION_TYPES else "custom",
        name=payload.name,
        slug=slug,
        description=payload.description,
        icon=payload.icon,
        position=max_pos + 1,
        is_default=False,
    )
    db.add(section)
    db.commit()
    db.refresh(section)
    return section


def update_section(
    db: Session, community_id: int, section_slug: str, payload: dict
) -> CommunitySection | None:
    section = get_section_by_slug(db, community_id, section_slug)
    if not section:
        return None

    if "name" in payload and payload["name"] is not None:
        section.name = payload["name"]
    if "description" in payload:
        section.description = payload["description"]
    if "icon" in payload:
        section.icon = payload["icon"]
    if "is_visible" in payload and payload["is_visible"] is not None:
        section.is_visible = payload["is_visible"]

    db.commit()
    db.refresh(section)
    return section


def delete_section(db: Session, community_id: int, section_slug: str) -> bool:
    section = get_section_by_slug(db, community_id, section_slug)
    if not section:
        return False
    if section.is_default:
        return False  # cannot delete default sections
    db.delete(section)
    db.commit()
    return True


def reorder_sections(db: Session, community_id: int, section_ids: list[int]) -> list[CommunitySection]:
    """Reorder sections by setting position based on the order of IDs provided."""
    sections = get_sections(db, community_id)
    id_to_section = {s.id: s for s in sections}

    for i, sid in enumerate(section_ids):
        if sid in id_to_section:
            id_to_section[sid].position = i

    db.commit()
    return get_sections(db, community_id)


# ─── Templates ────────────────────────────────────────────────


def list_templates(db: Session) -> list[CommunityTemplate]:
    return db.query(CommunityTemplate).order_by(CommunityTemplate.name.asc()).all()


def get_template_by_id(db: Session, template_id: int) -> CommunityTemplate | None:
    return db.query(CommunityTemplate).filter(CommunityTemplate.id == template_id).first()


def create_template(db: Session, name: str, description: str | None, icon: str | None, sections: list[dict], is_system: bool = False) -> CommunityTemplate:
    slug = _slugify(name)
    counter = 1
    base_slug = slug
    while db.query(CommunityTemplate).filter(CommunityTemplate.slug == slug).first():
        slug = f"{base_slug}-{counter}"
        counter += 1

    template = CommunityTemplate(
        name=name,
        slug=slug,
        description=description,
        icon=icon,
        sections=sections,
        is_system=is_system,
    )
    db.add(template)
    db.commit()
    db.refresh(template)
    return template


def update_template(db: Session, template_id: int, payload: dict) -> CommunityTemplate | None:
    template = get_template_by_id(db, template_id)
    if not template:
        return None
    if "name" in payload and payload["name"] is not None:
        template.name = payload["name"]
    if "description" in payload:
        template.description = payload["description"]
    if "icon" in payload:
        template.icon = payload["icon"]
    if "sections" in payload and payload["sections"] is not None:
        template.sections = payload["sections"]
    db.commit()
    db.refresh(template)
    return template


def delete_template(db: Session, template_id: int) -> bool:
    template = get_template_by_id(db, template_id)
    if not template:
        return False
    if template.is_system:
        return False
    db.delete(template)
    db.commit()
    return True
