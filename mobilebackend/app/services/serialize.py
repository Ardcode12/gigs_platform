"""Turn ORM rows into the response shapes the worker app renders.

Kept in one place so the requests list, the active-job card, the history list and
the detail screen can never disagree about how a job's amounts or progress step
are computed.
"""

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import (
    JOB_PROGRESS_STEPS,
    ChatMessage,
    Customer,
    ExtraAmountRequest,
    ExtraAmountStatus,
    Job,
    JobStatus,
    MessageSender,
    Payment,
    Worker,
)
from app.schemas.customer import (
    AssignedWorkerOut,
    CustomerJobDetail,
    CustomerJobListItem,
    CustomerOut as CustomerSchemaOut,
)
from app.schemas.job import (
    AmountsOut,
    CustomerOut,
    ExtraAmountOut,
    JobDetail,
    JobListItem,
    JobServiceOut,
    LocationOut,
    StatusEventOut,
)
from app.schemas.misc import PaymentOut
from app.schemas.worker import WorkerOut
from app.services.geo import distance_and_eta


def current_step(status: JobStatus) -> int | None:
    """Index into the app's 5-step stepper, or None for a job that left the path."""
    try:
        return JOB_PROGRESS_STEPS.index(status)
    except ValueError:
        return None


def split_extras(job: Job) -> tuple[float, float]:
    """(approved total, pending total). A pending request must not inflate the job total."""
    approved = sum(
        float(r.amount) for r in job.extra_requests if r.status == ExtraAmountStatus.APPROVED
    )
    pending = sum(
        float(r.amount) for r in job.extra_requests if r.status == ExtraAmountStatus.PENDING
    )
    return approved, pending


def job_amounts(job: Job) -> AmountsOut:
    approved, pending = split_extras(job)
    base = float(job.base_amount)
    return AmountsOut(
        base_amount=base,
        extra_amount=approved,
        total_amount=base + approved,
        pending_extra_amount=pending,
    )


def serialize_job_list_item(job: Job, worker: Worker) -> JobListItem:
    distance, eta = distance_and_eta(worker.last_lat, worker.last_lng, job.lat, job.lng)
    approved, _ = split_extras(job)
    return JobListItem(
        id=job.id,
        service_type=job.service_type,
        service_icon=job.service_icon,
        status=job.status,
        customer_name=job.customer.name,
        address=job.address,
        landmark=job.landmark,
        lat=job.lat,
        lng=job.lng,
        distance_km=distance,
        eta_min=eta,
        total_amount=float(job.base_amount) + approved,
        requested_at=job.requested_at,
        accepted_at=job.accepted_at,
        completed_at=job.completed_at,
        current_step=current_step(job.status),
    )


def serialize_job_detail(db: Session, job: Job, worker: Worker) -> JobDetail:
    distance, eta = distance_and_eta(worker.last_lat, worker.last_lng, job.lat, job.lng)

    unread = db.scalar(
        select(func.count())
        .select_from(ChatMessage)
        .where(
            ChatMessage.job_id == job.id,
            ChatMessage.sender == MessageSender.CUSTOMER,
            ChatMessage.read_at.is_(None),
        )
    )

    return JobDetail(
        id=job.id,
        service_type=job.service_type,
        service_icon=job.service_icon,
        work_details=job.work_details,
        status=job.status,
        current_step=current_step(job.status),
        customer=CustomerOut.model_validate(job.customer),
        location=LocationOut(
            address=job.address,
            landmark=job.landmark,
            lat=job.lat,
            lng=job.lng,
            distance_km=distance,
            eta_min=eta,
        ),
        services=[JobServiceOut.model_validate(s) for s in job.services],
        amounts=job_amounts(job),
        extra_requests=[ExtraAmountOut.model_validate(r) for r in job.extra_requests],
        status_events=[StatusEventOut.model_validate(e) for e in job.status_events],
        requested_at=job.requested_at,
        accepted_at=job.accepted_at,
        completed_at=job.completed_at,
        unread_messages=unread or 0,
    )


def serialize_worker(worker: Worker) -> WorkerOut:
    data = WorkerOut.model_validate(worker)
    # `society` is lazy-loaded; touching it here keeps the router free of the detail.
    data.society_name = worker.society.name if worker.society else None
    return data


def serialize_extra_request(request: ExtraAmountRequest) -> ExtraAmountOut:
    return ExtraAmountOut.model_validate(request)


def serialize_payment(payment: Payment) -> PaymentOut:
    data = PaymentOut.model_validate(payment)
    if payment.job is not None:
        data.service_type = payment.job.service_type
        data.customer_name = payment.job.customer.name if payment.job.customer else None
    return data


def serialize_customer(customer: Customer) -> CustomerSchemaOut:
    addresses = customer.saved_addresses if isinstance(customer.saved_addresses, list) else []
    return CustomerSchemaOut(
        id=customer.id,
        name=customer.name,
        phone=customer.phone,
        email=customer.email,
        city=customer.city,
        photo_url=customer.photo_url,
        rating_avg=float(customer.rating_avg or 0),
        rating_count=customer.rating_count or 0,
        saved_addresses=addresses,
        created_at=customer.created_at,
    )


def serialize_customer_job_list_item(job: Job) -> CustomerJobListItem:
    approved, _ = split_extras(job)
    assigned_worker = None
    if job.worker is not None:
        distance, eta = distance_and_eta(
            job.worker.last_lat,
            job.worker.last_lng,
            job.lat,
            job.lng,
        )
        assigned_worker = AssignedWorkerOut(
            id=job.worker.id,
            name=job.worker.name,
            phone=job.worker.phone,
            photo_url=job.worker.photo_url,
            rating_avg=float(job.worker.rating_avg or 0),
            rating_count=job.worker.rating_count or 0,
            skills=job.worker.skills or [],
            completed_jobs=job.worker.completed_jobs or 0,
            last_lat=job.worker.last_lat,
            last_lng=job.worker.last_lng,
            distance_km=distance,
            eta_minutes=eta,
            location_updated_at=job.worker.location_updated_at,
        )
    return CustomerJobListItem(
        id=job.id,
        service_type=job.service_type,
        service_icon=job.service_icon,
        status=job.status,
        worker=assigned_worker,
        address=job.address,
        landmark=job.landmark,
        lat=job.lat,
        lng=job.lng,
        total_amount=float(job.base_amount) + approved,
        requested_at=job.requested_at,
        accepted_at=job.accepted_at,
        completed_at=job.completed_at,
        current_step=current_step(job.status),
    )


def serialize_customer_job_detail(db: Session, job: Job) -> CustomerJobDetail:
    unread = db.scalar(
        select(func.count())
        .select_from(ChatMessage)
        .where(
            ChatMessage.job_id == job.id,
            ChatMessage.sender == MessageSender.WORKER,
            ChatMessage.read_at.is_(None),
        )
    )
    assigned_worker = None
    if job.worker is not None:
        distance, eta = distance_and_eta(
            job.worker.last_lat,
            job.worker.last_lng,
            job.lat,
            job.lng,
        )
        assigned_worker = AssignedWorkerOut(
            id=job.worker.id,
            name=job.worker.name,
            phone=job.worker.phone,
            photo_url=job.worker.photo_url,
            rating_avg=float(job.worker.rating_avg or 0),
            rating_count=job.worker.rating_count or 0,
            skills=job.worker.skills or [],
            completed_jobs=job.worker.completed_jobs or 0,
            last_lat=job.worker.last_lat,
            last_lng=job.worker.last_lng,
            distance_km=distance,
            eta_minutes=eta,
            location_updated_at=job.worker.location_updated_at,
        )

    return CustomerJobDetail(
        id=job.id,
        service_type=job.service_type,
        service_icon=job.service_icon,
        work_details=job.work_details,
        status=job.status,
        current_step=current_step(job.status),
        otp_code=job.otp_code,
        completion_otp_code=job.completion_otp_code,
        worker=assigned_worker,
        address=job.address,
        landmark=job.landmark,
        lat=job.lat,
        lng=job.lng,
        services=[JobServiceOut.model_validate(s) for s in job.services],
        amounts=job_amounts(job),
        extra_requests=[ExtraAmountOut.model_validate(r) for r in job.extra_requests],
        status_events=[StatusEventOut.model_validate(e) for e in job.status_events],
        requested_at=job.requested_at,
        accepted_at=job.accepted_at,
        completed_at=job.completed_at,
        unread_messages=unread or 0,
    )
