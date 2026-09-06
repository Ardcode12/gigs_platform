"""Earnings and payments (spec #10).

Money is read from the `payments` table rather than recomputed from jobs, so what
the worker sees here always matches what was recorded when the job completed —
even if a job's extras change afterwards.

Day boundaries follow `settings.TIMEZONE`, not UTC: a job finished at 1am in Delhi
belongs to that day's earnings, not the previous one.
"""

from datetime import date, datetime, time, timedelta

from fastapi import APIRouter, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.deps import CurrentWorker, DbSession
from app.models import Payment, PaymentStatus, Worker
from app.schemas.misc import (
    EarningsBucket,
    EarningsOverview,
    EarningsSummary,
    PaymentOut,
)
from app.services.serialize import serialize_payment

router = APIRouter(prefix="/api", tags=["earnings"])


def _local_midnight(day: date) -> datetime:
    return datetime.combine(day, time.min, tzinfo=settings.tz)


def _period_bounds(period: str, today: date) -> tuple[date, date]:
    """[start, end) as local dates. `end` is exclusive."""
    if period == "today":
        return today, today + timedelta(days=1)
    if period == "week":
        # Monday-start, which is how the week reads on an Indian work roster.
        monday = today - timedelta(days=today.weekday())
        return monday, monday + timedelta(days=7)
    # month
    first = today.replace(day=1)
    next_month = (first + timedelta(days=31)).replace(day=1)
    return first, next_month


def _buckets(period: str, start: date, end: date) -> list[tuple[str, date, date]]:
    """(label, bucket start, bucket end) — one entry per bar in the chart."""
    if period == "today":
        return [("Today", start, end)]
    if period == "week":
        return [
            (
                (start + timedelta(days=i)).strftime("%a"),
                start + timedelta(days=i),
                start + timedelta(days=i + 1),
            )
            for i in range(7)
        ]
    # A bar per day would be 30 bars; weeks keep the chart readable.
    out: list[tuple[str, date, date]] = []
    cursor, week = start, 1
    while cursor < end:
        stop = min(cursor + timedelta(days=7), end)
        out.append((f"W{week}", cursor, stop))
        cursor, week = stop, week + 1
    return out


def _summary(db: Session, worker: Worker, period: str, today: date) -> EarningsSummary:
    start, end = _period_bounds(period, today)

    payments = db.scalars(
        select(Payment).where(
            Payment.worker_id == worker.id,
            Payment.created_at >= _local_midnight(start),
            Payment.created_at < _local_midnight(end),
        )
    ).all()

    # Bucket in Python: a month of one worker's payments is a handful of rows, and
    # this keeps the timezone conversion in one obvious place.
    local_day = {p.id: p.created_at.astimezone(settings.tz).date() for p in payments}

    breakdown = []
    for label, bucket_start, bucket_end in _buckets(period, start, end):
        rows = [p for p in payments if bucket_start <= local_day[p.id] < bucket_end]
        breakdown.append(
            EarningsBucket(
                label=label,
                day=bucket_start,
                amount=sum(float(p.total_amount) for p in rows),
                jobs=len(rows),
            )
        )

    return EarningsSummary(
        period=period,
        total=sum(float(p.total_amount) for p in payments),
        jobs=len(payments),
        extra_earned=sum(float(p.extra_amount) for p in payments),
        pending=sum(
            float(p.total_amount) for p in payments if p.status == PaymentStatus.PENDING
        ),
        breakdown=breakdown,
    )


@router.get("/earnings/summary", response_model=EarningsSummary)
def earnings_summary(
    worker: CurrentWorker,
    db: DbSession,
    period: str = Query(default="today", pattern="^(today|week|month)$"),
) -> EarningsSummary:
    today = datetime.now(settings.tz).date()
    return _summary(db, worker, period, today)


@router.get("/earnings/overview", response_model=EarningsOverview)
def earnings_overview(worker: CurrentWorker, db: DbSession) -> EarningsOverview:
    """All three periods in one call, so the Earnings screen switches tabs offline."""
    today = datetime.now(settings.tz).date()
    return EarningsOverview(
        today=_summary(db, worker, "today", today),
        week=_summary(db, worker, "week", today),
        month=_summary(db, worker, "month", today),
    )


@router.get("/payments", response_model=list[PaymentOut])
def list_payments(
    worker: CurrentWorker,
    db: DbSession,
    payment_status: PaymentStatus | None = Query(default=None, alias="status"),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
) -> list[PaymentOut]:
    """Per-job payment history, newest first."""
    stmt = select(Payment).where(Payment.worker_id == worker.id)
    if payment_status is not None:
        stmt = stmt.where(Payment.status == payment_status)
    rows = db.scalars(
        stmt.order_by(Payment.created_at.desc()).limit(limit).offset(offset)
    ).all()
    return [serialize_payment(p) for p in rows]
