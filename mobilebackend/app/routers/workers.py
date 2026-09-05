"""Worker profile, availability (spec #2) and position reporting.

The worker is always resolved from the bearer token, so no route carries a worker
id — a worker can only ever read or change their own record.
"""

from datetime import datetime, timezone

from fastapi import APIRouter

from app.core.deps import CurrentWorker, DbSession
from app.schemas.worker import (
    AvailabilityOut,
    AvailabilityUpdate,
    LocationOut,
    LocationUpdate,
    WorkerOut,
    WorkerUpdate,
)
from app.services.serialize import serialize_worker

router = APIRouter(prefix="/api/worker", tags=["worker"])


@router.get("/me", response_model=WorkerOut)
def get_me(worker: CurrentWorker) -> WorkerOut:
    return serialize_worker(worker)


@router.patch("/me", response_model=WorkerOut)
def update_me(payload: WorkerUpdate, worker: CurrentWorker, db: DbSession) -> WorkerOut:
    # exclude_unset so an omitted field means "leave it alone", not "set to null".
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(worker, field, value)
    db.commit()
    db.refresh(worker)
    return serialize_worker(worker)


@router.put("/availability", response_model=AvailabilityOut)
def set_availability(
    payload: AvailabilityUpdate, worker: CurrentWorker, db: DbSession
) -> AvailabilityOut:
    """The 🟢/🔴 toggle on the home screen.

    Only available workers appear in the broadcast for new job requests, so this
    flag is what actually stops work arriving — not just a label.
    """
    worker.is_available = payload.is_available
    db.commit()

    return AvailabilityOut(
        is_available=worker.is_available,
        message=(
            "You are online. New job requests will come through."
            if worker.is_available
            else "You are offline. You will not receive new job requests."
        ),
    )


@router.put("/location", response_model=LocationOut)
def update_location(payload: LocationUpdate, worker: CurrentWorker, db: DbSession) -> LocationOut:
    """Last known position, used to compute distance and ETA on every job payload.

    Stored as a single latest value rather than a track — the app only ever shows
    "how far is this job from me right now", and keeping a history of a worker's
    movements would be more data than the feature needs.
    """
    worker.last_lat = payload.lat
    worker.last_lng = payload.lng
    worker.location_updated_at = datetime.now(timezone.utc)
    db.commit()

    return LocationOut(
        lat=payload.lat,
        lng=payload.lng,
        updated_at=worker.location_updated_at,
    )
