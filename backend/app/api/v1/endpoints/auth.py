"""
Auth endpoints: register, login, refresh, forgot-password, reset-password.
"""

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.dependencies import get_db
from app.core.security import create_access_token, create_refresh_token, decode_token
from app.schemas.user import (
    ForgotPasswordRequest,
    ResetPasswordRequest,
    TokenResponse,
    UserCreate,
)
from app.services import email_service, user_service

router = APIRouter()


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(
    payload: UserCreate,
    db: Session = Depends(get_db),
) -> TokenResponse:
    """Register a new user account and return JWT tokens."""
    if user_service.get_user_by_email(db, payload.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    if user_service.get_user_by_username(db, payload.username):
        raise HTTPException(status_code=400, detail="Username already taken")

    user = user_service.create_user(db, payload)
    access_token = create_access_token(subject=user.id)
    refresh_token = create_refresh_token(subject=user.id)
    return TokenResponse(access_token=access_token, refresh_token=refresh_token)


@router.post("/login", response_model=TokenResponse)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
) -> TokenResponse:
    """
    OAuth2 compatible login using email or username as the 'username' field.
    Returns access + refresh tokens.
    """
    # Try email first, then username
    user = user_service.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        # Also try treating username as a username field
        db_user = user_service.get_user_by_username(db, form_data.username)
        if db_user:
            from app.core.security import verify_password

            if verify_password(form_data.password, db_user.hashed_password) and db_user.is_active:
                user = db_user

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(subject=user.id)
    refresh_token = create_refresh_token(subject=user.id)
    return TokenResponse(access_token=access_token, refresh_token=refresh_token)


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(refresh_token_str: str) -> TokenResponse:
    """Exchange a valid refresh token for a new access token."""
    try:
        payload = decode_token(refresh_token_str)
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user_id = payload.get("sub")
        new_access = create_access_token(subject=user_id)
        new_refresh = create_refresh_token(subject=user_id)
        return TokenResponse(access_token=new_access, refresh_token=new_refresh)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")


@router.post("/forgot-password", status_code=status.HTTP_200_OK)
async def forgot_password(
    payload: ForgotPasswordRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
) -> dict:
    """
    Request a password reset link.
    Always returns 200 to avoid email enumeration attacks.
    """
    token = user_service.create_password_reset_token(db, payload.email)
    if token:
        background_tasks.add_task(
            email_service.send_password_reset_email,
            to_email=payload.email,
            reset_token=token,
        )
    return {"message": "If that email is registered, a reset link has been sent."}


@router.post("/reset-password", status_code=status.HTTP_200_OK)
async def reset_password(
    payload: ResetPasswordRequest,
    db: Session = Depends(get_db),
) -> dict:
    """Reset password using a valid reset token."""
    success = user_service.reset_password(db, payload.token, payload.new_password)
    if not success:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
    return {"message": "Password reset successfully"}
