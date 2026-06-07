"""
Pydantic schemas for User endpoints.
"""

from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50, pattern=r"^[a-zA-Z0-9_]+$")
    email: EmailStr
    password: str = Field(..., min_length=8)
    display_name: str | None = Field(None, max_length=100)


class UserLogin(BaseModel):
    email: str
    password: str


class UserOut(BaseModel):
    id: int
    username: str
    email: str
    display_name: str | None
    bio: str | None
    avatar_url: str | None
    language_preference: str
    interests: list[str] | None
    is_active: bool
    is_verified: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class UserPublic(BaseModel):
    """Public-facing profile (no email)."""

    id: int
    username: str
    display_name: str | None
    bio: str | None
    avatar_url: str | None
    language_preference: str
    interests: list[str] | None
    created_at: datetime

    model_config = {"from_attributes": True}


class UserUpdate(BaseModel):
    display_name: str | None = Field(None, max_length=100)
    bio: str | None = Field(None, max_length=500)
    language_preference: str | None = Field(None, max_length=10)
    interests: list[str] | None = None


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8)


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
