"""
Community (Wave) endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user_id, get_db
from app.models.community import Community
from app.schemas.community import CommunityCreate, CommunityOut
from app.schemas.post import PostOut
from app.services import community_service, notification_service, post_service, user_service
from app.services.post_service import build_post_out_data

router = APIRouter()


def _get_community_or_404(slug: str, db: Session) -> Community:
    community = community_service.get_community_by_slug(db, slug)
    if not community:
        raise HTTPException(status_code=404, detail="Wave not found")
    return community


@router.post("", response_model=CommunityOut, status_code=status.HTTP_201_CREATED)
async def create_community(
    payload: CommunityCreate,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> CommunityOut:
    """Create a new Wave (community)."""
    community = community_service.create_community(db, payload, creator_id=user_id)
    member_count = community_service.get_member_count(db, community.id)
    return CommunityOut(
        **{k: getattr(community, k) for k in community.__table__.columns.keys()},
        member_count=member_count,
    )


@router.get("", response_model=list[CommunityOut])
async def list_communities(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
) -> list[CommunityOut]:
    """List all public Waves, newest first."""
    communities, _ = community_service.list_communities(db, skip=skip, limit=limit)
    result = []
    for c in communities:
        result.append(
            CommunityOut(
                **{k: getattr(c, k) for k in c.__table__.columns.keys()},
                member_count=community_service.get_member_count(db, c.id),
            )
        )
    return result


@router.get("/{slug}", response_model=CommunityOut)
async def get_community(
    slug: str,
    db: Session = Depends(get_db),
) -> CommunityOut:
    """Get a single Wave by slug."""
    community = _get_community_or_404(slug, db)
    return CommunityOut(
        **{k: getattr(community, k) for k in community.__table__.columns.keys()},
        member_count=community_service.get_member_count(db, community.id),
    )


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
        import asyncio

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


@router.get("/{slug}/posts", response_model=list[PostOut])
async def get_community_posts(
    slug: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=50),
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> list[PostOut]:
    """Get posts in a Wave, newest first."""
    community = _get_community_or_404(slug, db)
    posts, _ = post_service.get_feed(
        db, current_user_id=user_id, community_id=community.id, skip=skip, limit=limit
    )
    return [PostOut(**build_post_out_data(p, db, user_id)) for p in posts]
