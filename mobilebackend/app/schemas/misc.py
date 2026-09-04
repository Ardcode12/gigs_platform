"""Earnings, payment, rating and notification schemas."""

from datetime import date, datetime
from typing import Any

from pydantic import BaseModel, ConfigDict

from app.models.enums import NotificationType, PaymentStatus


# -- earnings (spec #10) ---------------------------------------------------
class EarningsBucket(BaseModel):
    """One bar in the breakdown chart."""

    label: str
    day: date
    amount: float
    jobs: int


class EarningsSummary(BaseModel):
    period: str
    total: float
    jobs: int
    extra_earned: float
    pending: float
    breakdown: list[EarningsBucket]


class EarningsOverview(BaseModel):
    """All three periods at once — the Earnings screen switches tabs client-side."""

    today: EarningsSummary
    week: EarningsSummary
    month: EarningsSummary


class PaymentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    job_id: int
    base_amount: float
    extra_amount: float
    total_amount: float
    status: PaymentStatus
    created_at: datetime
    paid_at: datetime | None
    service_type: str | None = None
    customer_name: str | None = None


# -- ratings (spec #11) ----------------------------------------------------
class RatingOut(BaseModel):
    id: int
    job_id: int
    stars: int
    feedback: str | None
    created_at: datetime
    customer_name: str
    service_type: str


class RatingSummary(BaseModel):
    overall: float
    count: int
    #: Star value -> number of ratings, always keyed "1".."5".
    distribution: dict[str, int]


# -- notifications (spec #12) ----------------------------------------------
class NotificationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    type: NotificationType
    title: str
    body: str | None
    data: dict[str, Any]
    is_read: bool
    created_at: datetime


class UnreadCountOut(BaseModel):
    unread: int
