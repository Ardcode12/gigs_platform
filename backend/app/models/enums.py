"""Shared enums. Values are the strings the API and the mobile app exchange."""

import enum


class JobStatus(str, enum.Enum):
    """Maps 1:1 onto the worker app's JOB_STEPS stepper (plus terminal failures)."""

    REQUESTED = "requested"
    ACCEPTED = "accepted"
    ON_THE_WAY = "on_the_way"
    ARRIVED = "arrived"
    WORK_STARTED = "work_started"
    COMPLETED = "completed"
    REJECTED = "rejected"
    CANCELLED = "cancelled"


#: The ordered happy path. Index positions feed StepperProgress's `currentStep`.
JOB_PROGRESS_STEPS: tuple[JobStatus, ...] = (
    JobStatus.ACCEPTED,
    JobStatus.ON_THE_WAY,
    JobStatus.ARRIVED,
    JobStatus.WORK_STARTED,
    JobStatus.COMPLETED,
)

#: Which statuses a worker may move a job to, from each status.
ALLOWED_TRANSITIONS: dict[JobStatus, set[JobStatus]] = {
    JobStatus.ACCEPTED: {JobStatus.ON_THE_WAY, JobStatus.CANCELLED},
    JobStatus.ON_THE_WAY: {JobStatus.ARRIVED, JobStatus.CANCELLED},
    JobStatus.ARRIVED: {JobStatus.WORK_STARTED, JobStatus.CANCELLED},
    JobStatus.WORK_STARTED: {JobStatus.COMPLETED},
    JobStatus.COMPLETED: set(),
    JobStatus.REQUESTED: set(),  # leave `requested` via /accept or /reject only
    JobStatus.REJECTED: set(),
    JobStatus.CANCELLED: set(),
}


class ExtraAmountStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class MessageSender(str, enum.Enum):
    WORKER = "worker"
    CUSTOMER = "customer"


class CallRequestStatus(str, enum.Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    DECLINED = "declined"


class PaymentStatus(str, enum.Enum):
    PENDING = "pending"
    PAID = "paid"


class PaymentMethod(str, enum.Enum):
    DIGITAL = "digital"
    CASH = "cash"


class NotificationType(str, enum.Enum):
    NEW_JOB = "new_job"
    CHAT = "chat"
    EXTRA_AMOUNT = "extra_amount"
    PAYMENT = "payment"
    JOB_UPDATE = "job_update"


class WsEvent(str, enum.Enum):
    """WebSocket envelope `type` values."""

    NEW_JOB_REQUEST = "new_job_request"
    CHAT_MESSAGE = "chat_message"
    EXTRA_AMOUNT_DECISION = "extra_amount_decision"
    PAYMENT_UPDATE = "payment_update"
    JOB_UPDATE = "job_update"
