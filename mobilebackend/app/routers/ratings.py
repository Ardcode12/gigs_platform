"""Ratings and written feedback from customers (spec #11).

The overall figure is computed from the ratings table rather than read off
`workers.rating_avg`, so the number on screen can't drift away from the reviews
listed underneath it.
"""

from fastapi import APIRouter, Query
from sqlalchemy import func, select

from app.core.deps import CurrentWorker, DbSession
from app.models import Rating
from app.schemas.misc import RatingOut, RatingSummary

router = APIRouter(prefix="/api/ratings", tags=["ratings"])


@router.get("", response_model=list[RatingOut])
def list_ratings(
    worker: CurrentWorker,
    db: DbSession,
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
) -> list[RatingOut]:
    rows = db.scalars(
        select(Rating)
        .where(Rating.worker_id == worker.id)
        .order_by(Rating.created_at.desc())
        .limit(limit)
        .offset(offset)
    ).all()

    return [
        RatingOut(
            id=r.id,
            job_id=r.job_id,
            stars=r.stars,
            feedback=r.feedback,
            created_at=r.created_at,
            customer_name=r.customer.name if r.customer else "Customer",
            service_type=r.job.service_type if r.job else "",
        )
        for r in rows
    ]


@router.get("/summary", response_model=RatingSummary)
def ratings_summary(worker: CurrentWorker, db: DbSession) -> RatingSummary:
    average, count = db.execute(
        select(func.avg(Rating.stars), func.count(Rating.id)).where(
            Rating.worker_id == worker.id
        )
    ).one()

    counts = dict(
        db.execute(
            select(Rating.stars, func.count(Rating.id))
            .where(Rating.worker_id == worker.id)
            .group_by(Rating.stars)
        ).all()
    )

    return RatingSummary(
        overall=round(float(average), 2) if average is not None else 0.0,
        count=count or 0,
        # Always all five keys, so the bar chart doesn't have to guess at gaps.
        distribution={str(star): int(counts.get(star, 0)) for star in range(1, 6)},
    )
