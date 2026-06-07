"""
Post service — feed, CRUD, comments, mentions.
"""

import logging
import re

from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.models.post import Post
from app.schemas.post import CommentCreate, PostCreate, ReactionSummary

logger = logging.getLogger(__name__)

MENTION_PATTERN = re.compile(r"@([a-zA-Z0-9_]+)")


def _extract_mentions(content: str) -> list[str]:
    return MENTION_PATTERN.findall(content)


def _build_reaction_summary(post: Post, current_user_id: int | None) -> ReactionSummary:
    counts = {"like": 0, "insightful": 0, "helpful": 0}
    user_reaction: str | None = None
    for r in post.reactions:
        if r.reaction_type in counts:
            counts[r.reaction_type] += 1
        if current_user_id and r.user_id == current_user_id:
            user_reaction = r.reaction_type
    return ReactionSummary(**counts, user_reaction=user_reaction)  # type: ignore[arg-type]


# ─── Feed ─────────────────────────────────────────────────────


def get_feed(
    db: Session,
    current_user_id: int | None,
    community_id: int | None = None,
    skip: int = 0,
    limit: int = 20,
) -> tuple[list[Post], int]:
    """Chronological feed — root posts only (parent_id is NULL)."""
    q = (
        db.query(Post)
        .options(joinedload(Post.author), joinedload(Post.reactions))
        .filter(Post.parent_id.is_(None))
    )
    if community_id:
        q = q.filter(Post.community_id == community_id)

    total = q.count()
    posts = q.order_by(Post.created_at.desc()).offset(skip).limit(limit).all()
    return posts, total


# ─── Post CRUD ────────────────────────────────────────────────


def create_post(db: Session, payload: PostCreate, author_id: int) -> Post:
    post = Post(
        author_id=author_id,
        community_id=payload.community_id,
        content=payload.content,
        content_type=payload.content_type,
        image_urls=payload.image_urls,
        parent_id=None,
    )
    db.add(post)
    db.commit()
    db.refresh(post)
    return post


def get_post(db: Session, post_id: int) -> Post | None:
    return (
        db.query(Post)
        .options(joinedload(Post.author), joinedload(Post.reactions))
        .filter(Post.id == post_id, Post.parent_id.is_(None))
        .first()
    )


def delete_post(db: Session, post_id: int, author_id: int) -> bool:
    post = db.query(Post).filter(Post.id == post_id, Post.author_id == author_id).first()
    if not post:
        return False
    db.delete(post)
    db.commit()
    return True


# ─── Comments ─────────────────────────────────────────────────


def get_comments(
    db: Session,
    post_id: int,
    current_user_id: int | None = None,
) -> list[Post]:
    """Get direct comments (parent_id = post_id), ordered oldest first."""
    return (
        db.query(Post)
        .options(joinedload(Post.author), joinedload(Post.reactions))
        .filter(Post.parent_id == post_id)
        .order_by(Post.created_at.asc())
        .all()
    )


def get_replies(
    db: Session,
    comment_id: int,
    current_user_id: int | None = None,
) -> list[Post]:
    """Get replies to a comment."""
    return (
        db.query(Post)
        .options(joinedload(Post.author), joinedload(Post.reactions))
        .filter(Post.parent_id == comment_id)
        .order_by(Post.created_at.asc())
        .all()
    )


def create_comment(
    db: Session,
    post_id: int,
    payload: CommentCreate,
    author_id: int,
) -> Post:
    """Create a comment or reply. parent_id in payload = reply-to-comment."""
    actual_parent_id = payload.parent_id if payload.parent_id else post_id

    comment = Post(
        author_id=author_id,
        community_id=None,
        content=payload.content,
        content_type=payload.content_type,
        image_urls=None,
        parent_id=actual_parent_id,
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return comment


def get_comment_count(db: Session, post_id: int) -> int:
    """Count all descendants of a post (comments + replies)."""
    return db.query(func.count(Post.id)).filter(Post.parent_id == post_id).scalar() or 0


def build_post_out_data(post: Post, db: Session, current_user_id: int | None = None) -> dict:
    """Helper to enrich a Post ORM object with computed fields."""
    return {
        "id": post.id,
        "author": post.author,
        "community_id": post.community_id,
        "content": post.content,
        "content_type": post.content_type,
        "image_urls": post.image_urls,
        "parent_id": post.parent_id,
        "reactions": _build_reaction_summary(post, current_user_id),
        "comment_count": get_comment_count(db, post.id),
        "created_at": post.created_at,
        "updated_at": post.updated_at,
    }
