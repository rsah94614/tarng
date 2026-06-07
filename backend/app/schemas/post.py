"""
Pydantic schemas for Post, Comment, and Reaction endpoints.
"""
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

from app.schemas.user import UserPublic

ReactionType = Literal["like", "insightful", "helpful"]


# ─── Reactions ────────────────────────────────────────────────

class ReactionCreate(BaseModel):
    reaction_type: ReactionType


class ReactionSummary(BaseModel):
    like: int = 0
    insightful: int = 0
    helpful: int = 0
    user_reaction: ReactionType | None = None  # what the current user reacted with


# ─── Posts / Comments ─────────────────────────────────────────

class PostCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=10000)
    content_type: Literal["text", "markdown"] = "text"
    community_id: int | None = None
    image_urls: list[str] | None = None


class CommentCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=5000)
    content_type: Literal["text", "markdown"] = "text"
    parent_id: int | None = None  # None = direct comment, set = reply


class PostOut(BaseModel):
    id: int
    author: UserPublic
    community_id: int | None
    content: str
    content_type: str
    image_urls: list[str] | None
    parent_id: int | None
    reactions: ReactionSummary
    comment_count: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class CommentOut(BaseModel):
    id: int
    author: UserPublic
    content: str
    content_type: str
    parent_id: int | None
    reactions: ReactionSummary
    reply_count: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class CommentThreadOut(BaseModel):
    """A comment with its direct replies (2 levels max for V1)."""
    comment: CommentOut
    replies: list[CommentOut] = []
