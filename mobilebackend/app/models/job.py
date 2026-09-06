"""Job, its line-item services, and its status audit trail."""

from datetime import datetime

from sqlalchemy import (
    DateTime,
    Enum as SQLEnum,
    Float,
    ForeignKey,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import JobStatus

job_status_enum = SQLEnum(
    JobStatus,
    name="job_status",
    values_callable=lambda e: [m.value for m in e],
)


class Job(Base):
    __tablename__ = "jobs"

    id: Mapped[int] = mapped_column(primary_key=True)
    customer_id: Mapped[int] = mapped_column(
        ForeignKey("customers.id", ondelete="CASCADE"), nullable=False, index=True
    )
    society_id: Mapped[int | None] = mapped_column(
        ForeignKey("societies.id", ondelete="SET NULL"), index=True
    )
    category_id: Mapped[int | None] = mapped_column(
        ForeignKey("service_categories.id", ondelete="SET NULL"), index=True
    )
    subcategory_id: Mapped[int | None] = mapped_column(
        ForeignKey("service_subcategories.id", ondelete="SET NULL"), index=True
    )
    # Null until a worker accepts. A `requested` job is offered to every available
    # worker whose skills match; the first to accept claims it.
    worker_id: Mapped[int | None] = mapped_column(
        ForeignKey("workers.id", ondelete="SET NULL"), index=True
    )

    service_type: Mapped[str] = mapped_column(String(100), nullable=False)
    # MaterialCommunityIcons glyph name the app already renders, e.g. "water-pump".
    service_icon: Mapped[str] = mapped_column(String(60), default="wrench", nullable=False)
    work_details: Mapped[str | None] = mapped_column(Text)

    address: Mapped[str] = mapped_column(String(400), nullable=False)
    landmark: Mapped[str | None] = mapped_column(String(200))
    lat: Mapped[float] = mapped_column(Float, nullable=False)
    lng: Mapped[float] = mapped_column(Float, nullable=False)

    base_amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)

    status: Mapped[JobStatus] = mapped_column(
        job_status_enum, default=JobStatus.REQUESTED, nullable=False, index=True
    )
    reject_reason: Mapped[str | None] = mapped_column(String(300))
    otp_code: Mapped[str | None] = mapped_column(String(10), nullable=True)

    requested_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    accepted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    arrival_otp_hash: Mapped[str | None] = mapped_column(String(255))
    arrival_otp_expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    arrival_otp_attempts: Mapped[int] = mapped_column(default=0, nullable=False)
    arrival_verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    completion_otp_hash: Mapped[str | None] = mapped_column(String(255))
    completion_otp_expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    completion_otp_attempts: Mapped[int] = mapped_column(default=0, nullable=False)
    completion_verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    completion_otp_code: Mapped[str | None] = mapped_column(String(10), nullable=True)

    customer: Mapped["Customer"] = relationship(lazy="joined")  # noqa: F821
    worker: Mapped["Worker | None"] = relationship(lazy="joined")  # noqa: F821
    services: Mapped[list["JobService"]] = relationship(
        back_populates="job", cascade="all, delete-orphan", order_by="JobService.id"
    )
    status_events: Mapped[list["JobStatusEvent"]] = relationship(
        back_populates="job", cascade="all, delete-orphan", order_by="JobStatusEvent.at"
    )
    extra_requests: Mapped[list["ExtraAmountRequest"]] = relationship(  # noqa: F821
        back_populates="job", cascade="all, delete-orphan", order_by="ExtraAmountRequest.id"
    )


class JobService(Base):
    """One priced line item, e.g. "Fan Installation" / 350."""

    __tablename__ = "job_services"

    id: Mapped[int] = mapped_column(primary_key=True)
    job_id: Mapped[int] = mapped_column(
        ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    price: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)

    job: Mapped["Job"] = relationship(back_populates="services")


class JobStatusEvent(Base):
    """Append-only history. Drives the stepper and gives payments an audit trail."""

    __tablename__ = "job_status_events"

    id: Mapped[int] = mapped_column(primary_key=True)
    job_id: Mapped[int] = mapped_column(
        ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False, index=True
    )
    status: Mapped[JobStatus] = mapped_column(job_status_enum, nullable=False)
    at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    note: Mapped[str | None] = mapped_column(String(300))

    job: Mapped["Job"] = relationship(back_populates="status_events")


class JobRejection(Base):
    """One worker declining one job.

    A job with `worker_id IS NULL` is broadcast to every available worker, so a
    rejection can't simply set `jobs.status = rejected` — that would withdraw the
    job from everyone. Instead it is recorded per worker, and the requests query
    filters out jobs this worker has already turned down.
    """

    __tablename__ = "job_rejections"
    __table_args__ = (
        UniqueConstraint("job_id", "worker_id", name="uq_job_rejection_job_worker"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    job_id: Mapped[int] = mapped_column(
        ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False, index=True
    )
    worker_id: Mapped[int] = mapped_column(
        ForeignKey("workers.id", ondelete="CASCADE"), nullable=False, index=True
    )
    reason: Mapped[str | None] = mapped_column(String(300))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
