"""
Post endpoints: feed, CRUD, comments, reactions, mentions.
"""

import asyncio
import re

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user_id, get_db
from app.models.post import Post
from app.schemas.post import (
    CommentCreate,
    CommentOut,
    CommentThreadOut,
    PostCreate,
    PostOut,
    ReactionCreate,
    ReactionSummary,
)
from app.services import (
    notification_service,
    post_service,
    reaction_service,
    storage_service,
    user_service,
)
from app.services.post_service import _extract_mentions, build_post_out_data

router = APIRouter()

MENTION_PATTERN = re.compile(r"@([a-zA-Z0-9_]+)")


def _build_comment_out(comment: Post, db: Session, user_id: int) -> CommentOut:
    data = build_post_out_data(comment, db, user_id)
    # reply_count = direct children of this comment
    data["reply_count"] = post_service.get_comment_count(db, comment.id)
    return CommentOut(**data)


# ─── Feed ─────────────────────────────────────────────────────


@router.get("", response_model=list[PostOut])
async def get_feed(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=50),
    community_id: int | None = Query(None),
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> list[PostOut]:
    """Global chronological feed. Filter by community_id for Wave feeds."""
    posts, _ = post_service.get_feed(
        db, current_user_id=user_id, community_id=community_id, skip=skip, limit=limit
    )
    return [PostOut(**build_post_out_data(p, db, user_id)) for p in posts]


# ─── Create Post ──────────────────────────────────────────────


@router.post("", response_model=PostOut, status_code=status.HTTP_201_CREATED)
async def create_post(
    payload: PostCreate,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> PostOut:
    """Create a new text/markdown post (optionally in a Wave)."""
    post = post_service.create_post(db, payload, author_id=user_id)

    # Handle @mentions
    asyncio.create_task(_handle_mentions(db, post, user_id))

    return PostOut(**build_post_out_data(post, db, user_id))


@router.post("/upload-image")
async def upload_post_image(
    file: UploadFile = File(...),
    user_id: int = Depends(get_current_user_id),
) -> dict:
    """Upload an image for a post. Returns the image URL."""
    if file.content_type not in ("image/jpeg", "image/png", "image/webp", "image/gif"):
        raise HTTPException(status_code=400, detail="Unsupported image format")
    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:  # 10 MB
        raise HTTPException(status_code=413, detail="Image too large (max 10 MB)")
    url = storage_service.upload_file(contents, file.content_type or "image/jpeg", prefix="posts")
    if not url:
        raise HTTPException(status_code=500, detail="Image upload failed")
    return {"url": url}


# ─── Single Post ──────────────────────────────────────────────


@router.get("/{post_id}", response_model=PostOut)
async def get_post(
    post_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> PostOut:
    """Get a single post by ID."""
    post = post_service.get_post(db, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return PostOut(**build_post_out_data(post, db, user_id))


@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_post(
    post_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> None:
    """Delete your own post."""
    ok = post_service.delete_post(db, post_id, author_id=user_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Post not found or not yours")


# ─── Comments & Replies ───────────────────────────────────────


@router.get("/{post_id}/comments", response_model=list[CommentThreadOut])
async def get_comments(
    post_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> list[CommentThreadOut]:
    """
    Get all comments on a post with their replies (2-level nesting).
    """
    post = post_service.get_post(db, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    comments = post_service.get_comments(db, post_id, user_id)
    result = []
    for comment in comments:
        replies_raw = post_service.get_replies(db, comment.id, user_id)
        result.append(
            CommentThreadOut(
                comment=_build_comment_out(comment, db, user_id),
                replies=[_build_comment_out(r, db, user_id) for r in replies_raw],
            )
        )
    return result


@router.post("/{post_id}/comments", response_model=CommentOut, status_code=status.HTTP_201_CREATED)
async def create_comment(
    post_id: int,
    payload: CommentCreate,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> CommentOut:
    """Add a comment or reply to a post."""
    post = post_service.get_post(db, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    comment = post_service.create_comment(db, post_id, payload, author_id=user_id)

    # Notify post author (if not self)
    if post.author_id != user_id:
        actor = user_service.get_user_by_id(db, user_id)
        actor_name = actor.display_name or actor.username if actor else "Someone"
        notif = notification_service.create_notification(
            db,
            recipient_id=post.author_id,
            notification_type="reply",
            message=f"{actor_name} replied to your post",
            actor_id=user_id,
            post_id=post_id,
        )
        asyncio.create_task(notification_service.push_notification_ws(notif, actor))

    # Handle @mentions in comment
    asyncio.create_task(_handle_mentions(db, comment, user_id))

    return _build_comment_out(comment, db, user_id)


# ─── Reactions ────────────────────────────────────────────────


@router.post("/{post_id}/reactions", response_model=ReactionSummary)
async def toggle_reaction(
    post_id: int,
    payload: ReactionCreate,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> ReactionSummary:
    """Toggle a reaction (like/insightful/helpful) on a post or comment."""
    from app.models.post import Post as PostModel

    post_obj = db.query(PostModel).filter(PostModel.id == post_id).first()
    if not post_obj:
        raise HTTPException(status_code=404, detail="Post not found")

    reaction_service.toggle_reaction(db, post_id, user_id, payload.reaction_type)

    # Re-fetch post to get updated reactions
    db.refresh(post_obj)
    from app.services.post_service import _build_reaction_summary

    return _build_reaction_summary(post_obj, user_id)


# ─── Internal: mentions ───────────────────────────────────────


async def _handle_mentions(db: Session, post: Post, actor_id: int) -> None:
    """Notify mentioned users (@username) in a post or comment."""
    try:
        mentions = _extract_mentions(post.content)
        for username in set(mentions):
            mentioned_user = user_service.get_user_by_username(db, username)
            if mentioned_user and mentioned_user.id != actor_id:
                actor = user_service.get_user_by_id(db, actor_id)
                actor_name = actor.display_name or actor.username if actor else "Someone"
                notif = notification_service.create_notification(
                    db,
                    recipient_id=mentioned_user.id,
                    notification_type="mention",
                    message=f"{actor_name} mentioned you in a post",
                    actor_id=actor_id,
                    post_id=post.id,
                )
                await notification_service.push_notification_ws(notif, actor)
    except Exception:
        pass  # Non-critical
