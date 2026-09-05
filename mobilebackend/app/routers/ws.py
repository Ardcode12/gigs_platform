"""The worker's live channel.

One authenticated socket per worker carries every event type — new job requests,
chat messages, extra-amount decisions, payment and job updates — so the app opens
one connection instead of polling five endpoints.

The token travels as a query parameter because React Native's WebSocket cannot set
an Authorization header. That makes it visible in server access logs, which is why
it is the short-lived *access* token and never the refresh token.
"""

import logging

from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect
from starlette.concurrency import run_in_threadpool

from app.core.security import decode_token
from app.db.session import SessionLocal
from app.models import Customer, Worker
from app.ws.manager import manager

logger = logging.getLogger(__name__)
router = APIRouter(tags=["realtime"])

#: Close codes. 4401 mirrors HTTP 401 for a client that has to tell the two apart.
WS_UNAUTHORIZED = 4401


def _load_worker(worker_id: int) -> Worker | None:
    with SessionLocal() as db:
        return db.get(Worker, worker_id)


def _load_customer(customer_id: int) -> Customer | None:
    with SessionLocal() as db:
        customer = db.get(Customer, customer_id)
        return customer if (customer and customer.is_active) else None


@router.websocket("/api/ws")
async def worker_socket(websocket: WebSocket, token: str = Query(...)) -> None:
    worker_id = decode_token(token, "access", expected_role="worker")
    if worker_id is None:
        # Reject before accepting, so an invalid token never opens a socket.
        await websocket.close(code=WS_UNAUTHORIZED, reason="Invalid or expired token")
        return

    # The session is opened and closed here rather than held for the socket's
    # lifetime — a connection can live for hours, a DB connection should not.
    worker = await run_in_threadpool(_load_worker, worker_id)
    if worker is None:
        await websocket.close(code=WS_UNAUTHORIZED, reason="Unknown worker")
        return

    await manager.connect(worker_id, websocket)
    await websocket.send_json({"type": "connected", "payload": {"worker_id": worker_id}})

    try:
        while True:
            # The app has nothing to say over the socket; reads exist to detect a
            # dropped connection and to answer the client's keepalive.
            text = await websocket.receive_text()
            if text.strip().lower() in {"ping", '"ping"'}:
                await websocket.send_json({"type": "pong", "payload": {}})
    except WebSocketDisconnect:
        pass
    except Exception:  # noqa: BLE001 - a broken socket must not take the server down
        logger.debug("ws error for worker %s", worker_id, exc_info=True)
    finally:
        manager.disconnect(worker_id, websocket)


@router.websocket("/api/ws/customer")
async def customer_socket(websocket: WebSocket, token: str = Query(...)) -> None:
    customer_id = decode_token(token, "access", expected_role="customer")
    if customer_id is None:
        await websocket.close(code=WS_UNAUTHORIZED, reason="Invalid or expired token")
        return

    customer = await run_in_threadpool(_load_customer, customer_id)
    if customer is None:
        await websocket.close(code=WS_UNAUTHORIZED, reason="Unknown customer")
        return

    await manager.connect_customer(customer_id, websocket)
    await websocket.send_json({"type": "connected", "payload": {"customer_id": customer_id}})

    try:
        while True:
            text = await websocket.receive_text()
            if text.strip().lower() in {"ping", '"ping"'}:
                await websocket.send_json({"type": "pong", "payload": {}})
    except WebSocketDisconnect:
        pass
    except Exception:  # noqa: BLE001
        logger.debug("ws error for customer %s", customer_id, exc_info=True)
    finally:
        manager.disconnect_customer(customer_id, websocket)
