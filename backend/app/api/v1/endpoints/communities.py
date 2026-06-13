"""
Community (Wave) endpoints — nesting, sections, templates, membership.
"""

import asyncio

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user_id, get_db
from app.models.community import Community
from app.schemas.community import (
    CommunityBrief,
    CommunityCreate,
    CommunityUpdate,
    CommunityMemberOut,
    CommunityOut,
    MemberRoleUpdate,
    SectionCreate,
    SectionOut,
    SectionReorder,
    SectionUpdate,
    TemplateCreate,
    TemplateOut,
    TemplateUpdate,
)
from app.schemas.post import PostOut
from app.services import community_service, notification_service, post_service, user_service
from app.services.post_service import build_post_out_data

router = APIRouter()


# ─── Helpers ──────────────────────────────────────────────────


def _get_community_or_404(slug: str, db: Session) -> Community:
    community = community_service.get_community_by_slug(db, slug)
    if not community:
        raise HTTPException(status_code=404, detail="Wave not found")
    return community


def _build_community_out(community: Community, db: Session) -> CommunityOut:
    return CommunityOut(
        id=community.id,
        name=community.name,
        slug=community.slug,
        description=community.description,
        avatar_url=community.avatar_url,
        banner_url=community.banner_url,
        is_public=community.is_public,
        created_by_id=community.created_by_id,
        parent_id=community.parent_id,
        depth=community.depth,
        path=community.path,
        template_id=community.template_id,
        is_archived=community.is_archived,
        member_count=community.member_count,
        children_count=community.children_count,
        sections=[SectionOut.model_validate(s) for s in community.sections],
        created_at=community.created_at,
    )


# ─── Templates ────────────────────────────────────────────────


@router.get("/templates", response_model=list[TemplateOut])
async def list_templates(db: Session = Depends(get_db)) -> list[TemplateOut]:
    """List all available community templates."""
    templates = community_service.list_templates(db)
    return [TemplateOut.model_validate(t) for t in templates]


@router.post("/templates", response_model=TemplateOut, status_code=status.HTTP_201_CREATED)
async def create_template(
    payload: TemplateCreate,
    db: Session = Depends(get_db),
) -> TemplateOut:
    """Create a new community template."""
    sections_data = [s.model_dump() for s in payload.sections]
    template = community_service.create_template(
        db,
        name=payload.name,
        description=payload.description,
        icon=payload.icon,
        sections=sections_data,
    )
    return TemplateOut.model_validate(template)


@router.put("/templates/{template_id}", response_model=TemplateOut)
async def update_template_endpoint(
    template_id: int,
    payload: TemplateUpdate,
    db: Session = Depends(get_db),
) -> TemplateOut:
    """Update an existing template."""
    update_data = payload.model_dump(exclude_unset=True)
    if "sections" in update_data and update_data["sections"] is not None:
        update_data["sections"] = [s.model_dump() if hasattr(s, "model_dump") else s for s in update_data["sections"]]
    template = community_service.update_template(db, template_id, update_data)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    return TemplateOut.model_validate(template)


@router.delete("/templates/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_template_endpoint(
    template_id: int,
    db: Session = Depends(get_db),
) -> None:
    """Delete a non-system template."""
    ok = community_service.delete_template(db, template_id)
    if not ok:
        raise HTTPException(status_code=400, detail="Cannot delete this template")


# ─── Community CRUD ───────────────────────────────────────────


@router.post("", response_model=CommunityOut, status_code=status.HTTP_201_CREATED)
async def create_community(
    payload: CommunityCreate,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> CommunityOut:
    """Create a new Wave (community). Optionally set parent_id for nesting and template_id."""
    # If creating sub-wave, validate permissions
    if payload.parent_id:
        role = community_service.get_member_role(db, payload.parent_id, user_id)
        parent = community_service.get_community_by_id(db, payload.parent_id)
        if not parent:
            raise HTTPException(status_code=404, detail="Parent Wave not found")
        if not community_service.can_create_sub_wave(role, parent.depth):
            raise HTTPException(status_code=403, detail="You cannot create sub-Waves here")

    try:
        community = community_service.create_community(db, payload, creator_id=user_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return _build_community_out(community, db)


@router.get("", response_model=list[CommunityOut])
async def list_communities(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
) -> list[CommunityOut]:
    """List all public root-level Waves, newest first."""
    communities, _ = community_service.list_communities(db, skip=skip, limit=limit)
    return [_build_community_out(c, db) for c in communities]


@router.get("/{slug}", response_model=CommunityOut)
async def get_community(
    slug: str,
    db: Session = Depends(get_db),
) -> CommunityOut:
    """Get a single Wave by slug."""
    community = _get_community_or_404(slug, db)
    return _build_community_out(community, db)


@router.put("/{slug}", response_model=CommunityOut)
async def update_community(
    slug: str,
    payload: CommunityUpdate,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> CommunityOut:
    """Update a Wave's settings (owner/admin only)."""
    community = _get_community_or_404(slug, db)
    role = community_service.get_member_role(db, community.id, user_id)
    if not community_service.can_manage_wave(role):
        raise HTTPException(status_code=403, detail="Only owners and admins can edit settings")
        
    updated = community_service.update_community(db, community.id, payload.model_dump(exclude_unset=True))
    return _build_community_out(updated, db)


@router.delete("/{slug}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_community(
    slug: str,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> None:
    """Archive a Wave (owner only)."""
    community = _get_community_or_404(slug, db)
    role = community_service.get_member_role(db, community.id, user_id)
    if role != "owner":
        raise HTTPException(status_code=403, detail="Only the owner can delete the Wave")
        
    community_service.archive_community(db, community.id)


# ─── Nesting ──────────────────────────────────────────────────


@router.get("/{slug}/children", response_model=list[CommunityOut])
async def get_children(
    slug: str,
    db: Session = Depends(get_db),
) -> list[CommunityOut]:
    """Get direct child Waves."""
    community = _get_community_or_404(slug, db)
    children = community_service.get_children(db, community.id)
    return [_build_community_out(c, db) for c in children]


@router.get("/{slug}/ancestors", response_model=list[CommunityBrief])
async def get_ancestors(
    slug: str,
    db: Session = Depends(get_db),
) -> list[CommunityBrief]:
    """Get ancestor chain for breadcrumb navigation."""
    community = _get_community_or_404(slug, db)
    ancestors = community_service.get_ancestors(db, community)
    return [CommunityBrief.model_validate(a) for a in ancestors]


# ─── Membership ───────────────────────────────────────────────


@router.post("/{slug}/join", response_model=dict)
async def join_community(
    slug: str,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> dict:
    """Join a Wave."""
    community = _get_community_or_404(slug, db)
    community_service.join_community(db, community.id, user_id)

    # Notify community creator
    if community.created_by_id and community.created_by_id != user_id:
        actor = user_service.get_user_by_id(db, user_id)
        actor_name = actor.display_name or actor.username if actor else "Someone"
        notif = notification_service.create_notification(
            db,
            recipient_id=community.created_by_id,
            notification_type="community_join",
            message=f"{actor_name} joined your Wave '{community.name}'",
            actor_id=user_id,
            community_id=community.id,
        )
        asyncio.create_task(notification_service.push_notification_ws(notif, actor))

    return {"joined": True, "slug": slug}


@router.delete("/{slug}/leave", response_model=dict)
async def leave_community(
    slug: str,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> dict:
    """Leave a Wave."""
    community = _get_community_or_404(slug, db)
    ok = community_service.leave_community(db, community.id, user_id)
    if not ok:
        raise HTTPException(status_code=400, detail="Cannot leave this Wave (you may be the owner)")
    return {"left": True}


@router.get("/{slug}/members", response_model=list[CommunityMemberOut])
async def get_members(
    slug: str,
    db: Session = Depends(get_db),
) -> list[CommunityMemberOut]:
    """Get all members of a Wave."""
    community = _get_community_or_404(slug, db)
    members = community_service.get_members(db, community.id)
    return [
        CommunityMemberOut(
            user_id=m.user_id,
            username=m.user.username if m.user else None,
            display_name=m.user.display_name if m.user else None,
            avatar_url=m.user.avatar_url if m.user else None,
            role=m.role,
            joined_at=m.joined_at,
        )
        for m in members
    ]


@router.put("/{slug}/members/{target_user_id}/role", response_model=CommunityMemberOut)
async def update_member_role(
    slug: str,
    target_user_id: int,
    payload: MemberRoleUpdate,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> CommunityMemberOut:
    """Change a member's role (owner/admin only)."""
    community = _get_community_or_404(slug, db)
    actor_role = community_service.get_member_role(db, community.id, user_id)

    member = community_service.update_member_role(
        db, community.id, target_user_id, payload.role, actor_role
    )
    if not member:
        raise HTTPException(status_code=403, detail="Cannot change this member's role")

    return CommunityMemberOut(
        user_id=member.user_id,
        username=member.user.username if member.user else None,
        display_name=member.user.display_name if member.user else None,
        avatar_url=member.user.avatar_url if member.user else None,
        role=member.role,
        joined_at=member.joined_at,
    )


@router.delete("/{slug}/members/{target_user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_member(
    slug: str,
    target_user_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> None:
    """Remove a member from the Wave (owner/admin only)."""
    community = _get_community_or_404(slug, db)
    actor_role = community_service.get_member_role(db, community.id, user_id)
    
    ok = community_service.remove_member(db, community.id, target_user_id, actor_role)
    if not ok:
        raise HTTPException(status_code=403, detail="Cannot remove this member")


# ─── Sections ─────────────────────────────────────────────────


@router.get("/{slug}/sections", response_model=list[SectionOut])
async def get_sections(
    slug: str,
    db: Session = Depends(get_db),
) -> list[SectionOut]:
    """Get all sections of a Wave, ordered by position."""
    community = _get_community_or_404(slug, db)
    sections = community_service.get_sections(db, community.id)
    return [SectionOut.model_validate(s) for s in sections]


@router.post("/{slug}/sections", response_model=SectionOut, status_code=status.HTTP_201_CREATED)
async def create_section(
    slug: str,
    payload: SectionCreate,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> SectionOut:
    """Create a custom section (owner/admin only)."""
    community = _get_community_or_404(slug, db)
    role = community_service.get_member_role(db, community.id, user_id)
    if not community_service.can_manage_wave(role):
        raise HTTPException(status_code=403, detail="Only owners and admins can manage sections")

    section = community_service.create_section(db, community.id, payload)
    return SectionOut.model_validate(section)


@router.put("/{slug}/sections/{section_slug}", response_model=SectionOut)
async def update_section(
    slug: str,
    section_slug: str,
    payload: SectionUpdate,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> SectionOut:
    """Update a section (owner/admin only)."""
    community = _get_community_or_404(slug, db)
    role = community_service.get_member_role(db, community.id, user_id)
    if not community_service.can_manage_wave(role):
        raise HTTPException(status_code=403, detail="Only owners and admins can manage sections")

    section = community_service.update_section(
        db, community.id, section_slug, payload.model_dump(exclude_unset=True)
    )
    if not section:
        raise HTTPException(status_code=404, detail="Section not found")
    return SectionOut.model_validate(section)


@router.delete("/{slug}/sections/{section_slug}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_section(
    slug: str,
    section_slug: str,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> None:
    """Delete a non-default section (owner/admin only)."""
    community = _get_community_or_404(slug, db)
    role = community_service.get_member_role(db, community.id, user_id)
    if not community_service.can_manage_wave(role):
        raise HTTPException(status_code=403, detail="Only owners and admins can manage sections")

    ok = community_service.delete_section(db, community.id, section_slug)
    if not ok:
        raise HTTPException(status_code=400, detail="Cannot delete this section (may be a default)")


@router.put("/{slug}/sections/reorder", response_model=list[SectionOut])
async def reorder_sections(
    slug: str,
    payload: SectionReorder,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> list[SectionOut]:
    """Reorder sections (owner/admin only)."""
    community = _get_community_or_404(slug, db)
    role = community_service.get_member_role(db, community.id, user_id)
    if not community_service.can_manage_wave(role):
        raise HTTPException(status_code=403, detail="Only owners and admins can manage sections")

    sections = community_service.reorder_sections(db, community.id, payload.section_ids)
    return [SectionOut.model_validate(s) for s in sections]


# ─── Section Posts ────────────────────────────────────────────


@router.get("/{slug}/sections/{section_slug}/posts", response_model=list[PostOut])
async def get_section_posts(
    slug: str,
    section_slug: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=50),
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> list[PostOut]:
    """Get posts in a specific section of a Wave."""
    community = _get_community_or_404(slug, db)
    section = community_service.get_section_by_slug(db, community.id, section_slug)
    if not section:
        raise HTTPException(status_code=404, detail="Section not found")

    posts, _ = post_service.get_feed(
        db, current_user_id=user_id, community_id=community.id,
        section_id=section.id, skip=skip, limit=limit
    )
    return [PostOut(**build_post_out_data(p, db, user_id)) for p in posts]


# ─── Legacy: community posts (all sections) ──────────────────


@router.get("/{slug}/posts", response_model=list[PostOut])
async def get_community_posts(
    slug: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=50),
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> list[PostOut]:
    """Get all posts in a Wave (across all sections), newest first."""
    community = _get_community_or_404(slug, db)
    posts, _ = post_service.get_feed(
        db, current_user_id=user_id, community_id=community.id, skip=skip, limit=limit
    )
    return [PostOut(**build_post_out_data(p, db, user_id)) for p in posts]
