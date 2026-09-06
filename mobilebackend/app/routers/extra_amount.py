"""Extra-amount requests (spec #6).

The worker discovers on site that the work is bigger than quoted, states an amount
and a reason, and the customer approves or rejects it. The worker's side is only
ever "ask and wait": the decision arrives from outside this app, and until it is
`approved` the amount stays out of the job total (see services/serialize.py).
"""

from fastapi import APIRouter, HTTPException, status as http_status
from sqlalchemy import select

from app.core.deps import CurrentWorker, DbSession
from app.models import ExtraAmountRequest, ExtraAmountStatus, Job, JobStatus, NotificationType
from app.schemas.job import ExtraAmountCreate, ExtraAmountOut
from app.services.access import get_job_for_worker
from app.services.notify import notify, notify_customer

router = APIRouter(prefix="/api/jobs", tags=["extra-amount"])

#: Extra work is discovered on the job, so the job has to be under way.
_OPEN_FOR_EXTRAS = (
    JobStatus.ACCEPTED,
    JobStatus.ON_THE_WAY,
    JobStatus.ARRIVED,
    JobStatus.WORK_STARTED,
)


@router.get("/{job_id}/extra-amount", response_model=list[ExtraAmountOut])
def list_extra_requests(job_id: int, worker: CurrentWorker, db: DbSession) -> list[ExtraAmountOut]:
    job = get_job_for_worker(db, worker, job_id, must_own=True)
    rows = db.scalars(
        select(ExtraAmountRequest)
        .where(ExtraAmountRequest.job_id == job.id)
        .order_by(ExtraAmountRequest.created_at.desc())
    ).all()
    return [ExtraAmountOut.model_validate(r) for r in rows]


@router.post(
    "/{job_id}/extra-amount",
    response_model=ExtraAmountOut,
    status_code=http_status.HTTP_201_CREATED,
)
def create_extra_request(
    job_id: int, payload: ExtraAmountCreate, worker: CurrentWorker, db: DbSession
) -> ExtraAmountOut:
    job = get_job_for_worker(db, worker, job_id, must_own=True)

    if job.status not in _OPEN_FOR_EXTRAS:
        raise HTTPException(
            status_code=http_status.HTTP_409_CONFLICT,
            detail=(
                "Extra amount can only be requested on a job in progress"
                if job.status != JobStatus.COMPLETED
                else "This job is already complete — the amount is settled"
            ),
        )

    outstanding = db.scalars(
        select(ExtraAmountRequest).where(
            ExtraAmountRequest.job_id == job.id,
            ExtraAmountRequest.status == ExtraAmountStatus.PENDING,
        )
    ).first()
    if outstanding is not None:
        # One at a time, so the customer is never asked to judge two competing
        # amounts for the same job.
        raise HTTPException(
            status_code=http_status.HTTP_409_CONFLICT,
            detail=f"₹{float(outstanding.amount):.0f} is already awaiting the customer's approval",
        )

    request = ExtraAmountRequest(
        job_id=job.id,
        amount=payload.amount,
        reason=payload.reason.strip(),
        status=ExtraAmountStatus.PENDING,
    )
    db.add(request)
    db.commit()
    db.refresh(request)

    return ExtraAmountOut.model_validate(request)


@router.post(
    "/{job_id}/pre-accept-extra",
    response_model=ExtraAmountOut,
    status_code=http_status.HTTP_201_CREATED,
)
def create_pre_accept_extra_request(
    job_id: int, payload: ExtraAmountCreate, worker: CurrentWorker, db: DbSession
) -> ExtraAmountOut:
    """Worker proposes an extra amount BEFORE accepting a job request."""
    job = db.get(Job, job_id)
    if job is None:
        raise HTTPException(status_code=http_status.HTTP_404_NOT_FOUND, detail="Job not found")

    if job.status != JobStatus.REQUESTED:
        raise HTTPException(
            status_code=http_status.HTTP_409_CONFLICT,
            detail="Pre-accept extra price can only be proposed on a new requested job",
        )

    outstanding = db.scalars(
        select(ExtraAmountRequest).where(
            ExtraAmountRequest.job_id == job.id,
            ExtraAmountRequest.status == ExtraAmountStatus.PENDING,
        )
    ).first()
    if outstanding is not None:
        raise HTTPException(
            status_code=http_status.HTTP_409_CONFLICT,
            detail=f"An extra amount proposal of ₹{float(outstanding.amount):.0f} is already pending customer approval",
        )

    job.worker_id = worker.id

    request = ExtraAmountRequest(
        job_id=job.id,
        amount=payload.amount,
        reason=f"[Pre-Accept Quote] {payload.reason.strip()}",
        status=ExtraAmountStatus.PENDING,
    )
    db.add(request)
    db.commit()
    db.refresh(request)

    notify_customer(
        db,
        job.customer_id,
        NotificationType.EXTRA_AMOUNT,
        title=f"Pre-accept price quote from {worker.name}",
        body=f"{worker.name} proposed an extra ₹{payload.amount:.0f} for {job.service_type}: {payload.reason}",
        data={"job_id": job.id, "extra_amount_request_id": request.id},
    )

    return ExtraAmountOut.model_validate(request)
