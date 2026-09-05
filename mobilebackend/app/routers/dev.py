"""Test harness — mounted only when DEV_MODE=true.

The customer app is out of scope for this project, but four of the twelve worker
features only come alive when a customer *does* something: sends a chat message,
approves an extra amount, leaves a rating, or pays. These routes stand in for that
half of the conversation so the worker app can be walked end to end.

This is a harness, not customer functionality: it has no authentication of its own,
it is not mounted when DEV_MODE is false, and deleting this file removes it
entirely. Nothing else imports it.
"""

import logging
from datetime import datetime, timezone
from datetime import timedelta

from fastapi import APIRouter, HTTPException, status as http_status
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.deps import DbSession
from app.models import (
    CallRequest,
    CallRequestStatus,
    ChatMessage,
    Customer,
    ExtraAmountRequest,
    ExtraAmountStatus,
    Job,
    JobRejection,
    JobService,
    JobStatus,
    JobStatusEvent,
    JobReport,
    MessageSender,
    NotificationType,
    Payment,
    PaymentMethod,
    PaymentStatus,
    Rating,
    Worker,
)
from app.schemas.auth import MessageResponse
from app.schemas.chat import ChatMessageOut
from app.schemas.job import ExtraAmountOut
from app.schemas.misc import OtpRequest
from app.services.notify import notify
from app.core.security import hash_password, verify_password
from app.services.otp import generate_code
from app.routers.jobs import issue_job_otp

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/dev", tags=["dev-harness"])


# -- request bodies --------------------------------------------------------
class DevServiceLine(BaseModel):
    name: str
    price: float = Field(ge=0)


class DevJobCreate(BaseModel):
    service_type: str = "Plumbing"
    service_icon: str = "water-pump"
    work_details: str | None = "Kitchen sink is leaking from the base of the tap."
    address: str = "Flat 402, Sunrise Residency, Sector 21"
    landmark: str | None = "Opposite the community hall"
    lat: float = 28.5355
    lng: float = 77.3910
    base_amount: float = 450
    services: list[DevServiceLine] = Field(default_factory=list)
    customer_id: int | None = None
    #: Leave null to broadcast to every available worker whose skills match.
    worker_id: int | None = None


class DevDecision(BaseModel):
    approve: bool


class DevMessage(BaseModel):
    text: str = Field(min_length=1, max_length=2000)


class DevRating(BaseModel):
    stars: int = Field(ge=1, le=5)
    feedback: str | None = Field(default=None, max_length=2000)


class DevReport(BaseModel):
    reporter_type: str = Field(pattern="^(worker|customer)$")
    reporter_id: int
    category: str = Field(min_length=2, max_length=100)
    description: str | None = Field(default=None, max_length=2000)


# -- what the customer side would do ---------------------------------------
@router.get("/customers")
def list_customers(db: DbSession) -> list[dict]:
    """Ids to pass to /dev/jobs. Phone numbers are omitted here too."""
    rows = db.scalars(select(Customer).order_by(Customer.id)).all()
    return [{"id": c.id, "name": c.name, "city": c.city} for c in rows]


@router.get("/workers")
def list_workers(db: DbSession) -> list[dict]:
    rows = db.scalars(select(Worker).order_by(Worker.id)).all()
    return [
        {
            "id": w.id,
            "worker_code": w.worker_code,
            "name": w.name,
            "phone": w.phone,
            "is_available": w.is_available,
            "skills": w.skills,
        }
        for w in rows
    ]


@router.post("/jobs/ramesh", status_code=http_status.HTTP_201_CREATED)
def create_ramesh_test_request(db: DbSession) -> dict:
    """Create one directed test request for Ramesh Kumar (WM1042).

    This is intentionally a worker-test harness route. It does not add customer
    functionality; it only supplies the request that the worker app needs to test
    its pending, accept, and reject flows.
    """
    ramesh = db.scalars(select(Worker).where(Worker.worker_code == "WM1042")).first()
    if ramesh is None:
        raise HTTPException(
            status_code=http_status.HTTP_409_CONFLICT,
            detail="Ramesh Kumar (WM1042) was not found — run `python seed.py` first",
        )

    return create_job_request(
        DevJobCreate(
            worker_id=ramesh.id,
            service_type="Plumbing",
            service_icon="water-pump",
            work_details=(
                "Kitchen sink is leaking from the base of the tap. "
                "Please bring a replacement washer."
            ),
            address="Flat 402, Sunrise Residency, Sector 62",
            landmark="Opposite the community hall",
            lat=28.6350,
            lng=77.3650,
            base_amount=450,
            services=[
                DevServiceLine(name="Tap washer replacement", price=250),
                DevServiceLine(name="Leak inspection", price=200),
            ],
        ),
        db,
    )


@router.post("/jobs", status_code=http_status.HTTP_201_CREATED)
def create_job_request(payload: DevJobCreate, db: DbSession) -> dict:
    """Raise a job request, as a customer booking would (spec #3).

    Returns which workers were alerted, which is the thing a tester actually needs
    to know — if the list is empty, nobody is available or nobody's skills matched.
    """
    if payload.customer_id is not None:
        customer = db.get(Customer, payload.customer_id)
        if customer is None:
            raise HTTPException(status_code=404, detail="Customer not found")
    else:
        customer = db.scalars(select(Customer).order_by(Customer.id)).first()
        if customer is None:
            raise HTTPException(
                status_code=http_status.HTTP_409_CONFLICT,
                detail="No customers exist — run `python seed.py` first",
            )

    if payload.worker_id is not None and db.get(Worker, payload.worker_id) is None:
        raise HTTPException(status_code=404, detail="Worker not found")

    job = Job(
        customer_id=customer.id,
        worker_id=payload.worker_id,
        service_type=payload.service_type,
        service_icon=payload.service_icon,
        work_details=payload.work_details,
        address=payload.address,
        landmark=payload.landmark,
        lat=payload.lat,
        lng=payload.lng,
        base_amount=payload.base_amount,
        status=JobStatus.REQUESTED,
    )
    db.add(job)
    db.flush()

    lines = payload.services or [
        DevServiceLine(name=payload.service_type, price=payload.base_amount)
    ]
    for line in lines:
        db.add(JobService(job_id=job.id, name=line.name, price=line.price))

    db.add(
        JobStatusEvent(job_id=job.id, status=JobStatus.REQUESTED, note="Customer raised request")
    )

    alerted = _workers_to_alert(db, job)
    for worker in alerted:
        notify(
            db,
            worker.id,
            NotificationType.NEW_JOB,
            title=f"New {job.service_type} request",
            body=f"{customer.name} · {job.address}",
            data={"job_id": job.id, "amount": float(job.base_amount)},
        )

    db.commit()

    return {
        "job_id": job.id,
        "status": JobStatus.REQUESTED.value,
        "customer": customer.name,
        "alerted_workers": [{"id": w.id, "code": w.worker_code} for w in alerted],
    }


@router.post("/jobs/{job_id}/verification-codes")
def issue_verification_code(job_id: int, db: DbSession) -> dict:
    """Development-only customer simulator for the next customer OTP."""
    job = db.get(Job, job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.status == JobStatus.ON_THE_WAY:
        kind = "arrival"
    elif job.status == JobStatus.WORK_STARTED:
        kind = "completion"
    else:
        raise HTTPException(status_code=409, detail="No arrival or completion OTP is due")
    code = issue_job_otp(job, kind)
    db.commit()
    return {"job_id": job.id, "kind": kind, "otp": code, "expires_in_minutes": 30}


@router.post("/jobs/{job_id}/cash-payment")
def start_cash_payment(job_id: int, db: DbSession) -> dict:
    """Development-only customer action that starts cash confirmation."""
    job = db.get(Job, job_id)
    if job is None or job.status != JobStatus.COMPLETED or job.worker_id is None:
        raise HTTPException(status_code=409, detail="Cash payment is available after completion")
    payment = db.scalars(select(Payment).where(Payment.job_id == job.id)).first()
    if payment is None:
        raise HTTPException(status_code=404, detail="Payment record not found")
    code = generate_code()
    payment.payment_method = PaymentMethod.CASH
    payment.cash_otp_hash = hash_password(code)
    payment.cash_otp_expires_at = datetime.now(timezone.utc) + timedelta(minutes=30)
    payment.cash_otp_attempts = 0
    db.commit()
    return {"payment_id": payment.id, "job_id": job.id, "otp": code, "amount": float(payment.total_amount)}


@router.post("/jobs/{job_id}/cash-payment/confirm")
def confirm_cash_payment(job_id: int, payload: OtpRequest, db: DbSession) -> dict:
    """Development-only customer confirmation after cash changes hands."""
    payment = db.scalars(select(Payment).where(Payment.job_id == job_id)).first()
    if payment is None or payment.payment_method != PaymentMethod.CASH:
        raise HTTPException(status_code=404, detail="Cash payment not found")
    if not payment.cash_otp_expires_at or payment.cash_otp_expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=409, detail="Cash confirmation OTP has expired")
    if payment.cash_otp_attempts >= 5 or not verify_password(payload.otp, payment.cash_otp_hash):
        payment.cash_otp_attempts += 1
        db.commit()
        raise HTTPException(status_code=422, detail="Incorrect cash confirmation OTP")
    payment.status = PaymentStatus.PAID
    payment.paid_at = datetime.now(timezone.utc)
    payment.cash_verified_at = payment.paid_at
    payment.cash_otp_hash = None
    db.commit()
    return {"job_id": job_id, "payment_id": payment.id, "status": "paid", "payment_method": "cash"}


@router.post("/jobs/{job_id}/report", status_code=http_status.HTTP_201_CREATED)
def create_job_report(job_id: int, payload: DevReport, db: DbSession) -> dict:
    """Development-only report endpoint for either participant."""
    if db.get(Job, job_id) is None:
        raise HTTPException(status_code=404, detail="Job not found")
    report = JobReport(
        job_id=job_id,
        reporter_type=payload.reporter_type,
        reporter_id=payload.reporter_id,
        category=payload.category,
        description=payload.description,
    )
    db.add(report)
    db.commit()
    return {"report_id": report.id, "job_id": job_id, "status": report.status}


def _workers_to_alert(db: Session, job: Job) -> list[Worker]:
    """Directed job → that worker. Broadcast → every available, skill-matching worker."""
    if job.worker_id is not None:
        worker = db.get(Worker, job.worker_id)
        return [worker] if worker else []

    service = job.service_type.lower()
    rejected = set(
        db.scalars(select(JobRejection.worker_id).where(JobRejection.job_id == job.id)).all()
    )
    available = db.scalars(select(Worker).where(Worker.is_available.is_(True))).all()
    return [
        w
        for w in available
        if w.id not in rejected
        and (not w.skills or any(service in s.lower() or s.lower() in service for s in w.skills))
    ]


@router.post("/extra-amount/{request_id}/decide", response_model=ExtraAmountOut)
def decide_extra_amount(
    request_id: int, payload: DevDecision, db: DbSession
) -> ExtraAmountOut:
    """Approve or reject a worker's extra-amount request (spec #6)."""
    request = db.get(ExtraAmountRequest, request_id)
    if request is None:
        raise HTTPException(status_code=404, detail="Extra-amount request not found")
    if request.status != ExtraAmountStatus.PENDING:
        raise HTTPException(
            status_code=http_status.HTTP_409_CONFLICT,
            detail=f"Already {request.status.value}",
        )

    request.status = (
        ExtraAmountStatus.APPROVED if payload.approve else ExtraAmountStatus.REJECTED
    )
    request.decided_at = datetime.now(timezone.utc)

    job = request.job
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
                f"The customer approved your request for {job.service_type}."
                if payload.approve
                else f"The customer declined your request for {job.service_type}."
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
    return ExtraAmountOut.model_validate(request)


@router.post(
    "/jobs/{job_id}/customer-message",
    response_model=ChatMessageOut,
    status_code=http_status.HTTP_201_CREATED,
)
def customer_message(job_id: int, payload: DevMessage, db: DbSession) -> ChatMessageOut:
    """A message from the customer, so the worker's chat has two sides (spec #5)."""
    job = db.get(Job, job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")

    message = ChatMessage(job_id=job.id, sender=MessageSender.CUSTOMER, text=payload.text)
    db.add(message)
    db.flush()

    if job.worker_id is not None:
        notify(
            db,
            job.worker_id,
            NotificationType.CHAT,
            title=f"Message from {job.customer.name}",
            body=payload.text[:120],
            data={"job_id": job.id, "message_id": message.id},
        )

    db.commit()
    db.refresh(message)
    return ChatMessageOut.model_validate(message)


@router.post("/jobs/{job_id}/call-request/decide", response_model=MessageResponse)
def decide_call_request(job_id: int, payload: DevDecision, db: DbSession) -> MessageResponse:
    """Close out the worker's pending "please call me" request (spec #5)."""
    request = db.scalars(
        select(CallRequest)
        .where(
            CallRequest.job_id == job_id,
            CallRequest.status == CallRequestStatus.PENDING,
        )
        .order_by(CallRequest.created_at.desc())
    ).first()
    if request is None:
        raise HTTPException(status_code=404, detail="No pending call request for this job")

    request.status = (
        CallRequestStatus.COMPLETED if payload.approve else CallRequestStatus.DECLINED
    )
    db.commit()
    return MessageResponse(message=f"Call request {request.status.value}")


@router.post("/jobs/{job_id}/rating", response_model=MessageResponse)
def leave_rating(job_id: int, payload: DevRating, db: DbSession) -> MessageResponse:
    """Rate a completed job, and refresh the worker's aggregate (spec #11)."""
    job = db.get(Job, job_id)
    if job is None or job.worker_id is None:
        raise HTTPException(status_code=404, detail="Job not found or unassigned")
    if job.status != JobStatus.COMPLETED:
        raise HTTPException(
            status_code=http_status.HTTP_409_CONFLICT,
            detail="Only a completed job can be rated",
        )
    if db.scalars(select(Rating).where(Rating.job_id == job.id)).first() is not None:
        raise HTTPException(
            status_code=http_status.HTTP_409_CONFLICT, detail="This job is already rated"
        )

    db.add(
        Rating(
            job_id=job.id,
            worker_id=job.worker_id,
            customer_id=job.customer_id,
            stars=payload.stars,
            feedback=payload.feedback,
        )
    )
    db.flush()
    recalculate_worker_rating(db, job.worker_id)

    notify(
        db,
        job.worker_id,
        NotificationType.JOB_UPDATE,
        title=f"{payload.stars}★ from {job.customer.name}",
        body=payload.feedback or f"Rated your {job.service_type} work.",
        data={"job_id": job.id, "stars": payload.stars},
    )

    db.commit()
    return MessageResponse(message="Rating recorded")


@router.post("/payments/{payment_id}/pay", response_model=MessageResponse)
def mark_paid(payment_id: int, db: DbSession) -> MessageResponse:
    """Settle a pending payment (spec #10, #12)."""
    payment = db.get(Payment, payment_id)
    if payment is None:
        raise HTTPException(status_code=404, detail="Payment not found")
    if payment.status == PaymentStatus.PAID:
        raise HTTPException(
            status_code=http_status.HTTP_409_CONFLICT, detail="Already paid"
        )

    payment.status = PaymentStatus.PAID
    payment.paid_at = datetime.now(timezone.utc)

    notify(
        db,
        payment.worker_id,
        NotificationType.PAYMENT,
        title=f"₹{float(payment.total_amount):.0f} paid",
        body="The payment for your completed job has been settled.",
        data={"job_id": payment.job_id, "payment_id": payment.id, "status": "paid"},
    )

    db.commit()
    return MessageResponse(message="Payment marked paid")


def recalculate_worker_rating(db: Session, worker_id: int) -> None:
    """Refresh the denormalised rating columns from the ratings table."""
    average, count = db.execute(
        select(func.avg(Rating.stars), func.count(Rating.id)).where(
            Rating.worker_id == worker_id
        )
    ).one()
    worker = db.get(Worker, worker_id)
    if worker is not None:
        worker.rating_avg = round(float(average), 2) if average is not None else 0
        worker.rating_count = count or 0
