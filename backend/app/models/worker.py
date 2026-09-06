"""Worker — the only account type that can authenticate against this API."""

from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, Numeric, String, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Worker(Base):
    __tablename__ = "workers"

    id: Mapped[int] = mapped_column(primary_key=True)
    society_id: Mapped[int] = mapped_column(
        ForeignKey("societies.id", ondelete="RESTRICT"), nullable=False, index=True
    )

    # Credentials — set by the society, never by the worker.
    worker_code: Mapped[str] = mapped_column(String(32), unique=True, nullable=False, index=True)
    phone: Mapped[str] = mapped_column(String(20), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    must_change_password: Mapped[bool] = mapped_column(
        Boolean, default=True, server_default="true", nullable=False
    )

    # Personal details
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    city: Mapped[str | None] = mapped_column(String(100))
    skills: Mapped[list[str]] = mapped_column(JSONB, default=list, nullable=False)
    aadhaar_masked: Mapped[str | None] = mapped_column(String(20))
    photo_url: Mapped[str | None] = mapped_column(String(500))
    kyc_status: Mapped[str] = mapped_column(String(30), default="pending", server_default="pending", nullable=False)
    kyc_method: Mapped[str | None] = mapped_column(String(40))
    kyc_refs: Mapped[list] = mapped_column(JSONB, default=list, nullable=False)
    kyc_reason: Mapped[str | None] = mapped_column(String(300))
    authority_data: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)
    authority_status: Mapped[str] = mapped_column(String(30), default="pending", server_default="pending", nullable=False, index=True)
    authority_reason: Mapped[str | None] = mapped_column(String(500))
    authority_verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    # Availability (spec #2) and last known position (feeds distance/ETA)
    is_available: Mapped[bool] = mapped_column(
        Boolean, default=False, server_default="false", nullable=False
    )
    last_lat: Mapped[float | None] = mapped_column(Float)
    last_lng: Mapped[float | None] = mapped_column(Float)
    location_updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    # Denormalised aggregates, recalculated when a rating or job lands.
    rating_avg: Mapped[float] = mapped_column(
        Numeric(3, 2), default=0, server_default="0", nullable=False
    )
    rating_count: Mapped[int] = mapped_column(
        Integer, default=0, server_default="0", nullable=False
    )
    completed_jobs: Mapped[int] = mapped_column(
        Integer, default=0, server_default="0", nullable=False
    )

    member_since: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    society: Mapped["Society"] = relationship(back_populates="workers")  # noqa: F821
