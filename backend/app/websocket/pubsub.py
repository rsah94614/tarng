"""
Redis Pub/Sub subscriber for multi-instance WebSocket broadcasting.

Listens to two channel patterns:
  - ws:broadcast          → broadcast to all connected users
  - user:{id}:notifications → push to a specific user
"""

import json
import logging

from app.db.redis import get_redis
from app.websocket.manager import manager

logger = logging.getLogger(__name__)


async def pubsub_listener() -> None:
    """Subscribe to Redis channels and relay messages to WebSocket clients."""
    redis = await get_redis()
    pubsub = redis.pubsub()

    # Subscribe to the broadcast channel and pattern-subscribe to user channels
    await pubsub.subscribe("ws:broadcast")
    await pubsub.psubscribe("user:*:notifications")

    logger.info("Redis Pub/Sub listener started (ws:broadcast + user:*:notifications)")

    async for message in pubsub.listen():
        msg_type = message.get("type")
        if msg_type not in ("message", "pmessage"):
            continue

        try:
            data = json.loads(message["data"])

            if msg_type == "pmessage":
                # Pattern match: user:{id}:notifications
                channel: str = message.get("channel", "")
                parts = channel.split(":")
                if len(parts) == 3 and parts[0] == "user" and parts[2] == "notifications":
                    user_id = int(parts[1])
                    await manager.send_to_user(user_id, data)
            else:
                # Broadcast channel
                user_id = data.get("user_id")
                payload = data.get("payload", data)
                if user_id:
                    await manager.send_to_user(int(user_id), payload)
                else:
                    await manager.broadcast(payload)

        except Exception as exc:
            logger.error(f"Pub/Sub relay error: {exc}")
