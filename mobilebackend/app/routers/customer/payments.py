"""Customer payment and invoice endpoints."""

import logging
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, status as http_status
from sqlalchemy import select

from app.core.deps import CurrentCustomer, DbSession
from app.models import Job, NotificationType, Payment, PaymentStatus
from app.schemas.auth import MessageResponse
from app.schemas.customer import CustomerPaymentOut
from app.services.notify import notify, notify_customer, push_customer_event

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/customer/payments", tags=["customer-payments"])


@router.get("/job/{job_id}", response_model=CustomerPaymentOut)
def get_job_payment(
    job_id: int, customer: CurrentCustomer, db: DbSession
) -> CustomerPaymentOut:
    """Retrieve payment invoice for a job."""
    job = db.get(Job, job_id)
    if job is None or job.customer_id != customer.id:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND, detail="Job not found"
        )

    payment = db.scalars(select(Payment).where(Payment.job_id == job.id)).first()
    if payment is None:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail="Payment record not generated yet (job must be completed)",
        )

    return CustomerPaymentOut.model_validate(payment)


@router.post("/{payment_id}/pay", response_model=MessageResponse)
def pay_invoice(payment_id: int, customer: CurrentCustomer, db: DbSession) -> MessageResponse:
    """Settle payment for a completed job."""
    payment = db.get(Payment, payment_id)
    if payment is None:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND, detail="Payment not found"
        )

    job = payment.job
    if job is None or job.customer_id != customer.id:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND, detail="Payment not found"
        )

    if payment.status == PaymentStatus.PAID:
        raise HTTPException(
            status_code=http_status.HTTP_409_CONFLICT, detail="Payment already settled"
        )

    payment.status = PaymentStatus.PAID
    payment.paid_at = datetime.now(timezone.utc)

    # Notify worker of settled payment
    if payment.worker_id is not None:
        notify(
            db,
            payment.worker_id,
            NotificationType.PAYMENT,
            title=f"₹{float(payment.total_amount):.0f} paid by customer",
            body=f"Payment for {job.service_type} has been settled by {customer.name}.",
            data={"job_id": payment.job_id, "payment_id": payment.id, "status": "paid"},
        )

    # Notify customer of payment receipt
    notify_customer(
        db,
        customer.id,
        NotificationType.PAYMENT,
        title=f"Payment of ₹{float(payment.total_amount):.0f} successful",
        body=f"Payment for {job.service_type} has been successfully settled.",
        data={"job_id": payment.job_id, "payment_id": payment.id, "status": "paid"},
    )

    db.commit()
    return MessageResponse(message="Payment successfully processed")
