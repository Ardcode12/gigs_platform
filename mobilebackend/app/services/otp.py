"""Password-reset codes and the single point where SMS sending is plugged in."""

import logging
import secrets
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import hash_password, verify_password
from app.models import Customer, OtpVerification, PasswordReset, Worker

logger = logging.getLogger(__name__)

CODE_LENGTH = 6
CODE_TTL_MINUTES = 10
MAX_ATTEMPTS = 5


def generate_code() -> str:
    """A cryptographically random 6-digit code (leading zeros allowed)."""
    return "".join(secrets.choice("0123456789") for _ in range(CODE_LENGTH))


def send_sms(phone: str, message: str) -> None:
    """Deliver an SMS.

    This is the only place that needs to change to go live: drop in MSG91 /
    Twilio / Gupshup here. Until then the message is logged, and in DEV_MODE the
    caller also returns the code in the HTTP response so the flow is testable
    without a provider.
    """
    logger.info("[SMS -> %s] %s", phone, message)


def mask_phone(phone: str) -> str:
    """+919876543210 -> +91XXXXXX3210. Enough to confirm which number, not enough to dial."""
    digits = phone.strip()
    if len(digits) <= 4:
        return "X" * len(digits)
    visible_tail = digits[-4:]
    head = digits[:3] if digits.startswith("+") else digits[:2]
    hidden = "X" * max(0, len(digits) - len(head) - 4)
    return f"{head}{hidden}{visible_tail}"


# ---------------------------------------------------------------------------
# Worker OTP
# ---------------------------------------------------------------------------

def create_reset_code(db: Session, worker: Worker) -> str:
    """Invalidate any outstanding codes for this worker and issue a fresh one."""
    now = datetime.now(timezone.utc)

    outstanding = db.scalars(
        select(PasswordReset).where(
            PasswordReset.worker_id == worker.id,
            PasswordReset.used_at.is_(None),
        )
    ).all()
    for row in outstanding:
        row.used_at = now

    code = generate_code()
    db.add(
        PasswordReset(
            worker_id=worker.id,
            code_hash=hash_password(code),
            expires_at=now + timedelta(minutes=CODE_TTL_MINUTES),
        )
    )
    db.flush()

    send_sms(
        worker.phone,
        f"WORKMAT: your password reset code is {code}. "
        f"It expires in {CODE_TTL_MINUTES} minutes.",
    )
    return code


def verify_reset_code(db: Session, worker: Worker, code: str) -> tuple[bool, str]:
    """Check a submitted code and consume it on success.

    Returns (ok, reason). `reason` is a message safe to show the worker.
    """
    now = datetime.now(timezone.utc)

    reset = db.scalars(
        select(PasswordReset)
        .where(
            PasswordReset.worker_id == worker.id,
            PasswordReset.used_at.is_(None),
        )
        .order_by(PasswordReset.id.desc())
        .limit(1)
    ).first()

    if reset is None:
        return False, "No reset code has been requested. Please start again."

    if reset.expires_at <= now:
        reset.used_at = now
        db.flush()
        return False, "This code has expired. Please request a new one."

    if reset.attempts >= MAX_ATTEMPTS:
        reset.used_at = now
        db.flush()
        return False, "Too many incorrect attempts. Please request a new code."

    if not verify_password(code, reset.code_hash):
        reset.attempts += 1
        db.flush()
        remaining = MAX_ATTEMPTS - reset.attempts
        if remaining <= 0:
            reset.used_at = now
            db.flush()
            return False, "Too many incorrect attempts. Please request a new code."
        return False, f"Incorrect code. {remaining} attempt(s) remaining."

    # Correct — burn it so it can't be replayed.
    reset.used_at = now
    db.flush()
    return True, "OK"

# ---------------------------------------------------------------------------
# Customer OTP
# ---------------------------------------------------------------------------

def create_customer_reset_code(db: Session, customer: Customer) -> str:
    """Invalidate any outstanding codes for this customer and issue a fresh one."""
    now = datetime.now(timezone.utc)

    outstanding = db.scalars(
        select(PasswordReset).where(
            PasswordReset.customer_id == customer.id,
            PasswordReset.used_at.is_(None),
        )
    ).all()
    for row in outstanding:
        row.used_at = now

    code = generate_code()
    db.add(
        PasswordReset(
            customer_id=customer.id,
            code_hash=hash_password(code),
            expires_at=now + timedelta(minutes=CODE_TTL_MINUTES),
        )
    )
    db.flush()

    send_sms(
        customer.phone,
        f"WORKMAT: your password reset code is {code}. "
        f"It expires in {CODE_TTL_MINUTES} minutes.",
    )
    return code


def verify_customer_reset_code(db: Session, customer: Customer, code: str) -> tuple[bool, str]:
    """Check a submitted code for customer and consume it on success."""
    now = datetime.now(timezone.utc)

    reset = db.scalars(
        select(PasswordReset)
        .where(
            PasswordReset.customer_id == customer.id,
            PasswordReset.used_at.is_(None),
        )
        .order_by(PasswordReset.id.desc())
        .limit(1)
    ).first()

    if reset is None:
        return False, "No reset code has been requested. Please start again."

    if reset.expires_at <= now:
        reset.used_at = now
        db.flush()
        return False, "This code has expired. Please request a new one."

    if reset.attempts >= MAX_ATTEMPTS:
        reset.used_at = now
        db.flush()
        return False, "Too many incorrect attempts. Please request a new code."

    if not verify_password(code, reset.code_hash):
        reset.attempts += 1
        db.flush()
        remaining = MAX_ATTEMPTS - reset.attempts
        if remaining <= 0:
            reset.used_at = now
            db.flush()
            return False, "Too many incorrect attempts. Please request a new code."
        return False, f"Incorrect code. {remaining} attempt(s) remaining."

    reset.used_at = now
    db.flush()
    return True, "OK"


def expose_code(code: str) -> str | None:
    """The code to echo back in the response — only ever in DEV_MODE."""
    return code if settings.DEV_MODE else None


# ---------------------------------------------------------------------------
# Signup OTP
# ---------------------------------------------------------------------------

def create_signup_otp(db: Session, phone: str) -> str:
    """Invalidate any outstanding signup codes for this phone and issue a fresh one."""
    now = datetime.now(timezone.utc)

    outstanding = db.scalars(
        select(OtpVerification).where(
            OtpVerification.phone == phone,
            OtpVerification.purpose == "signup",
            OtpVerification.used_at.is_(None),
        )
    ).all()
    for row in outstanding:
        row.used_at = now

    code = generate_code()
    db.add(
        OtpVerification(
            phone=phone,
            code_hash=hash_password(code),
            purpose="signup",
            expires_at=now + timedelta(minutes=CODE_TTL_MINUTES),
        )
    )
    db.flush()

    send_sms(
        phone,
        f"WORKMAT: your verification code for signup is {code}. "
        f"It expires in {CODE_TTL_MINUTES} minutes.",
    )
    return code


def verify_signup_otp(db: Session, phone: str, code: str) -> tuple[bool, str]:
    """Check a submitted signup OTP for phone and consume it on success.

    Returns (ok, reason).
    """
    now = datetime.now(timezone.utc)

    otp_row = db.scalars(
        select(OtpVerification)
        .where(
            OtpVerification.phone == phone,
            OtpVerification.purpose == "signup",
            OtpVerification.used_at.is_(None),
        )
        .order_by(OtpVerification.id.desc())
        .limit(1)
    ).first()

    if otp_row is None:
        return False, "No verification code has been requested for this phone number. Please request a new one."

    if otp_row.expires_at <= now:
        otp_row.used_at = now
        db.flush()
        return False, "This verification code has expired. Please request a new one."

    if otp_row.attempts >= MAX_ATTEMPTS:
        otp_row.used_at = now
        db.flush()
        return False, "Too many incorrect attempts. Please request a new verification code."

    if not verify_password(code, otp_row.code_hash):
        otp_row.attempts += 1
        db.flush()
        remaining = MAX_ATTEMPTS - otp_row.attempts
        if remaining <= 0:
            otp_row.used_at = now
            db.flush()
            return False, "Too many incorrect attempts. Please request a new verification code."
        return False, f"Incorrect verification code. {remaining} attempt(s) remaining."

    otp_row.used_at = now
    db.flush()
    return True, "OK"
