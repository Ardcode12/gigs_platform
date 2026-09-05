"""Customer model — authentication, profile, and booking owner.

Customers self-register with phone + password (email optional). `phone` is
intentionally never serialised into worker-facing responses (spec #5: numbers
stay hidden). `saved_addresses` is a JSONB list of named address slots so the
customer doesn't retype their home/work every booking.
"""

from datetime import datetime
from typing import Any

from sqlalchemy import Boolean, DateTime, Integer, Numeric, String, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Customer(Base):
    __tablename__ = "customers"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    phone: Mapped[str] = mapped_column(String(20), nullable=False, unique=True, index=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True, unique=True, index=True)
    password_hash: Mapped[str | None] = mapped_column(String(255), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, server_default="true", nullable=False)
    must_change_password: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false", nullable=False)
    city: Mapped[str | None] = mapped_column(String(100))
    photo_url: Mapped[str | None] = mapped_column(String(500))
    saved_addresses: Mapped[dict[str, Any] | None] = mapped_column(JSONB, default=list, nullable=True)
    rating_avg: Mapped[float] = mapped_column(
        Numeric(3, 2), default=0, server_default="0", nullable=False
    )
    rating_count: Mapped[int] = mapped_column(
        Integer, default=0, server_default="0", nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
