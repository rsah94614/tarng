"""
Post service — feed, CRUD, comments, mentions.
"""

import logging
import re

from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.models.post import Post
from app.models.poll import Poll, PollOption, PollVote
from app.models.event import Event, EventRSVP
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
    section_id: int | None = None,
    skip: int = 0,
    limit: int = 20,
) -> tuple[list[Post], int]:
    """Chronological feed — root posts only (parent_id is NULL)."""
    q = (
        db.query(Post)
        .options(
            joinedload(Post.author), 
            joinedload(Post.reactions),
            joinedload(Post.poll).joinedload(Poll.options),
            joinedload(Post.event)
        )
        .filter(Post.parent_id.is_(None))
    )
    if community_id:
        q = q.filter(Post.community_id == community_id)
    if section_id:
        q = q.filter(Post.section_id == section_id)

    total = q.count()
    posts = q.order_by(Post.created_at.desc()).offset(skip).limit(limit).all()
    return posts, total


# ─── Post CRUD ────────────────────────────────────────────────


def create_post(db: Session, payload: PostCreate, author_id: int) -> Post:
    post = Post(
        author_id=author_id,
        community_id=payload.community_id,
        section_id=payload.section_id,
        content=payload.content,
        content_type=payload.content_type,
        image_urls=payload.image_urls,
        post_metadata=payload.post_metadata,
        parent_id=None,
    )
    db.add(post)
    db.flush()

    if payload.poll:
        poll = Poll(post_id=post.id, expires_at=payload.poll.expires_at)
        db.add(poll)
        db.flush()
        for i, opt in enumerate(payload.poll.options):
            poll_option = PollOption(poll_id=poll.id, text=opt.text, position=opt.position if opt.position else i)
            db.add(poll_option)

    if payload.event:
        event = Event(
            post_id=post.id,
            title=payload.event.title,
            start_time=payload.event.start_time,
            end_time=payload.event.end_time,
            location=payload.event.location,
            is_online=payload.event.is_online,
            url=payload.event.url,
        )
        db.add(event)

    db.commit()
    db.refresh(post)
    return post


def get_post(db: Session, post_id: int) -> Post | None:
    return (
        db.query(Post)
        .options(
            joinedload(Post.author), 
            joinedload(Post.reactions),
            joinedload(Post.poll).joinedload(Poll.options),
            joinedload(Post.event)
        )
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


def update_post(db: Session, post_id: int, author_id: int, payload: dict) -> Post | None:
    post = db.query(Post).filter(Post.id == post_id, Post.author_id == author_id).first()
    if not post:
        return None
    if "content" in payload and payload["content"] is not None:
        post.content = payload["content"]
    if "image_urls" in payload:
        post.image_urls = payload["image_urls"]
    db.commit()
    db.refresh(post)
    return post


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
        "section_id": post.section_id,
        "content": post.content,
        "content_type": post.content_type,
        "image_urls": post.image_urls,
        "post_metadata": post.post_metadata,
        "parent_id": post.parent_id,
        "reactions": _build_reaction_summary(post, current_user_id),
        "comment_count": get_comment_count(db, post.id),
        "poll": _build_poll_out_data(post.poll, db, current_user_id) if post.poll else None,
        "event": _build_event_out_data(post.event, db, current_user_id) if post.event else None,
        "created_at": post.created_at,
        "updated_at": post.updated_at,
    }


def _build_poll_out_data(poll: Poll, db: Session, current_user_id: int | None = None) -> dict:
    options_out = []
    total_votes = 0
    poll_has_voted = False

    for opt in poll.options:
        votes_count = db.query(func.count(PollVote.id)).filter(PollVote.poll_option_id == opt.id).scalar() or 0
        total_votes += votes_count
        
        has_voted = False
        if current_user_id:
            user_vote = db.query(PollVote).filter(PollVote.poll_option_id == opt.id, PollVote.user_id == current_user_id).first()
            if user_vote:
                has_voted = True
                poll_has_voted = True
                
        options_out.append({
            "id": opt.id,
            "poll_id": opt.poll_id,
            "text": opt.text,
            "position": opt.position,
            "votes_count": votes_count,
            "has_voted": has_voted
        })
        
    return {
        "id": poll.id,
        "post_id": poll.post_id,
        "expires_at": poll.expires_at,
        "options": options_out,
        "total_votes": total_votes,
        "has_voted": poll_has_voted
    }


def _build_event_out_data(event: Event, db: Session, current_user_id: int | None = None) -> dict:
    going_count = db.query(func.count(EventRSVP.id)).filter(EventRSVP.event_id == event.id, EventRSVP.status == 'going').scalar() or 0
    maybe_count = db.query(func.count(EventRSVP.id)).filter(EventRSVP.event_id == event.id, EventRSVP.status == 'maybe').scalar() or 0
    
    user_rsvp = None
    if current_user_id:
        rsvp = db.query(EventRSVP).filter(EventRSVP.event_id == event.id, EventRSVP.user_id == current_user_id).first()
        if rsvp:
            user_rsvp = rsvp.status
            
    return {
        "id": event.id,
        "post_id": event.post_id,
        "title": event.title,
        "start_time": event.start_time,
        "end_time": event.end_time,
        "location": event.location,
        "is_online": event.is_online,
        "url": event.url,
        "going_count": going_count,
        "maybe_count": maybe_count,
        "user_rsvp": user_rsvp
    }


def vote_poll(db: Session, post_id: int, option_id: int, user_id: int) -> bool:
    # Verify post and option exist
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post or not post.poll:
        return False
        
    option = db.query(PollOption).filter(PollOption.id == option_id, PollOption.poll_id == post.poll.id).first()
    if not option:
        return False
        
    # Check if already voted
    existing_vote = db.query(PollVote).filter(PollVote.poll_id == post.poll.id, PollVote.user_id == user_id).first()
    if existing_vote:
        if existing_vote.poll_option_id == option_id:
            # Toggle vote off
            db.delete(existing_vote)
        else:
            # Change vote
            existing_vote.poll_option_id = option_id
    else:
        # New vote
        vote = PollVote(poll_id=post.poll.id, poll_option_id=option_id, user_id=user_id)
        db.add(vote)
        
    db.commit()
    return True


def rsvp_event(db: Session, post_id: int, status: str, user_id: int) -> bool:
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post or not post.event:
        return False
        
    existing_rsvp = db.query(EventRSVP).filter(EventRSVP.event_id == post.event.id, EventRSVP.user_id == user_id).first()
    if existing_rsvp:
        if existing_rsvp.status == status:
            db.delete(existing_rsvp) # Toggle off
        else:
            existing_rsvp.status = status
    else:
        rsvp = EventRSVP(event_id=post.event.id, user_id=user_id, status=status)
        db.add(rsvp)
        
    db.commit()
    return True
