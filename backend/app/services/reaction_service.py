"""
Reaction service — toggle Like / Insightful / Helpful.
"""

import logging

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.post import Reaction

logger = logging.getLogger(__name__)


def toggle_reaction(
    db: Session,
    post_id: int,
    user_id: int,
    reaction_type: str,
) -> Reaction | None:
    """
    Toggle a reaction on a post:
    - If no reaction exists → create it.
    - If same type exists → remove it (unlike).
    - If different type exists → update to new type.
    Returns the new reaction or None if removed.
    """
    existing = (
        db.query(Reaction).filter(Reaction.post_id == post_id, Reaction.user_id == user_id).first()
    )

    if existing:
        if existing.reaction_type == reaction_type:
            # Same reaction → toggle off
            db.delete(existing)
            db.commit()
            return None
        else:
            # Different reaction → update
            existing.reaction_type = reaction_type
            db.commit()
            db.refresh(existing)
            return existing

    # No existing reaction → create
    reaction = Reaction(
        post_id=post_id,
        user_id=user_id,
        reaction_type=reaction_type,
    )
    db.add(reaction)
    try:
        db.commit()
        db.refresh(reaction)
    except IntegrityError:
        db.rollback()
        # Race condition — fetch the existing one
        reaction = (
            db.query(Reaction)
            .filter(Reaction.post_id == post_id, Reaction.user_id == user_id)
            .first()
        )
    return reaction


def get_user_reaction(db: Session, post_id: int, user_id: int) -> Reaction | None:
    return (
        db.query(Reaction).filter(Reaction.post_id == post_id, Reaction.user_id == user_id).first()
    )
