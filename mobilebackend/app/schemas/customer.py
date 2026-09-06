"""Pydantic schemas for the Customer API."""

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field

from app.models.enums import ExtraAmountStatus, JobStatus, PaymentStatus
from app.schemas.job import AmountsOut, ExtraAmountOut, JobServiceOut, StatusEventOut


class SavedAddressItem(BaseModel):
    id: str
    title: str = Field(description="Home, Work, Other, etc.")
    address: str
    landmark: str | None = None
    lat: float
    lng: float


class SaveAddressRequest(BaseModel):
    title: str
    address: str
    landmark: str | None = None
    lat: float
    lng: float


class CustomerOut(BaseModel):
    id: int
    name: str
    phone: str
    email: str | None = None
    city: str | None = None
    photo_url: str | None = None
    rating_avg: float
    rating_count: int
    saved_addresses: list[SavedAddressItem] = Field(default_factory=list)
    created_at: datetime

    class Config:
        from_attributes = True


class SendSignupOtpRequest(BaseModel):
    phone: str = Field(min_length=10, max_length=20)
    email: str | None = Field(default=None, max_length=255)


class SendSignupOtpResponse(BaseModel):
    message: str
    masked_phone: str


class CustomerSignupRequest(BaseModel):
    name: str = Field(min_length=2, max_length=150)
    phone: str = Field(min_length=10, max_length=20)
    email: str | None = Field(default=None, max_length=255)
    password: str = Field(min_length=6, max_length=100)
    city: str | None = None
    otp: str = Field(min_length=4, max_length=10)


class CustomerLoginRequest(BaseModel):
    identifier: str = Field(description="Phone number or email")
    password: str = Field(min_length=1)


class CustomerLoginResponse(BaseModel):
    access_token: str
    refresh_token: str
    customer: CustomerOut


class CustomerProfileUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=150)
    email: str | None = Field(default=None, max_length=255)
    city: str | None = None
    photo_url: str | None = None


# -- Job schemas --
class CustomerServiceLine(BaseModel):
    name: str
    price: float = Field(ge=0)


class CustomerJobCreate(BaseModel):
    service_type: str = Field(description="e.g. Plumbing, Electrical, Cleaning")
    service_icon: str = Field(default="wrench", description="Material Community Icon name")
    work_details: str | None = None
    address: str
    landmark: str | None = None
    lat: float
    lng: float
    base_amount: float = Field(ge=0)
    services: list[CustomerServiceLine] = Field(default_factory=list)
    preferred_worker_id: int | None = Field(
        default=None, description="Direct request worker ID or None for broadcast"
    )


class AssignedWorkerOut(BaseModel):
    id: int
    name: str
    phone: str
    photo_url: str | None = None
    rating_avg: float
    rating_count: int
    skills: list[str] = Field(default_factory=list)
    completed_jobs: int = 0
    last_lat: float | None = None
    last_lng: float | None = None
    distance_km: float | None = None
    eta_minutes: int | None = None
    location_updated_at: datetime | None = None

    class Config:
        from_attributes = True


class RecommendedWorkerOut(BaseModel):
    id: int
    worker_code: str
    name: str
    phone: str
    city: str | None = None
    photo_url: str | None = None
    skills: list[str] = Field(default_factory=list)
    rating_avg: float
    rating_count: int
    completed_jobs: int = 0
    is_available: bool = True
    distance_km: float | None = None
    eta_minutes: int | None = None
    last_lat: float | None = None
    last_lng: float | None = None
    location_updated_at: datetime | None = None

    class Config:
        from_attributes = True


class WorkerLocationOut(BaseModel):
    worker_id: int | None = None
    name: str | None = None
    lat: float | None = None
    lng: float | None = None
    distance_km: float | None = None
    eta_minutes: int | None = None
    updated_at: datetime | None = None


class CustomerJobListItem(BaseModel):
    id: int
    service_type: str
    service_icon: str
    status: JobStatus
    worker: AssignedWorkerOut | None = None
    address: str
    landmark: str | None = None
    lat: float | None = None
    lng: float | None = None
    total_amount: float
    requested_at: datetime
    accepted_at: datetime | None = None
    completed_at: datetime | None = None
    current_step: int | None = None


class CustomerJobDetail(BaseModel):
    id: int
    service_type: str
    service_icon: str
    work_details: str | None = None
    status: JobStatus
    current_step: int | None = None
    otp_code: str | None = Field(
        default=None, description="Arrival OTP code — customer shows this to worker on arrival"
    )
    completion_otp_code: str | None = Field(
        default=None, description="Completion OTP code — shown to customer only after worker has arrived"
    )
    worker: AssignedWorkerOut | None = None
    address: str
    landmark: str | None = None
    lat: float
    lng: float
    services: list[JobServiceOut] = Field(default_factory=list)
    amounts: AmountsOut
    extra_requests: list[ExtraAmountOut] = Field(default_factory=list)
    status_events: list[StatusEventOut] = Field(default_factory=list)
    requested_at: datetime
    accepted_at: datetime | None = None
    completed_at: datetime | None = None
    unread_messages: int = 0


# -- Extra amount, chat, payment, ratings --
class CustomerExtraAmountDecision(BaseModel):
    approve: bool


class CustomerChatMessageCreate(BaseModel):
    text: str = Field(min_length=1, max_length=2000)


class CustomerCallRequestResponse(BaseModel):
    approve: bool


class CustomerRatingCreate(BaseModel):
    stars: int = Field(ge=1, le=5)
    feedback: str | None = Field(default=None, max_length=2000)


class CustomerPaymentOut(BaseModel):
    id: int
    job_id: int
    worker_id: int
    base_amount: float
    extra_amount: float
    total_amount: float
    status: PaymentStatus
    created_at: datetime
    paid_at: datetime | None = None

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# Service discovery schemas
# ---------------------------------------------------------------------------

class ServiceCategoryOut(BaseModel):
    """One service category with live worker availability counts from the DB."""
    key: str
    name: str
    description: str
    icon: str          # MaterialCommunityIcons glyph name
    color: str         # foreground hex
    bg: str            # background hex
    total_workers: int
    available_workers: int


class WorkerSearchItem(BaseModel):
    """Slim worker record returned by the service search endpoint."""
    id: int
    name: str
    skills: list[str]
    rating_avg: float
    rating_count: int
    completed_jobs: int
    is_available: bool
    photo_url: str | None = None
    distance_km: float | None = None
    eta_minutes: int | None = None


class ServiceSearchResult(BaseModel):
    query: str
    categories: list[ServiceCategoryOut]
    workers: list[WorkerSearchItem]
