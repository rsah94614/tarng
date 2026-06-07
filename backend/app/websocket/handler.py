"""
WebSocket endpoint — authenticates via JWT query param, registers connection,
and handles incoming pings.

Connect: ws://host/ws?token=<access_token>
"""

import json
import logging

from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect, status
from jose import JWTError

from app.core.security import decode_token
from app.websocket.manager import manager

logger = logging.getLogger(__name__)
router = APIRouter()


@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    token: str = Query(...),
) -> None:
    """
    Authenticate the WebSocket connection via JWT token query param.
    Once connected, the server pushes notifications through this socket.
    """
    # Authenticate
    try:
        payload = decode_token(token)
        if payload.get("type") != "access":
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
        user_id = int(payload["sub"])
    except (JWTError, KeyError, ValueError):
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await manager.connect(websocket, user_id)
    logger.info(f"WebSocket authenticated: user_id={user_id}")

    try:
        # Send welcome message
        await websocket.send_json({"type": "connected", "payload": {"user_id": user_id}})

        # Keep alive — handle pings and client messages
        while True:
            raw = await websocket.receive_text()
            try:
                msg = json.loads(raw)
                if msg.get("type") == "ping":
                    await websocket.send_json({"type": "pong"})
            except Exception:
                pass  # Ignore malformed messages

    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected: user_id={user_id}")
    finally:
        manager.disconnect(websocket, user_id)
