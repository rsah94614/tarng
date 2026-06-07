from typing import Any

from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
    )

    # ─── App ──────────────────────────────────────────────────
    PROJECT_NAME: str = "tarng"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # ─── Security ─────────────────────────────────────────────
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # ─── Database ─────────────────────────────────────────────
    DATABASE_URL: str

    # ─── Redis ────────────────────────────────────────────────
    REDIS_URL: str = "redis://localhost:6379/0"

    # ─── MinIO / S3 ───────────────────────────────────────────
    S3_ENDPOINT_URL: str = "http://localhost:9000"
    S3_ACCESS_KEY: str = ""
    S3_SECRET_KEY: str = ""
    S3_BUCKET_NAME: str = "tarng-media"
    S3_REGION: str = "us-east-1"

    # ─── CORS ─────────────────────────────────────────────────
    BACKEND_CORS_ORIGINS: list[AnyHttpUrl] = []

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Any) -> Any:
        if isinstance(v, str):
            import json
            return json.loads(v)
        return v

    # ─── Sentry ───────────────────────────────────────────────
    SENTRY_DSN: str = ""

    # ─── Email ────────────────────────────────────────────────
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    EMAILS_FROM_EMAIL: str = "noreply@tarng.com"
    EMAILS_FROM_NAME: str = "tarng"


settings = Settings()  # type: ignore[call-arg]
