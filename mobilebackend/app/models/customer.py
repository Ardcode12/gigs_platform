"""Customer — data only.

There are no customer-facing endpoints in this service. Rows exist so that a job
can display a name and a rating, and are created by seed.py. `phone` is stored
because a real deployment needs it to place the bridged call, but it is never
serialised into any worker-facing response (spec #5: numbers stay hidden).
"""

from datetime import datetime

from sqlalchemy import DateTime, Integer, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Customer(Base):
    __tablename__ = "customers"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    phone: Mapped[str] = mapped_column(String(20), nullable=False)  # never exposed to workers
    city: Mapped[str | None] = mapped_column(String(100))
    photo_url: Mapped[str | None] = mapped_column(String(500))
    rating_avg: Mapped[float] = mapped_column(
        Numeric(3, 2), default=0, server_default="0", nullable=False
    )
    rating_count: Mapped[int] = mapped_column(
        Integer, default=0, server_default="0", nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
