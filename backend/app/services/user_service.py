"""
User service — business logic for auth and profile management.
"""
import logging
import secrets
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.core.security import get_password_hash, verify_password
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate

logger = logging.getLogger(__name__)

PASSWORD_RESET_EXPIRE_HOURS = 1


def get_user_by_id(db: Session, user_id: int) -> User | None:
    return db.query(User).filter(User.id == user_id, User.is_active.is_(True)).first()


def get_user_by_username(db: Session, username: str) -> User | None:
    return db.query(User).filter(User.username == username, User.is_active.is_(True)).first()


def get_user_by_email(db: Session, email: str) -> User | None:
    return db.query(User).filter(User.email == email).first()


def create_user(db: Session, payload: UserCreate) -> User:
    user = User(
        username=payload.username,
        email=payload.email,
        hashed_password=get_password_hash(payload.password),
        display_name=payload.display_name or payload.username,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def authenticate_user(db: Session, email: str, password: str) -> User | None:
    """Return user if credentials are valid, else None."""
    user = get_user_by_email(db, email)
    if not user:
        return None
    if not user.is_active:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user


def update_profile(db: Session, user: User, payload: UserUpdate) -> User:
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(user, field, value)
    db.commit()
    db.refresh(user)
    return user


def update_avatar(db: Session, user: User, avatar_url: str) -> User:
    user.avatar_url = avatar_url
    db.commit()
    db.refresh(user)
    return user


def create_password_reset_token(db: Session, email: str) -> str | None:
    """
    Generate and store a password reset token.
    Returns the token (to be emailed), or None if user not found.
    """
    user = get_user_by_email(db, email)
    if not user:
        return None  # Don't reveal if email exists

    token = secrets.token_urlsafe(32)
    user.password_reset_token = token
    user.password_reset_expires = datetime.now(timezone.utc) + timedelta(hours=PASSWORD_RESET_EXPIRE_HOURS)
    db.commit()
    return token


def reset_password(db: Session, token: str, new_password: str) -> bool:
    """
    Validate the token and set the new password.
    Returns True on success, False if token is invalid or expired.
    """
    user = (
        db.query(User)
        .filter(User.password_reset_token == token)
        .first()
    )
    if not user:
        return False
    if not user.password_reset_expires:
        return False
    if user.password_reset_expires < datetime.now(timezone.utc):
        return False

    user.hashed_password = get_password_hash(new_password)
    user.password_reset_token = None
    user.password_reset_expires = None
    db.commit()
    return True
