"""Job requests, accept/reject, and the status lifecycle (spec #3, #7, #8, #9).

Two shapes of request exist:

* **broadcast** — `jobs.worker_id IS NULL`, offered to every available worker whose
  skills match; the first to accept claims it.
* **directed** — `jobs.worker_id` already set with status `requested`, assigned to
  one worker by the society.

Rejection differs accordingly: a directed job becomes `rejected`, while a broadcast
job only gets a `job_rejections` row so it stays available to everyone else.
"""

import logging
from datetime import date, datetime, timedelta, timezone

from fastapi import APIRouter, HTTPException, Query, status as http_status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, lazyload

from app.core.deps import CurrentWorker, DbSession
from app.models import (
    ALLOWED_TRANSITIONS,
    Job,
    JobRejection,
    JobStatus,
    JobStatusEvent,
    NotificationType,
    Payment,
    PaymentStatus,
    Worker,
    WsEvent,
)
from app.schemas.auth import MessageResponse
from app.schemas.job import JobDetail, JobListItem, JobRejectRequest, JobStatusUpdate
from app.services.access import get_job_for_worker
from app.services.geo import distance_and_eta
from app.services.notify import notify, push_event
from app.services.otp import generate_code
from app.core.security import hash_password, verify_password
from app.services.serialize import (
    serialize_job_detail,
    serialize_job_list_item,
    split_extras,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/jobs", tags=["jobs"])

#: A job in one of these states is in progress, and the worker app shows it on the
#: Current Job screen. Only one at a time — that screen has room for exactly one.
ACTIVE_STATUSES = (
    JobStatus.ACCEPTED,
    JobStatus.ON_THE_WAY,
    JobStatus.ARRIVED,
    JobStatus.WORK_STARTED,
)


def _record_status(db: Session, job: Job, new_status: JobStatus, note: str | None = None) -> None:
    """Move a job and append to its audit trail in one step, so they can't diverge."""
    job.status = new_status
    db.add(JobStatusEvent(job_id=job.id, status=new_status, note=note))


def _matches_skills(job: Job, worker: Worker) -> bool:
    """Loose service-to-skill match; a worker with no skills listed sees everything."""
    if not worker.skills:
        return True
    service = job.service_type.lower()
    return any(service in s.lower() or s.lower() in service for s in worker.skills)


# -- reads -----------------------------------------------------------------
# Literal paths are declared before /{job_id} so "requests" and "current" are not
# swallowed by the int path parameter.


@router.get("/requests", response_model=list[JobListItem])
def list_requests(worker: CurrentWorker, db: DbSession) -> list[JobListItem]:
    """Open requests for this worker, nearest first (spec #3).

    An unavailable worker gets an empty list: the 🔴 toggle has to actually stop
    work arriving, otherwise it is only a label.
    """
    if not worker.is_available:
        return []

    rejected_ids = select(JobRejection.job_id).where(JobRejection.worker_id == worker.id)

    jobs = db.scalars(
        select(Job)
        .where(
            Job.status == JobStatus.REQUESTED,
            or_(Job.worker_id.is_(None), Job.worker_id == worker.id),
            Job.id.not_in(rejected_ids),
        )
        .order_by(Job.requested_at.desc())
    ).all()

    candidates = [j for j in jobs if _matches_skills(j, worker)]

    def sort_key(job: Job) -> tuple[int, float]:
        distance, _ = distance_and_eta(worker.last_lat, worker.last_lng, job.lat, job.lng)
        # Jobs with an unknown distance sort last but are never hidden — a worker
        # who declined location permission still needs to see the work.
        return (1, 0.0) if distance is None else (0, distance)

    candidates.sort(key=sort_key)
    return [serialize_job_list_item(j, worker) for j in candidates]


@router.get("/current", response_model=JobDetail | None)
def get_current_job(worker: CurrentWorker, db: DbSession) -> JobDetail | None:
    """The job in progress, or null. Drives the Current Job screen (spec #8)."""
    job = db.scalars(
        select(Job)
        .where(Job.worker_id == worker.id, Job.status.in_(ACTIVE_STATUSES))
        .order_by(Job.accepted_at.desc())
    ).first()
    return None if job is None else serialize_job_detail(db, job, worker)


@router.get("", response_model=list[JobListItem])
def list_jobs(
    worker: CurrentWorker,
    db: DbSession,
    job_status: JobStatus | None = Query(default=None, alias="status"),
    date_from: date | None = Query(default=None, alias="from"),
    date_to: date | None = Query(default=None, alias="to"),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
) -> list[JobListItem]:
    """This worker's job history, newest first.

    Open requests are excluded by default — they live at /requests, and mixing them
    into history would double-count them on the Jobs tab.
    """
    # Completed jobs are naturally dated by completion; anything else by request.
    happened_at = func.coalesce(Job.completed_at, Job.requested_at)

    stmt = select(Job).where(Job.worker_id == worker.id)
    if job_status is not None:
        stmt = stmt.where(Job.status == job_status)
    else:
        stmt = stmt.where(Job.status != JobStatus.REQUESTED)
    if date_from is not None:
        stmt = stmt.where(happened_at >= datetime.combine(date_from, datetime.min.time()))
    if date_to is not None:
        # Exclusive upper bound at the next midnight, so `to` includes its whole day.
        stmt = stmt.where(
            happened_at < datetime.combine(date_to + timedelta(days=1), datetime.min.time())
        )

    jobs = db.scalars(stmt.order_by(happened_at.desc()).limit(limit).offset(offset)).all()
    return [serialize_job_list_item(j, worker) for j in jobs]


@router.get("/{job_id}", response_model=JobDetail)
def get_job(job_id: int, worker: CurrentWorker, db: DbSession) -> JobDetail:
    """Full detail (spec #9). Contains no customer phone number, by design."""
    job = get_job_for_worker(db, worker, job_id)
    return serialize_job_detail(db, job, worker)


# -- accept / reject (spec #7) ---------------------------------------------


@router.post("/{job_id}/accept", response_model=JobDetail)
def accept_job(job_id: int, worker: CurrentWorker, db: DbSession) -> JobDetail:
    active = db.scalars(
        select(Job).where(Job.worker_id == worker.id, Job.status.in_(ACTIVE_STATUSES))
    ).first()
    if active is not None:
        raise HTTPException(
            status_code=http_status.HTTP_409_CONFLICT,
            detail=f"Finish job #{active.id} before accepting another",
        )

    # Lock the row so two workers can't both claim a broadcast job. `lazyload`
    # drops the eager join on customers — Postgres refuses FOR UPDATE across an
    # outer join.
    job = db.scalars(
        select(Job)
        .where(Job.id == job_id)
        .options(lazyload(Job.customer))
        .with_for_update(of=Job)
    ).first()

    if job is None or (job.worker_id not in (None, worker.id)):
        raise HTTPException(status_code=http_status.HTTP_404_NOT_FOUND, detail="Job not found")
    if job.status != JobStatus.REQUESTED:
        # Almost always "someone else got there first".
        raise HTTPException(
            status_code=http_status.HTTP_409_CONFLICT,
            detail="This job is no longer available",
        )

    job.worker_id = worker.id
    job.accepted_at = datetime.now(timezone.utc)
    _issue_job_otp(job, "arrival")
    _record_status(db, job, JobStatus.ACCEPTED, note="Accepted by worker")
    db.commit()
    db.refresh(job)

    # Other devices signed in as this worker should drop the request from their list.
    push_event(worker.id, WsEvent.JOB_UPDATE, {"job_id": job.id, "status": job.status.value})
    return serialize_job_detail(db, job, worker)


@router.post("/{job_id}/reject", response_model=MessageResponse)
def reject_job(
    job_id: int, payload: JobRejectRequest, worker: CurrentWorker, db: DbSession
) -> MessageResponse:
    job = get_job_for_worker(db, worker, job_id)

    if job.status != JobStatus.REQUESTED:
        raise HTTPException(
            status_code=http_status.HTTP_409_CONFLICT,
            detail="Only a pending request can be rejected",
        )

    if job.worker_id == worker.id:
        # Directed at this worker, so rejecting it closes the job.
        job.reject_reason = payload.reason
        _record_status(db, job, JobStatus.REJECTED, note=payload.reason)
        message = "Job rejected"
    else:
        # Broadcast: record the decline for this worker only, leaving the job open.
        already = db.scalars(
            select(JobRejection).where(
                JobRejection.job_id == job.id, JobRejection.worker_id == worker.id
            )
        ).first()
        if already is None:
            db.add(JobRejection(job_id=job.id, worker_id=worker.id, reason=payload.reason))
        message = "Request dismissed"

    db.commit()
    return MessageResponse(message=message)


# -- lifecycle (spec #8) ---------------------------------------------------


@router.post("/{job_id}/status", response_model=JobDetail)
def update_status(
    job_id: int, payload: JobStatusUpdate, worker: CurrentWorker, db: DbSession
) -> JobDetail:
    """Advance the job: on the way → arrived → work started → completed.

    Transitions are checked against ALLOWED_TRANSITIONS rather than trusted from the
    client, so a stale screen or a replayed tap can't skip a step.
    """
    job = db.get(Job, job_id)
    if job is None or job.worker_id != worker.id:
        raise HTTPException(status_code=http_status.HTTP_404_NOT_FOUND, detail="Job not found")

    allowed = ALLOWED_TRANSITIONS.get(job.status, set())
    if payload.status not in allowed:
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Cannot go from '{job.status.value}' to '{payload.status.value}'. "
                f"Allowed from here: {sorted(s.value for s in allowed) or 'nothing'}"
            ),
            )

    if payload.status == JobStatus.ARRIVED:
        _verify_job_otp(db, job, payload.otp, "arrival")
        job.arrival_verified_at = datetime.now(timezone.utc)
        _issue_job_otp(job, "completion")
    elif payload.status == JobStatus.COMPLETED:
        _verify_job_otp(db, job, payload.otp, "completion")
        job.completion_verified_at = datetime.now(timezone.utc)

    _record_status(db, job, payload.status)

    if payload.status == JobStatus.COMPLETED:
        job.completed_at = datetime.now(timezone.utc)
        _settle_payment(db, job, worker)

    db.commit()
    db.refresh(job)

    push_event(worker.id, WsEvent.JOB_UPDATE, {"job_id": job.id, "status": job.status.value})
    return serialize_job_detail(db, job, worker)


def _issue_job_otp(job: Job, kind: str) -> str:
    code = generate_code()
    setattr(job, f"{kind}_otp_hash", hash_password(code))
    setattr(job, f"{kind}_otp_expires_at", datetime.now(timezone.utc) + timedelta(minutes=30))
    setattr(job, f"{kind}_otp_attempts", 0)
    return code


def issue_job_otp(job: Job, kind: str) -> str:
    return _issue_job_otp(job, kind)


def _verify_job_otp(db: Session, job: Job, code: str | None, kind: str) -> None:
    if not code:
        raise HTTPException(status_code=422, detail=f"Customer {kind} OTP is required")
    expires = getattr(job, f"{kind}_otp_expires_at")
    attempts = getattr(job, f"{kind}_otp_attempts")
    stored = getattr(job, f"{kind}_otp_hash")
    if not stored or not expires or expires < datetime.now(timezone.utc):
        raise HTTPException(status_code=409, detail=f"Customer {kind} OTP has expired")
    if attempts >= 5:
        raise HTTPException(status_code=429, detail="Too many incorrect OTP attempts")
    if not verify_password(code, stored):
        setattr(job, f"{kind}_otp_attempts", attempts + 1)
        db.commit()
        raise HTTPException(status_code=422, detail=f"Incorrect customer {kind} OTP")


def _settle_payment(db: Session, job: Job, worker: Worker) -> None:
    """Create the payment record for a completed job and tell the worker (spec #10).

    Only approved extras count — a request the customer never answered is not
    money earned. The payment starts `pending`; the society settles it.
    """
    approved, _ = split_extras(job)
    base = float(job.base_amount)
    total = base + approved

    payment = db.scalars(select(Payment).where(Payment.job_id == job.id)).first()
    if payment is None:
        payment = Payment(job_id=job.id, worker_id=worker.id)
        db.add(payment)
    payment.base_amount = base
    payment.extra_amount = approved
    payment.total_amount = total
    payment.status = PaymentStatus.PENDING

    worker.completed_jobs = (worker.completed_jobs or 0) + 1

    extra_note = f" (includes ₹{approved:.0f} extra)" if approved else ""
    notify(
        db,
        worker.id,
        NotificationType.PAYMENT,
        title=f"₹{total:.0f} added to your earnings",
        body=f"{job.service_type} for {job.customer.name} is complete{extra_note}.",
        data={"job_id": job.id, "amount": total},
    )
