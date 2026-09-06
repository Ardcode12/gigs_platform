"""Authority portal records that are not part of the worker application."""
from datetime import datetime
from typing import Any
from sqlalchemy import DateTime, ForeignKey, Numeric, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base

class AuthorityRecord(Base):
    __abstract__ = True
    id: Mapped[int] = mapped_column(primary_key=True)
    society_id: Mapped[int] = mapped_column(ForeignKey("societies.id", ondelete="CASCADE"), index=True)
    data: Mapped[dict[str, Any]] = mapped_column(JSONB, default=dict, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

class SocietyRate(AuthorityRecord):
    __tablename__ = "society_rates"
    category: Mapped[str] = mapped_column(String(100), nullable=False)
    base_rate: Mapped[float] = mapped_column(Numeric(10, 2), default=0, nullable=False)
    hourly_rate: Mapped[float] = mapped_column(Numeric(10, 2), default=0, nullable=False)
    daily_rate: Mapped[float] = mapped_column(Numeric(10, 2), default=0, nullable=False)

class WelfareEnrollment(AuthorityRecord):
    __tablename__ = "welfare_enrollments"
    worker_id: Mapped[int] = mapped_column(ForeignKey("workers.id", ondelete="CASCADE"), index=True)
    scheme_id: Mapped[str] = mapped_column(String(100), nullable=False)

class WorkerAdvance(AuthorityRecord):
    __tablename__ = "worker_advances"
    worker_id: Mapped[int] = mapped_column(ForeignKey("workers.id", ondelete="CASCADE"), index=True)
    amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="pending", nullable=False)

class SocietyComplaint(AuthorityRecord):
    __tablename__ = "society_complaints"
    job_id: Mapped[int | None] = mapped_column(ForeignKey("jobs.id", ondelete="SET NULL"), index=True)
    status: Mapped[str] = mapped_column(String(30), default="open", nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    responses: Mapped[list] = mapped_column(JSONB, default=list, nullable=False)

class GpsRequest(AuthorityRecord):
    __tablename__ = "gps_requests"
    status: Mapped[str] = mapped_column(String(30), default="requested", nullable=False)


class FederationUser(Base):
    __tablename__ = "federation_users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
