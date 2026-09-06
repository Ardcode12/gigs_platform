"""Extra-amount request (spec #6) — worker asks, customer approves out of band."""

from datetime import datetime

from sqlalchemy import (
    DateTime,
    Enum as SQLEnum,
    ForeignKey,
    Numeric,
    String,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import ExtraAmountStatus

extra_status_enum = SQLEnum(
    ExtraAmountStatus,
    name="extra_amount_status",
    values_callable=lambda e: [m.value for m in e],
)


class ExtraAmountRequest(Base):
    __tablename__ = "extra_amount_requests"

    id: Mapped[int] = mapped_column(primary_key=True)
    job_id: Mapped[int] = mapped_column(
        ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False, index=True
    )
    amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    reason: Mapped[str] = mapped_column(String(500), nullable=False)
    status: Mapped[ExtraAmountStatus] = mapped_column(
        extra_status_enum, default=ExtraAmountStatus.PENDING, nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    decided_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    job: Mapped["Job"] = relationship(back_populates="extra_requests")  # noqa: F821
