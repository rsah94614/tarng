"""
Pydantic schemas for Community (Wave) endpoints.
"""

from datetime import datetime

from pydantic import BaseModel, Field


# ─── Sections ─────────────────────────────────────────────────


class SectionCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    section_type: str = Field(default="custom", max_length=50)
    description: str | None = None
    icon: str | None = None


class SectionUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=100)
    description: str | None = None
    icon: str | None = None
    is_visible: bool | None = None


class SectionOut(BaseModel):
    id: int
    community_id: int
    section_type: str
    name: str
    slug: str
    description: str | None
    icon: str | None
    position: int
    is_default: bool
    is_visible: bool

    model_config = {"from_attributes": True}


class SectionReorder(BaseModel):
    section_ids: list[int]


# ─── Templates ────────────────────────────────────────────────


class TemplateSectionDef(BaseModel):
    """A single section definition within a template."""
    name: str
    section_type: str = "custom"
    icon: str | None = None


class TemplateCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: str | None = None
    icon: str | None = None
    sections: list[TemplateSectionDef] = []


class TemplateUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=100)
    description: str | None = None
    icon: str | None = None
    sections: list[TemplateSectionDef] | None = None


class TemplateOut(BaseModel):
    id: int
    name: str
    slug: str
    description: str | None
    icon: str | None
    sections: list[dict] | None
    is_system: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# ─── Communities ──────────────────────────────────────────────


class CommunityCreate(BaseModel):
    name: str = Field(..., min_length=3, max_length=100)
    description: str | None = Field(None, max_length=1000)
    is_public: bool = True
    parent_id: int | None = None
    template_id: int | None = None


class CommunityUpdate(BaseModel):
    name: str | None = Field(None, min_length=3, max_length=100)
    description: str | None = Field(None, max_length=1000)
    is_public: bool | None = None


class CommunityOut(BaseModel):
    id: int
    name: str
    slug: str
    description: str | None
    avatar_url: str | None
    banner_url: str | None
    is_public: bool
    created_by_id: int | None
    parent_id: int | None
    depth: int
    path: str
    template_id: int | None
    is_archived: bool
    member_count: int
    children_count: int
    sections: list[SectionOut]
    created_at: datetime

    model_config = {"from_attributes": True}


class CommunityBrief(BaseModel):
    """Lightweight community info for breadcrumbs / listings."""
    id: int
    name: str
    slug: str
    depth: int

    model_config = {"from_attributes": True}


class CommunityMemberOut(BaseModel):
    user_id: int
    username: str | None = None
    display_name: str | None = None
    avatar_url: str | None = None
    role: str
    joined_at: datetime

    model_config = {"from_attributes": True}


class MemberRoleUpdate(BaseModel):
    role: str = Field(..., pattern="^(admin|moderator|member)$")
