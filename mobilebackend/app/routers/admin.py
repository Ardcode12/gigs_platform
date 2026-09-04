"""Society-side routes — how a worker account comes into existence.

Workers never self-register (spec #1): the society creates the account and sets
the first password. There is no society UI in this project, so these are API-only
and guarded by a shared `X-Admin-Key` header rather than a second account system.
"""

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import func, or_, select

from app.core.deps import AdminGuard, DbSession
from app.core.security import hash_password
from app.models import Society, Worker
from app.schemas.auth import MessageResponse
from app.schemas.worker import AdminResetPasswordRequest, WorkerCreate, WorkerOut
from app.services.serialize import serialize_worker

router = APIRouter(prefix="/api/admin", tags=["admin"], dependencies=[AdminGuard])


@router.post("/workers", response_model=WorkerOut, status_code=status.HTTP_201_CREATED)
def create_worker(payload: WorkerCreate, db: DbSession) -> WorkerOut:
    if db.get(Society, payload.society_id) is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Society {payload.society_id} does not exist",
        )

    clash = db.scalars(
        select(Worker).where(
            or_(
                func.lower(Worker.worker_code) == payload.worker_code.lower(),
                Worker.phone == payload.phone,
            )
        )
    ).first()
    if clash is not None:
        # Named explicitly: this is the society's own admin surface, so telling
        # them which field collided is help, not disclosure.
        field = (
            "worker code"
            if clash.worker_code.lower() == payload.worker_code.lower()
            else "phone number"
        )
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"A worker with that {field} already exists",
        )

    worker = Worker(
        society_id=payload.society_id,
        worker_code=payload.worker_code,
        name=payload.name,
        phone=payload.phone,
        password_hash=hash_password(payload.initial_password),
        # The society knows this password, so the worker must replace it.
        must_change_password=True,
        city=payload.city,
        skills=payload.skills,
        aadhaar_masked=payload.aadhaar_masked,
    )
    db.add(worker)
    db.commit()
    db.refresh(worker)

    return serialize_worker(worker)


@router.get("/workers", response_model=list[WorkerOut])
def list_workers(db: DbSession, society_id: int | None = None) -> list[WorkerOut]:
    stmt = select(Worker).order_by(Worker.worker_code)
    if society_id is not None:
        stmt = stmt.where(Worker.society_id == society_id)
    return [serialize_worker(w) for w in db.scalars(stmt).all()]


@router.post("/workers/{worker_id}/reset-password", response_model=MessageResponse)
def admin_reset_password(
    worker_id: int, payload: AdminResetPasswordRequest, db: DbSession
) -> MessageResponse:
    """For the worker who has lost both their password and their phone.

    The self-service path is /api/auth/forgot-password; this exists so a society
    can unblock someone the reset code can't reach.
    """
    worker = db.get(Worker, worker_id)
    if worker is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Worker not found")

    worker.password_hash = hash_password(payload.new_password)
    worker.must_change_password = payload.require_change
    db.commit()

    return MessageResponse(message=f"Password reset for {worker.worker_code}")
