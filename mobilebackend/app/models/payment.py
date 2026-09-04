"""Payment for a completed job (spec #10)."""

from datetime import datetime

from sqlalchemy import (
    DateTime,
    Enum as SQLEnum,
    ForeignKey,
    Numeric,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import PaymentStatus

payment_status_enum = SQLEnum(
    PaymentStatus,
    name="payment_status",
    values_callable=lambda e: [m.value for m in e],
)


class Payment(Base):
    __tablename__ = "payments"

    id: Mapped[int] = mapped_column(primary_key=True)
    job_id: Mapped[int] = mapped_column(
        ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False, unique=True
    )
    worker_id: Mapped[int] = mapped_column(
        ForeignKey("workers.id", ondelete="CASCADE"), nullable=False, index=True
    )

    base_amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    # Sum of approved extra-amount requests at the time the job completed.
    extra_amount: Mapped[float] = mapped_column(
        Numeric(10, 2), default=0, server_default="0", nullable=False
    )
    total_amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)

    status: Mapped[PaymentStatus] = mapped_column(
        payment_status_enum, default=PaymentStatus.PENDING, nullable=False, index=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False, index=True
    )
    paid_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    job: Mapped["Job"] = relationship(lazy="joined")  # noqa: F821
