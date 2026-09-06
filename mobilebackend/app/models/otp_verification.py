"""OTP verification codes for signup and phone verification.

A row is created when an OTP is requested and stores a hashed copy of the code,
the target phone number, its purpose, and an expiration timestamp.
"""

from datetime import datetime

from sqlalchemy import DateTime, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class OtpVerification(Base):
    __tablename__ = "otp_verifications"

    id: Mapped[int] = mapped_column(primary_key=True)
    phone: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    code_hash: Mapped[str | None] = mapped_column(String(255), nullable=True)
    verification_id: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)
    purpose: Mapped[str] = mapped_column(
        String(50), default="signup", server_default="signup", nullable=False
    )
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    attempts: Mapped[int] = mapped_column(Integer, default=0, server_default="0", nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
