"""Job schemas.

`CustomerOut` deliberately has no phone field — spec #5 requires numbers stay
hidden, and the surest way to honour that is for the response model to have
nowhere to put one.
"""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import ExtraAmountStatus, JobStatus


class CustomerOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    rating_avg: float
    rating_count: int
    photo_url: str | None


class JobServiceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    price: float


class LocationOut(BaseModel):
    address: str
    landmark: str | None
    lat: float
    lng: float
    #: Null until the worker has shared their position at least once.
    distance_km: float | None = None
    eta_min: int | None = None


class StatusEventOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    status: JobStatus
    at: datetime
    note: str | None


class ExtraAmountOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    amount: float
    reason: str
    status: ExtraAmountStatus
    created_at: datetime
    decided_at: datetime | None


class AmountsOut(BaseModel):
    base_amount: float
    #: Approved extras only — a pending request must not inflate the total.
    extra_amount: float
    total_amount: float
    pending_extra_amount: float = 0


class JobListItem(BaseModel):
    """Row shape for the requests list, active job card, and history."""

    id: int
    service_type: str
    service_icon: str
    status: JobStatus
    customer_name: str
    address: str
    landmark: str | None = None
    lat: float | None = None
    lng: float | None = None
    distance_km: float | None
    eta_min: int | None
    total_amount: float
    requested_at: datetime
    accepted_at: datetime | None
    completed_at: datetime | None
    #: Index into JOB_PROGRESS_STEPS, or None for a job not on the happy path.
    current_step: int | None


class JobDetail(BaseModel):
    """Everything the job-detail and current-job screens render (spec #9)."""

    id: int
    service_type: str
    service_icon: str
    work_details: str | None
    status: JobStatus
    current_step: int | None
    customer: CustomerOut
    location: LocationOut
    services: list[JobServiceOut]
    amounts: AmountsOut
    extra_requests: list[ExtraAmountOut]
    status_events: list[StatusEventOut]
    requested_at: datetime
    accepted_at: datetime | None
    completed_at: datetime | None
    unread_messages: int = 0


class JobRejectRequest(BaseModel):
    reason: str | None = Field(default=None, max_length=300)


class JobStatusUpdate(BaseModel):
    status: JobStatus
    otp: str | None = Field(default=None, min_length=4, max_length=8)
    otp: str | None = Field(default=None, min_length=4, max_length=8)


class ExtraAmountCreate(BaseModel):
    amount: float = Field(gt=0, le=100_000)
    reason: str = Field(min_length=3, max_length=500)
