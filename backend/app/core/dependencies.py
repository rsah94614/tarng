from collections.abc import Generator

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError

from app.core.security import decode_token
from app.db.base import SessionLocal

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def get_db() -> Generator:
    """FastAPI dependency: yields a SQLAlchemy session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user_id(token: str = Depends(oauth2_scheme)) -> int:
    """FastAPI dependency: decode JWT and return user ID."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_token(token)
        user_id: str = payload.get("sub")  # type: ignore[assignment]
        if user_id is None or payload.get("type") != "access":
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    return int(user_id)
