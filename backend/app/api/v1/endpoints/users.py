"""
User endpoints: me, update profile, upload avatar, public profile.
"""

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user_id, get_db
from app.models.user import User
from app.schemas.user import UserOut, UserPublic, UserUpdate
from app.services import storage_service, user_service

router = APIRouter()


def _get_current_user(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> User:
    user = user_service.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.get("/me", response_model=UserOut)
async def get_me(current_user: User = Depends(_get_current_user)) -> User:
    """Return the authenticated user's full profile."""
    return current_user


@router.patch("/me", response_model=UserOut)
async def update_me(
    payload: UserUpdate,
    current_user: User = Depends(_get_current_user),
    db: Session = Depends(get_db),
) -> User:
    """Update the authenticated user's profile."""
    return user_service.update_profile(db, current_user, payload)


@router.post("/me/avatar", response_model=UserOut)
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(_get_current_user),
    db: Session = Depends(get_db),
) -> User:
    """Upload a new profile picture."""
    if file.content_type not in ("image/jpeg", "image/png", "image/webp", "image/gif"):
        raise HTTPException(status_code=400, detail="Unsupported image format")

    contents = await file.read()
    if len(contents) > 5 * 1024 * 1024:  # 5 MB limit
        raise HTTPException(status_code=413, detail="Image too large (max 5 MB)")

    url = storage_service.upload_file(contents, file.content_type or "image/jpeg", prefix="avatars")
    if not url:
        raise HTTPException(status_code=500, detail="Failed to upload avatar")

    return user_service.update_avatar(db, current_user, url)


@router.get("/{username}", response_model=UserPublic)
async def get_user_profile(
    username: str,
    db: Session = Depends(get_db),
) -> User:
    """Return a public user profile by username."""
    user = user_service.get_user_by_username(db, username)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
