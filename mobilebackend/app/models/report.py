"""Reports raised by either participant against a specific job."""

from datetime import datetime

from sqlalchemy import DateTime, Enum as SQLEnum, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


reporter_type_enum = SQLEnum("worker", "customer", name="reporter_type")
report_status_enum = SQLEnum("open", "reviewing", "resolved", "rejected", name="report_status")


class JobReport(Base):
    __tablename__ = "job_reports"

    id: Mapped[int] = mapped_column(primary_key=True)
    job_id: Mapped[int] = mapped_column(ForeignKey("jobs.id", ondelete="CASCADE"), index=True)
    reporter_type: Mapped[str] = mapped_column(reporter_type_enum, nullable=False)
    reporter_id: Mapped[int] = mapped_column(nullable=False)
    category: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(report_status_enum, default="open", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    resolution_note: Mapped[str | None] = mapped_column(Text)
