"""Customer API package routers."""

from app.routers.customer.auth import router as auth_router
from app.routers.customer.chat import router as chat_router
from app.routers.customer.extra_amount import router as extra_amount_router
from app.routers.customer.jobs import router as jobs_router
from app.routers.customer.notifications import router as notifications_router
from app.routers.customer.payments import router as payments_router
from app.routers.customer.ratings import router as ratings_router
from app.routers.customer.services import router as services_router
from app.routers.customer.workers import router as workers_router

__all__ = [
    "auth_router",
    "chat_router",
    "extra_amount_router",
    "jobs_router",
    "notifications_router",
    "payments_router",
    "ratings_router",
    "services_router",
    "workers_router",
]
