"""Extra-amount requests (spec #6).

The worker discovers on site that the work is bigger than quoted, states an amount
and a reason, and the customer approves or rejects it. The worker's side is only
ever "ask and wait": the decision arrives from outside this app, and until it is
`approved` the amount stays out of the job total (see services/serialize.py).
"""

from fastapi import APIRouter, HTTPException, status as http_status
from sqlalchemy import select

from app.core.deps import CurrentWorker, DbSession
from app.models import ExtraAmountRequest, ExtraAmountStatus, JobStatus
from app.schemas.job import ExtraAmountCreate, ExtraAmountOut
from app.services.access import get_job_for_worker

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
