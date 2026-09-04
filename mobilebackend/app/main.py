"""FastAPI application for the WORKMAT worker app.

Only workers authenticate here. The customer side of the product is out of scope,
so customers exist as a table (so a job has a name and a rating to show) and, in
DEV_MODE only, as the /api/dev test harness.
"""

import asyncio
import logging
from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.core.config import settings
from app.db.session import engine
from app.routers import (
    admin,
    auth,
    chat,
    earnings,
    extra_amount,
    jobs,
    notifications,
    ratings,
    workers,
    ws,
)
from app.ws.manager import manager

logging.basicConfig(
    level=logging.DEBUG if settings.DEV_MODE else logging.INFO,
    format="%(asctime)s %(levelname)-8s %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    # Route handlers are synchronous, so FastAPI runs them in a threadpool. Capturing
    # the event loop here is what lets those threads push WebSocket events back onto
    # it (see ws/manager.push_threadsafe).
    manager.bind_loop(asyncio.get_running_loop())
    logger.info("worker API started (dev_mode=%s)", settings.DEV_MODE)
    yield
    engine.dispose()


def create_app() -> FastAPI:
    app = FastAPI(
        title="WORKMAT Worker API",
        description=(
            "Backend for the worker-side mobile app: login, availability, job "
            "requests, job lifecycle, chat, extra-amount requests, earnings, "
            "ratings and notifications."
        ),
        version="1.0.0",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(auth.router)
    app.include_router(workers.router)
    app.include_router(jobs.router)
    app.include_router(chat.router)
    app.include_router(extra_amount.router)
    app.include_router(earnings.router)
    app.include_router(ratings.router)
    app.include_router(notifications.router)
    app.include_router(admin.router)
    app.include_router(ws.router)

    if settings.DEV_MODE:
        # Imported inside the branch so a production process never even loads the
        # harness. Set DEV_MODE=false and these routes do not exist.
        from app.routers import dev

        app.include_router(dev.router)
        logger.warning("DEV_MODE is on: /api/dev/* harness is mounted and unauthenticated")

    @app.get("/health", tags=["meta"])
    def health() -> dict[str, object]:
        """Liveness plus a real database round-trip — a 200 here means both work."""
        database = "ok"
        try:
            with engine.connect() as connection:
                connection.execute(text("SELECT 1"))
        except Exception as exc:  # noqa: BLE001 - reported, not raised
            logger.exception("health check: database unreachable")
            database = f"error: {type(exc).__name__}"

        return {
            "status": "ok" if database == "ok" else "degraded",
            "database": database,
            "dev_mode": settings.DEV_MODE,
            "live_connections": manager.connection_count(),
        }

    @app.get("/", include_in_schema=False)
    def root() -> dict[str, str]:
        return {"service": "WORKMAT Worker API", "docs": "/docs"}

    return app


app = create_app()
