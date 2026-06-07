from fastapi import APIRouter

from app.api.v1.endpoints import auth, communities, health, notifications, posts, users
from app.websocket.handler import router as ws_router

api_router = APIRouter()

api_router.include_router(health.router, tags=["health"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(communities.router, prefix="/communities", tags=["communities"])
api_router.include_router(posts.router, prefix="/posts", tags=["posts"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["notifications"])
api_router.include_router(ws_router, tags=["websocket"])
