"""
WebSocket connection manager.

Manages active WebSocket connections and broadcasts messages to rooms.
Supports:
- Per-user connections (1 user → multiple tabs)
- Room-based broadcasts (e.g. "feed", "notifications:{user_id}")
- Redis Pub/Sub for multi-instance broadcasting
"""

from __future__ import annotations

import logging
from collections import defaultdict
from typing import Any

from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    def __init__(self) -> None:
        # user_id -> set of WebSocket connections
        self._connections: dict[int, set[WebSocket]] = defaultdict(set)

    async def connect(self, websocket: WebSocket, user_id: int) -> None:
        await websocket.accept()
        self._connections[user_id].add(websocket)
        logger.info(
            f"WS connected: user={user_id}, total_sockets={len(self._connections[user_id])}"
        )

    def disconnect(self, websocket: WebSocket, user_id: int) -> None:
        self._connections[user_id].discard(websocket)
        if not self._connections[user_id]:
            del self._connections[user_id]
        logger.info(f"WS disconnected: user={user_id}")

    async def send_to_user(self, user_id: int, message: dict[str, Any]) -> None:
        """Send a JSON message to all connections for a given user."""
        dead: list[WebSocket] = []
        for ws in list(self._connections.get(user_id, [])):
            try:
                await ws.send_json(message)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(ws, user_id)

    async def broadcast(self, message: dict[str, Any]) -> None:
        """Broadcast a JSON message to ALL connected users."""
        for user_id in list(self._connections.keys()):
            await self.send_to_user(user_id, message)

    @property
    def connected_user_count(self) -> int:
        return len(self._connections)


# Global singleton
manager = ConnectionManager()
