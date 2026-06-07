"""
tarng FastAPI application factory.
"""
import asyncio
import logging

import sentry_sdk
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration

from app.api.v1.router import api_router
from app.core.config import settings
from app.db.redis import close_redis

logger = logging.getLogger(__name__)

# ─── Sentry ──────────────────────────────────────────────────
if settings.SENTRY_DSN:
    sentry_sdk.init(
        dsn=settings.SENTRY_DSN,
        environment=settings.ENVIRONMENT,
        integrations=[FastApiIntegration(), SqlalchemyIntegration()],
        traces_sample_rate=0.2,
    )


# ─── App factory ─────────────────────────────────────────────
def create_app() -> FastAPI:
    application = FastAPI(
        title=settings.PROJECT_NAME,
        version=settings.VERSION,
        openapi_url=f"{settings.API_V1_STR}/openapi.json",
        docs_url=f"{settings.API_V1_STR}/docs",
        redoc_url=f"{settings.API_V1_STR}/redoc",
    )

    # ── CORS ──────────────────────────────────────────────────
    application.add_middleware(
        CORSMiddleware,
        allow_origins=[str(o).rstrip("/") for o in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── Routers ───────────────────────────────────────────────
    application.include_router(api_router, prefix=settings.API_V1_STR)

    # ── Lifecycle events ──────────────────────────────────────
    @application.on_event("startup")
    async def startup_event() -> None:
        logger.info("tarng API starting up...")
        if settings.ENVIRONMENT != "development":
            from app.websocket.pubsub import pubsub_listener
            asyncio.create_task(pubsub_listener())

    @application.on_event("shutdown")
    async def shutdown_event() -> None:
        logger.info("tarng API shutting down...")
        await close_redis()

    return application


app = create_app()
