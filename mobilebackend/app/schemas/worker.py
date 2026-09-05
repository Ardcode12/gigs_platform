"""Worker schemas."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class WorkerOut(BaseModel):
    """The authenticated worker's own profile. Includes their phone; it is their own."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    worker_code: str
    name: str
    phone: str
    city: str | None
    skills: list[str]
    aadhaar_masked: str | None
    photo_url: str | None
    is_available: bool
    rating_avg: float
    rating_count: int
    completed_jobs: int
    member_since: datetime
    society_name: str | None = None


class WorkerUpdate(BaseModel):
    """Details a worker may edit themselves. Code, phone and society are the society's."""

    name: str | None = Field(default=None, min_length=2, max_length=150)
    city: str | None = Field(default=None, max_length=100)
    skills: list[str] | None = None
    photo_url: str | None = Field(default=None, max_length=500)


class AvailabilityUpdate(BaseModel):
    is_available: bool


class AvailabilityOut(BaseModel):
    is_available: bool
    message: str


class LocationUpdate(BaseModel):
    lat: float = Field(ge=-90, le=90)
    lng: float = Field(ge=-180, le=180)


class LocationOut(BaseModel):
    lat: float
    lng: float
    updated_at: datetime


# -- society admin ---------------------------------------------------------
class WorkerCreate(BaseModel):
    """Society-side worker onboarding. The society chooses the initial password."""

    society_id: int
    worker_code: str = Field(min_length=3, max_length=32)
    name: str = Field(min_length=2, max_length=150)
    phone: str = Field(min_length=10, max_length=20)
    initial_password: str = Field(min_length=6, max_length=128)
    city: str | None = Field(default=None, max_length=100)
    skills: list[str] = Field(default_factory=list)
    aadhaar_masked: str | None = Field(default=None, max_length=20)


class AdminResetPasswordRequest(BaseModel):
    new_password: str = Field(min_length=6, max_length=128)
    #: Force the worker to choose their own password at next login.
    require_change: bool = True
