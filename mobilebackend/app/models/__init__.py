"""Import every model so SQLAlchemy's registry and Alembic's autogenerate see them.

Cross-module relationships are declared by class name, so they only resolve once
all modules are imported — importing this package is what makes that happen.
"""

from app.models.chat import CallRequest, ChatMessage, ChatMessageTranslation
from app.models.customer import Customer
from app.models.enums import (
    ALLOWED_TRANSITIONS,
    JOB_PROGRESS_STEPS,
    CallRequestStatus,
    ExtraAmountStatus,
    JobStatus,
    MessageSender,
    NotificationType,
    PaymentStatus,
    PaymentMethod,
    WsEvent,
)
from app.models.extra_amount import ExtraAmountRequest
from app.models.job import Job, JobRejection, JobService, JobStatusEvent
from app.models.notification import Notification
from app.models.password_reset import PasswordReset
from app.models.payment import Payment
from app.models.report import JobReport
from app.models.rating import Rating
from app.models.society import Society
from app.models.worker import Worker

__all__ = [
    "ALLOWED_TRANSITIONS",
    "JOB_PROGRESS_STEPS",
    "CallRequest",
    "CallRequestStatus",
    "ChatMessage",
    "ChatMessageTranslation",
    "Customer",
    "ExtraAmountRequest",
    "ExtraAmountStatus",
    "Job",
    "JobRejection",
    "JobService",
    "JobStatus",
    "JobStatusEvent",
    "MessageSender",
    "Notification",
    "NotificationType",
    "PasswordReset",
    "Payment",
    "PaymentStatus",
    "PaymentMethod",
    "JobReport",
    "Rating",
    "Society",
    "Worker",
    "WsEvent",
]
