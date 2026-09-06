"""Customer job booking, tracking, and cancellation endpoints."""

import logging
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, HTTPException, Query, status as http_status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.deps import CurrentCustomer, DbSession
from app.models import (
    Job,
    JobRejection,
    JobService,
    JobStatus,
    JobStatusEvent,
    NotificationType,
    Society,
    Worker,
    WsEvent,
)
from app.schemas.auth import MessageResponse
from app.schemas.customer import (
    CustomerJobCreate,
    CustomerJobDetail,
    CustomerJobListItem,
    WorkerLocationOut,
)
from app.services.geo import distance_and_eta
from app.services.notify import notify, push_customer_event
from app.services.serialize import (
    serialize_customer_job_detail,
    serialize_customer_job_list_item,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/customer/jobs", tags=["customer-jobs"])

ACTIVE_CUSTOMER_STATUSES = (
    JobStatus.REQUESTED,
    JobStatus.ACCEPTED,
    JobStatus.ON_THE_WAY,
    JobStatus.ARRIVED,
    JobStatus.WORK_STARTED,
)


def _generate_otp() -> str:
    """Generate a random 6-digit OTP code for job completion verification."""
    return "".join(secrets.choice("0123456789") for _ in range(6))


def _get_customer_job(db: Session, customer_id: int, job_id: int) -> Job:
    job = db.get(Job, job_id)
    if job is None or job.customer_id != customer_id:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND, detail="Job not found"
        )
    return job


from app.routers.jobs import _matches_skills


def _workers_to_alert(db: Session, job: Job) -> list[Worker]:
    """Directed job -> that worker. Broadcast -> every available worker whose skills match."""
    if job.worker_id is not None:
        worker = db.get(Worker, job.worker_id)
        return [worker] if worker else []

    rejected = set(
        db.scalars(select(JobRejection.worker_id).where(JobRejection.job_id == job.id)).all()
    )
    available = db.scalars(select(Worker).where(Worker.is_available.is_(True))).all()
    return [
        w for w in available
        if w.id not in rejected
        and (job.society_id is None or w.society_id == job.society_id)
        and _matches_skills(job, w)
    ]


@router.post("", response_model=CustomerJobDetail, status_code=http_status.HTTP_201_CREATED)
def create_job(payload: CustomerJobCreate, customer: CurrentCustomer, db: DbSession) -> CustomerJobDetail:
    """Raise a new job request as a customer booking."""
    society_id = None
    if payload.preferred_worker_id is not None:
        worker = db.get(Worker, payload.preferred_worker_id)
        if worker is None:
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND, detail="Preferred worker not found"
            )
        society_id = worker.society_id
    else:
        society_id = db.scalars(select(Society.id)).first()

    otp_code = _generate_otp()

    job = Job(
        customer_id=customer.id,
        society_id=society_id,
        worker_id=payload.preferred_worker_id,
        service_type=payload.service_type,
        service_icon=payload.service_icon or "wrench",
        work_details=payload.work_details,
        address=payload.address,
        landmark=payload.landmark,
        lat=payload.lat,
        lng=payload.lng,
        base_amount=payload.base_amount,
        otp_code=otp_code,
        status=JobStatus.REQUESTED,
    )
    db.add(job)
    db.flush()

    # Add line items if provided, or default to single base amount line item
    if payload.services:
        for item in payload.services:
            name = item.name if hasattr(item, "name") else item["name"]
            price = item.price if hasattr(item, "price") else item["price"]
            db.add(JobService(job_id=job.id, name=name, price=price))
    else:
        db.add(JobService(job_id=job.id, name=payload.service_type, price=payload.base_amount))

    db.add(
        JobStatusEvent(
            job_id=job.id, status=JobStatus.REQUESTED, note="Customer created booking request"
        )
    )

    # Notify candidate workers
    alerted = _workers_to_alert(db, job)
    for worker in alerted:
        notify(
            db,
            worker.id,
            NotificationType.NEW_JOB,
            title=f"New {job.service_type} request",
            body=f"{customer.name} · {job.address}",
            data={"job_id": job.id, "amount": float(job.base_amount)},
        )

    db.commit()
    db.refresh(job)
    return serialize_customer_job_detail(db, job)


@router.get("/active", response_model=CustomerJobDetail | None)
def get_active_job(customer: CurrentCustomer, db: DbSession) -> CustomerJobDetail | None:
    """The customer's current job in progress, or null."""
    job = db.scalars(
        select(Job)
        .where(Job.customer_id == customer.id, Job.status.in_(ACTIVE_CUSTOMER_STATUSES))
        .order_by(Job.requested_at.desc())
    ).first()
    return None if job is None else serialize_customer_job_detail(db, job)


@router.get("", response_model=list[CustomerJobListItem])
def list_customer_jobs(
    customer: CurrentCustomer,
    db: DbSession,
    job_status: JobStatus | None = Query(default=None, alias="status"),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
) -> list[CustomerJobListItem]:
    """Customer job history, newest first."""
    stmt = select(Job).where(Job.customer_id == customer.id)
    if job_status is not None:
        stmt = stmt.where(Job.status == job_status)

    jobs = db.scalars(stmt.order_by(Job.requested_at.desc()).limit(limit).offset(offset)).all()
    return [serialize_customer_job_list_item(j) for j in jobs]


@router.get("/{job_id}", response_model=CustomerJobDetail)
def get_job_detail(job_id: int, customer: CurrentCustomer, db: DbSession) -> CustomerJobDetail:
    """Get full details of a job for the customer (including OTP code)."""
    job = _get_customer_job(db, customer.id, job_id)
    return serialize_customer_job_detail(db, job)


@router.get("/{job_id}/worker-location", response_model=WorkerLocationOut)
def get_worker_location(
    job_id: int, customer: CurrentCustomer, db: DbSession
) -> WorkerLocationOut:
    """Live GPS position of the worker assigned to this job."""
    job = _get_customer_job(db, customer.id, job_id)
    if job.worker is None or job.worker.last_lat is None or job.worker.last_lng is None:
        return WorkerLocationOut(
            worker_id=job.worker_id,
            name=job.worker.name if job.worker else None,
            lat=None,
            lng=None,
            distance_km=None,
            eta_minutes=None,
            updated_at=None,
        )

    distance, eta = distance_and_eta(
        job.worker.last_lat,
        job.worker.last_lng,
        job.lat,
        job.lng,
    )
    return WorkerLocationOut(
        worker_id=job.worker.id,
        name=job.worker.name,
        lat=job.worker.last_lat,
        lng=job.worker.last_lng,
        distance_km=distance,
        eta_minutes=eta,
        updated_at=job.worker.location_updated_at,
    )


@router.post("/{job_id}/cancel", response_model=CustomerJobDetail)
def cancel_job(job_id: int, customer: CurrentCustomer, db: DbSession) -> CustomerJobDetail:
    """Cancel a job request (allowed prior to work completion)."""
    job = _get_customer_job(db, customer.id, job_id)

    if job.status in (JobStatus.COMPLETED, JobStatus.CANCELLED, JobStatus.REJECTED):
        raise HTTPException(
            status_code=http_status.HTTP_409_CONFLICT,
            detail=f"Cannot cancel job in state '{job.status.value}'",
        )

    job.status = JobStatus.CANCELLED
    db.add(
        JobStatusEvent(
            job_id=job.id, status=JobStatus.CANCELLED, note="Cancelled by customer"
        )
    )

    # Notify worker if assigned
    if job.worker_id is not None:
        notify(
            db,
            job.worker_id,
            NotificationType.JOB_UPDATE,
            title=f"Job #{job.id} cancelled by customer",
            body=f"{customer.name} cancelled the request for {job.service_type}.",
            data={"job_id": job.id, "status": JobStatus.CANCELLED.value},
        )

    db.commit()
    db.refresh(job)

    push_customer_event(
        customer.id, WsEvent.JOB_UPDATE, {"job_id": job.id, "status": job.status.value}
    )
    return serialize_customer_job_detail(db, job)
