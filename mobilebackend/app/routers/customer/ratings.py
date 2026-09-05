"""Customer ratings and review endpoints."""

import logging

from fastapi import APIRouter, HTTPException, status as http_status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.deps import CurrentCustomer, DbSession
from app.models import Job, JobStatus, NotificationType, Rating, Worker
from app.schemas.auth import MessageResponse
from app.schemas.customer import CustomerRatingCreate
from app.services.notify import notify

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/customer/ratings", tags=["customer-ratings"])


def recalculate_worker_rating(db: Session, worker_id: int) -> None:
    """Refresh the denormalized rating columns on the workers table."""
    average, count = db.execute(
        select(func.avg(Rating.stars), func.count(Rating.id)).where(
            Rating.worker_id == worker_id
        )
    ).one()
    worker = db.get(Worker, worker_id)
    if worker is not None:
        worker.rating_avg = round(float(average), 2) if average is not None else 0
        worker.rating_count = count or 0


@router.post("/job/{job_id}", response_model=MessageResponse)
def rate_worker(
    job_id: int,
    payload: CustomerRatingCreate,
    customer: CurrentCustomer,
    db: DbSession,
) -> MessageResponse:
    """Submit a star rating (1-5) and feedback for a completed job."""
    job = db.get(Job, job_id)
    if job is None or job.customer_id != customer.id:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND, detail="Job not found"
        )
    if job.worker_id is None:
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail="Job was never assigned to a worker",
        )
    if job.status != JobStatus.COMPLETED:
        raise HTTPException(
            status_code=http_status.HTTP_409_CONFLICT,
            detail="Only a completed job can be rated",
        )

    existing = db.scalars(select(Rating).where(Rating.job_id == job.id)).first()
    if existing is not None:
        raise HTTPException(
            status_code=http_status.HTTP_409_CONFLICT,
            detail="This job has already been rated",
        )

    rating = Rating(
        job_id=job.id,
        worker_id=job.worker_id,
        customer_id=customer.id,
        stars=payload.stars,
        feedback=payload.feedback,
    )
    db.add(rating)
    db.flush()

    recalculate_worker_rating(db, job.worker_id)

    # Notify worker of rating
    notify(
        db,
        job.worker_id,
        NotificationType.JOB_UPDATE,
        title=f"{payload.stars}★ review from {customer.name}",
        body=payload.feedback or f"Rated your {job.service_type} work.",
        data={"job_id": job.id, "stars": payload.stars},
    )

    db.commit()
    return MessageResponse(message="Rating and feedback submitted successfully")
