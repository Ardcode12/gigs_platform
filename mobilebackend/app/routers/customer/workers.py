"""Customer worker recommendations and discovery endpoint with real-time location and ETA."""

import logging
from typing import Optional

from fastapi import APIRouter, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.deps import CurrentCustomer, DbSession
from app.models import Job, Worker
from app.routers.jobs import _matches_skills
from app.schemas.customer import RecommendedWorkerOut
from app.services.geo import distance_and_eta

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/customer/workers", tags=["customer-workers"])


@router.get("/recommendations", response_model=list[RecommendedWorkerOut])
def get_recommended_workers(
    customer: CurrentCustomer,
    db: DbSession,
    service_type: Optional[str] = Query(default=None, description="e.g. Plumbing, Electrical, Carpentry"),
    lat: Optional[float] = Query(default=None, description="Customer latitude"),
    lng: Optional[float] = Query(default=None, description="Customer longitude"),
    radius_km: Optional[float] = Query(default=50.0, description="Max search radius in km"),
    sort_by: Optional[str] = Query(default="distance", description="Sort by: distance, rating, completed_jobs, all"),
    only_available: Optional[bool] = Query(default=False, description="Filter only currently online workers"),
) -> list[RecommendedWorkerOut]:
    """Return nearby verified workers matching the requested service with live distance and ETA."""
    max_radius = radius_km.default if hasattr(radius_km, "default") else radius_km
    sort_criterion = sort_by.default if hasattr(sort_by, "default") else sort_by
    online_only = only_available.default if hasattr(only_available, "default") else only_available

    query = select(Worker)
    if online_only:
        query = query.where(Worker.is_available.is_(True))

    all_workers = db.scalars(query).all()
    results: list[RecommendedWorkerOut] = []

    svc = service_type.strip().lower() if (service_type and isinstance(service_type, str)) else ""

    for worker in all_workers:
        # Check skill match if service_type is specified
        if svc:
            dummy_job = Job(service_type=service_type, work_details=None, worker_id=None)
            if not _matches_skills(dummy_job, worker):
                continue

        # Calculate live distance & ETA if coordinates are present
        dist, eta = None, None
        if (
            lat is not None and isinstance(lat, (int, float))
            and lng is not None and isinstance(lng, (int, float))
            and worker.last_lat is not None
            and worker.last_lng is not None
        ):
            dist, eta = distance_and_eta(worker.last_lat, worker.last_lng, lat, lng)
            if max_radius and dist is not None and dist > float(max_radius):
                continue

        results.append(
            RecommendedWorkerOut(
                id=worker.id,
                worker_code=worker.worker_code,
                name=worker.name,
                phone=worker.phone,
                city=worker.city,
                photo_url=worker.photo_url,
                skills=worker.skills or [],
                rating_avg=float(worker.rating_avg or 0),
                rating_count=worker.rating_count or 0,
                completed_jobs=worker.completed_jobs or 0,
                is_available=worker.is_available,
                distance_km=dist,
                eta_minutes=eta,
                last_lat=worker.last_lat,
                last_lng=worker.last_lng,
                location_updated_at=worker.location_updated_at,
            )
        )

    # Sorting logic
    sort_key = str(sort_criterion).lower()
    if sort_key == "rating":
        results.sort(key=lambda w: (w.rating_avg, w.rating_count), reverse=True)
    elif sort_key == "completed_jobs":
        results.sort(key=lambda w: w.completed_jobs, reverse=True)
    elif sort_key == "distance":
        results.sort(key=lambda w: (w.distance_km is None, w.distance_km or 9999, -w.rating_avg))
    else:
        results.sort(key=lambda w: (not w.is_available, w.distance_km is None, w.distance_km or 9999, -w.rating_avg))

    return results
