"""Customer extra amount decision endpoints."""

import logging
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, status as http_status
from sqlalchemy import select

from app.core.deps import CurrentCustomer, DbSession
from app.models import ExtraAmountRequest, ExtraAmountStatus, Job, NotificationType
from app.schemas.customer import CustomerExtraAmountDecision
from app.schemas.job import ExtraAmountOut
from app.services.notify import notify, push_customer_event
from app.services.serialize import serialize_extra_request

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/customer/extra-amount", tags=["customer-extra-amount"])


@router.get("/job/{job_id}", response_model=list[ExtraAmountOut])
def list_extra_amount_requests(
    job_id: int, customer: CurrentCustomer, db: DbSession
) -> list[ExtraAmountOut]:
    job = db.get(Job, job_id)
    if job is None or job.customer_id != customer.id:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND, detail="Job not found"
        )

    requests = db.scalars(
        select(ExtraAmountRequest)
        .where(ExtraAmountRequest.job_id == job.id)
        .order_by(ExtraAmountRequest.id.desc())
    ).all()
    return [serialize_extra_request(r) for r in requests]


@router.post("/{request_id}/decide", response_model=ExtraAmountOut)
def decide_extra_amount(
    request_id: int,
    payload: CustomerExtraAmountDecision,
    customer: CurrentCustomer,
    db: DbSession,
) -> ExtraAmountOut:
    """Approve or decline a worker's request for an extra amount."""
    request = db.get(ExtraAmountRequest, request_id)
    if request is None:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail="Extra amount request not found",
        )

    job = request.job
    if job is None or job.customer_id != customer.id:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail="Extra amount request not found",
        )

    if request.status != ExtraAmountStatus.PENDING:
        raise HTTPException(
            status_code=http_status.HTTP_409_CONFLICT,
            detail=f"Request is already {request.status.value}",
        )

    request.status = (
        ExtraAmountStatus.APPROVED if payload.approve else ExtraAmountStatus.REJECTED
    )
    request.decided_at = datetime.now(timezone.utc)

    # Notify worker of the decision
    if job.worker_id is not None:
        amount = float(request.amount)
        notify(
            db,
            job.worker_id,
            NotificationType.EXTRA_AMOUNT,
            title=(
                f"Extra ₹{amount:.0f} approved" if payload.approve else f"Extra ₹{amount:.0f} declined"
            ),
            body=(
                f"{customer.name} approved your extra charge request for {job.service_type}."
                if payload.approve
                else f"{customer.name} declined your extra charge request for {job.service_type}."
            ),
            data={
                "job_id": job.id,
                "extra_amount_request_id": request.id,
                "status": request.status.value,
                "amount": amount,
            },
        )

    db.commit()
    db.refresh(request)

    # Broadcast event back to customer UI for live screen refresh
    push_customer_event(
        customer.id,
        "extra_amount_decision",
        {
            "job_id": job.id,
            "request_id": request.id,
            "status": request.status.value,
        },
    )

    return serialize_extra_request(request)
