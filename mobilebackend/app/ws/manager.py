"""WebSocket connection registry.

One worker may have several live sockets (phone plus a reloaded Expo client), so
connections are stored per worker id as a set.

Route handlers in this service are synchronous (`def`), which FastAPI runs in a
worker thread — so they cannot `await` a send. `push_threadsafe` bridges that gap
by scheduling the coroutine onto the main event loop captured at startup.
"""

import asyncio
import logging
from typing import Any

from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    def __init__(self) -> None:
        self._connections: dict[int, set[WebSocket]] = {}
        self._loop: asyncio.AbstractEventLoop | None = None

    # -- lifecycle ---------------------------------------------------------
    def bind_loop(self, loop: asyncio.AbstractEventLoop) -> None:
        """Called once from the app lifespan so sync code can schedule sends."""
        self._loop = loop

    async def connect(self, worker_id: int, websocket: WebSocket) -> None:
        await websocket.accept()
        self._connections.setdefault(worker_id, set()).add(websocket)
        logger.info("ws connect worker=%s (%d live)", worker_id, len(self._connections[worker_id]))

    def disconnect(self, worker_id: int, websocket: WebSocket) -> None:
        sockets = self._connections.get(worker_id)
        if not sockets:
            return
        sockets.discard(websocket)
        if not sockets:
            self._connections.pop(worker_id, None)
        logger.info("ws disconnect worker=%s", worker_id)

    def is_connected(self, worker_id: int) -> bool:
        return bool(self._connections.get(worker_id))

    def connection_count(self) -> int:
        """Total live sockets across all workers — surfaced on /health."""
        return sum(len(s) for s in self._connections.values())

    # -- sending -----------------------------------------------------------
    async def send(self, worker_id: int, event_type: str, payload: dict[str, Any]) -> None:
        """Send one event to every socket this worker has open."""
        sockets = list(self._connections.get(worker_id, ()))
        if not sockets:
            return

        message = {"type": event_type, "payload": payload}
        for socket in sockets:
            try:
                await socket.send_json(message)
            except Exception:  # noqa: BLE001 - a dead socket must not break the others
                logger.debug("ws send failed worker=%s, dropping socket", worker_id)
                self.disconnect(worker_id, socket)

    async def broadcast(
        self, worker_ids: list[int], event_type: str, payload: dict[str, Any]
    ) -> None:
        for worker_id in worker_ids:
            await self.send(worker_id, event_type, payload)

    def push_threadsafe(self, worker_id: int, event_type: str, payload: dict[str, Any]) -> None:
        """Fire-and-forget send, safe to call from a synchronous route handler."""
        if self._loop is None or not self.is_connected(worker_id):
            return
        try:
            asyncio.run_coroutine_threadsafe(
                self.send(worker_id, event_type, payload), self._loop
            )
        except RuntimeError:  # loop shutting down
            logger.debug("ws push skipped, loop unavailable")


manager = ConnectionManager()
