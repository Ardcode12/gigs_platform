"""Password-reset codes and SMS delivery for OTP verification."""

import logging
import secrets
from datetime import datetime, timedelta, timezone

from twilio.base.exceptions import TwilioException
from twilio.rest import Client
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import verify_password
from app.models import Customer, OtpVerification, PasswordReset, Worker

logger = logging.getLogger(__name__)

CODE_LENGTH = 6
CODE_TTL_MINUTES = settings.OTP_EXPIRY_MINUTES
MAX_ATTEMPTS = 5
RESEND_COOLDOWN_SECONDS = settings.OTP_RESEND_COOLDOWN_SECONDS


class OtpProviderError(RuntimeError):
    def __init__(self, message: str, http_status: int):
        super().__init__(message)
        self.http_status = http_status


def normalize_phone(phone: str) -> str:
    """Accept Indian mobile numbers and normalize them to E.164 format."""
    digits = "".join(ch for ch in (phone or "").strip() if ch.isdigit())
    if not digits:
        raise ValueError("Please enter a valid Indian mobile number.")

    if len(digits) == 10:
        return f"+91{digits}"
    if len(digits) == 12 and digits.startswith("91"):
        return f"+{digits}"
    if len(digits) > 10 and digits.startswith("0"):
        return f"+91{digits[1:]}"
    if (phone or "").strip().startswith("+") and len(digits) >= 10:
        return f"+{digits}"
    if len(digits) >= 10:
        return f"+{digits}"
    raise ValueError("Please enter a valid Indian mobile number.")


def generate_code() -> str:
    """Retained for job-completion OTPs, which are not phone verification codes."""
    return "".join(secrets.choice("0123456789") for _ in range(CODE_LENGTH))


def _get_twilio_client() -> Client:
    account_sid = settings.TWILIO_ACCOUNT_SID.strip()
    auth_token = settings.TWILIO_AUTH_TOKEN.strip()
    service_sid = settings.TWILIO_VERIFY_SERVICE_SID.strip()

    if not account_sid or not auth_token or not service_sid:
        raise OtpProviderError("Twilio Verify is not configured.", 500)

    return Client(account_sid, auth_token)


def send_otp(phone: str) -> str:
    normalized_phone = normalize_phone(phone)
    client = _get_twilio_client()

    try:
        verification = (
            client.verify.v2.services(settings.TWILIO_VERIFY_SERVICE_SID.strip())
            .verifications.create(to=normalized_phone, channel="sms")
        )
    except TwilioException as exc:
        logger.warning("Twilio Verify send failed for %s: %s (%s)", normalized_phone, exc.msg, exc.code)
        if getattr(exc, "code", None) == 21608:
            raise OtpProviderError(
                "This phone number must be verified in the Twilio Console before a Trial account can send OTPs.",
                400,
            ) from exc
        if getattr(exc, "status", 0) == 429:
            raise OtpProviderError("Too many OTP requests. Please try again later.", 429) from exc
        if getattr(exc, "code", None) in {20001, 20003, 20404}:
            raise OtpProviderError("Twilio Verify is not configured correctly.", 500) from exc
        raise OtpProviderError("OTP service is temporarily unavailable. Please try again.", 503) from exc

    verification_id = getattr(verification, "sid", None)
    if not verification_id:
        raise OtpProviderError("OTP service did not return a verification ID.", 503)
    return str(verification_id)


def verify_otp(phone: str, code: str) -> None:
    normalized_phone = normalize_phone(phone)
    client = _get_twilio_client()

    try:
        verification_check = (
            client.verify.v2.services(settings.TWILIO_VERIFY_SERVICE_SID.strip())
            .verification_checks.create(to=normalized_phone, code=code)
        )
    except TwilioException as exc:
        logger.warning("Twilio Verify check failed for %s: %s (%s)", normalized_phone, exc.msg, exc.code)
        if getattr(exc, "code", None) == 20404:
            raise OtpProviderError("Twilio Verify is not configured correctly.", 500) from exc
        if getattr(exc, "status", 0) == 429:
            raise OtpProviderError("Too many OTP attempts. Please try again later.", 429) from exc
        raise OtpProviderError("The OTP is incorrect or has expired.", 400) from exc

    if str(getattr(verification_check, "status", "")).lower() != "approved":
        raise OtpProviderError("The OTP is incorrect or has expired.", 400)


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

    verification_id = send_otp(worker.phone)
    db.add(
        PasswordReset(
            worker_id=worker.id,
            verification_id=verification_id,
            expires_at=now + timedelta(minutes=CODE_TTL_MINUTES),
        )
    )
    db.flush()
    return ""


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

    if not reset.verification_id:
        return False, "No reset verification is available. Please start again."

    try:
        verify_otp(worker.phone, code)
    except OtpProviderError as exc:
        if exc.http_status == 503:
            return False, "OTP service is temporarily unavailable. Please try again."
        reset.attempts += 1
        db.flush()
        remaining = MAX_ATTEMPTS - reset.attempts
        if remaining <= 0:
            reset.used_at = now
            db.flush()
            return False, "Too many incorrect attempts. Please request a new code."
        return False, str(exc)

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

    verification_id = send_otp(customer.phone)
    db.add(
        PasswordReset(
            customer_id=customer.id,
            verification_id=verification_id,
            expires_at=now + timedelta(minutes=CODE_TTL_MINUTES),
        )
    )
    db.flush()
    return ""


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

    if not reset.verification_id:
        return False, "No reset verification is available. Please start again."

    try:
        verify_otp(customer.phone, code)
    except OtpProviderError as exc:
        if exc.http_status == 503:
            return False, "OTP service is temporarily unavailable. Please try again."
        reset.attempts += 1
        db.flush()
        remaining = MAX_ATTEMPTS - reset.attempts
        if remaining <= 0:
            reset.used_at = now
            db.flush()
            return False, "Too many incorrect attempts. Please request a new code."
        return False, str(exc)

    reset.used_at = now
    db.flush()
    return True, "OK"


def expose_code(code: str) -> str | None:
    """Never expose OTPs to the client; this remains a no-op even in DEV_MODE."""
    return None


# ---------------------------------------------------------------------------
# Signup OTP
# ---------------------------------------------------------------------------

def create_signup_otp(db: Session, phone: str) -> str:
    """Invalidate any outstanding signup codes for this phone and issue a fresh one."""
    now = datetime.now(timezone.utc)

    recent_otp = db.scalars(
        select(OtpVerification)
        .where(
            OtpVerification.phone == phone,
            OtpVerification.purpose == "signup",
            OtpVerification.used_at.is_(None),
        )
        .order_by(OtpVerification.id.desc())
        .limit(1)
    ).first()
    if recent_otp is not None and recent_otp.created_at > now - timedelta(seconds=RESEND_COOLDOWN_SECONDS):
        raise RuntimeError(
            f"Please wait {RESEND_COOLDOWN_SECONDS} seconds before requesting a new verification code."
        )

    outstanding = db.scalars(
        select(OtpVerification).where(
            OtpVerification.phone == phone,
            OtpVerification.purpose == "signup",
            OtpVerification.used_at.is_(None),
        )
    ).all()
    for row in outstanding:
        row.used_at = now

    verification_id = send_otp(phone)
    db.add(
        OtpVerification(
            phone=phone,
            verification_id=verification_id,
            purpose="signup",
            expires_at=now + timedelta(minutes=CODE_TTL_MINUTES),
        )
    )
    db.flush()

    return verification_id


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

    if not otp_row.verification_id:
        return False, "No verification session is available. Please request a new code."

    try:
        verify_otp(phone, code)
    except OtpProviderError as exc:
        if exc.http_status == 503:
            return False, "OTP service is temporarily unavailable. Please try again."
        otp_row.attempts += 1
        db.flush()
        remaining = MAX_ATTEMPTS - otp_row.attempts
        if remaining <= 0:
            otp_row.used_at = now
            db.flush()
            return False, "Too many incorrect attempts. Please request a new verification code."
        return False, str(exc)

    otp_row.used_at = now
    db.flush()
    return True, "OK"
