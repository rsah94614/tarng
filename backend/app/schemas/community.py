"""
Pydantic schemas for Community (Wave) endpoints.
"""
from datetime import datetime

from pydantic import BaseModel, Field


class CommunityCreate(BaseModel):
    name: str = Field(..., min_length=3, max_length=100)
    description: str | None = Field(None, max_length=1000)
    is_public: bool = True


class CommunityOut(BaseModel):
    id: int
    name: str
    slug: str
    description: str | None
    avatar_url: str | None
    banner_url: str | None
    is_public: bool
    created_by_id: int | None
    member_count: int
    created_at: datetime

    model_config = {"from_attributes": True}


class CommunityMemberOut(BaseModel):
    user_id: int
    role: str
    joined_at: datetime

    model_config = {"from_attributes": True}
