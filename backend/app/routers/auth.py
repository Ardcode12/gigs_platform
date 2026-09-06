"""Authentication (spec #1).

Workers never self-register — the society creates the account and sets the first
password (see routers/admin.py). These routes only let an existing worker in.
"""

import logging

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.core.deps import CurrentWorker, DbSession
from app.core.deps import CurrentFederation
from app.core.security import (
    create_access_token,
    create_refresh_token,
    create_authority_access_token,
    create_authority_refresh_token,
    create_federation_access_token,
    create_federation_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.models import FederationUser, Society, Worker
from app.schemas.auth import (
    ChangePasswordRequest,
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    LoginRequest,
    LoginResponse,
    MessageResponse,
    RefreshRequest,
    ResetPasswordRequest,
    TokenPair,
    SocietyLoginRequest,
    SocietyLoginResponse,
    FederationLoginRequest,
    FederationLoginResponse,
)
from app.schemas.worker import WorkerOut
from app.services.otp import (
    create_reset_code,
    expose_code,
    mask_phone,
    verify_reset_code,
)
from app.services.serialize import serialize_worker

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/federation/login", response_model=FederationLoginResponse)
def federation_login(payload: FederationLoginRequest, db: DbSession) -> FederationLoginResponse:
    user = db.scalar(select(FederationUser).where(func.lower(FederationUser.email) == payload.email.strip().lower()))
    if user is None or not user.is_active or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect federation credentials")
    return FederationLoginResponse(
        access_token=create_federation_access_token(user.id),
        refresh_token=create_federation_refresh_token(user.id),
        federation={"id": user.id, "email": user.email, "name": user.name, "role": "federation"},
    )

@router.post("/society/login", response_model=SocietyLoginResponse)
def society_login(payload: SocietyLoginRequest, db: DbSession) -> SocietyLoginResponse:
    society = db.scalar(select(Society).where(func.lower(Society.society_code) == payload.societyCode.strip().lower()))
    if society is None or not society.password_hash or not verify_password(payload.password, society.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect society code or password")
    if not society.is_active:
        raise HTTPException(status_code=403, detail=f"Society account is {society.status or 'inactive'}. Please contact Federation Authority.")
    return SocietyLoginResponse(
        access_token=create_authority_access_token(society.id),
        refresh_token=create_authority_refresh_token(society.id),
        society={"id": society.id, "societyCode": society.society_code, "name": society.name, "city": society.city},
    )


def _find_worker(db: Session, identifier: str) -> Worker | None:
    """Resolve a login identifier: worker code or phone, whichever matches.

    Codes are compared case-insensitively so "wm1042" works; phones are compared
    on their digits so "+91 98765 43210" matches a stored "+919876543210".
    """
    raw = identifier.strip()
    digits = "".join(c for c in raw if c.isdigit())

    stmt = select(Worker).where(
        or_(
            func.lower(Worker.worker_code) == raw.lower(),
            Worker.phone == raw,
        )
    )
    worker = db.scalars(stmt).first()
    if worker is not None:
        return worker

    if len(digits) >= 10:
        # Fall back to matching on the trailing 10 digits, so a worker typing
        # their number with or without the country code both land.
        candidates = db.scalars(
            select(Worker).where(Worker.phone.like(f"%{digits[-10:]}"))
        ).all()
        if len(candidates) == 1:
            return candidates[0]
    return None


@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest, db: DbSession) -> LoginResponse:
    worker = _find_worker(db, payload.identifier)

    # One message for both "no such worker" and "wrong password" — the difference
    # would tell an attacker which worker codes are real.
    if worker is None or not verify_password(payload.password, worker.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect ID/phone or password",
        )

    return LoginResponse(
        access_token=create_access_token(worker.id),
        refresh_token=create_refresh_token(worker.id),
        worker=serialize_worker(worker),
        must_change_password=worker.must_change_password,
    )


@router.post("/refresh", response_model=TokenPair)
def refresh(payload: RefreshRequest, db: DbSession) -> TokenPair:
    worker_id = decode_token(payload.refresh_token, "refresh", expected_role="worker")
    if worker_id is not None and db.get(Worker, worker_id) is not None:
        return TokenPair(
            access_token=create_access_token(worker_id),
            refresh_token=create_refresh_token(worker_id),
        )

    society_id = decode_token(payload.refresh_token, "refresh", expected_role="authority")
    society = db.get(Society, society_id) if society_id is not None else None
    if society is not None and society.is_active:
        return TokenPair(
            access_token=create_authority_access_token(society.id),
            refresh_token=create_authority_refresh_token(society.id),
        )

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired refresh token",
    )


@router.get("/me", response_model=WorkerOut)
def me(worker: CurrentWorker) -> WorkerOut:
    return serialize_worker(worker)


@router.post("/logout", response_model=MessageResponse)
def logout(worker: CurrentWorker) -> MessageResponse:
    """Tokens are stateless, so this is the client's cue to drop them.

    Kept as an endpoint so the app has one call to make, and so a future
    token-denylist has somewhere to live.
    """
    return MessageResponse(message="Logged out")


@router.post("/forgot-password", response_model=ForgotPasswordResponse)
def forgot_password(payload: ForgotPasswordRequest, db: DbSession) -> ForgotPasswordResponse:
    worker = _find_worker(db, payload.identifier)

    # Same response whether or not the worker exists — otherwise this endpoint
    # becomes a way to discover valid worker codes.
    if worker is None:
        logger.info("forgot-password for unknown identifier %r", payload.identifier)
        return ForgotPasswordResponse(
            message="If that ID is registered, a reset code has been sent to the "
            "phone number on file.",
        )

    code = create_reset_code(db, worker)
    db.commit()

    return ForgotPasswordResponse(
        message="If that ID is registered, a reset code has been sent to the "
        "phone number on file.",
        masked_phone=mask_phone(worker.phone),
        dev_code=expose_code(code),
    )


@router.post("/reset-password", response_model=MessageResponse)
def reset_password(payload: ResetPasswordRequest, db: DbSession) -> MessageResponse:
    worker = _find_worker(db, payload.identifier)
    if worker is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid code. Please request a new one.",
        )

    ok, reason = verify_reset_code(db, worker, payload.code)
    if not ok:
        db.commit()  # persist the attempt counter
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=reason)

    worker.password_hash = hash_password(payload.new_password)
    # They chose this password themselves, so there is nothing left to force.
    worker.must_change_password = False
    db.commit()

    return MessageResponse(message="Password updated. You can now log in.")


@router.post("/change-password", response_model=MessageResponse)
def change_password(
    payload: ChangePasswordRequest, worker: CurrentWorker, db: DbSession
) -> MessageResponse:
    if not verify_password(payload.current_password, worker.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect",
        )
    if payload.current_password == payload.new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be different from the current one",
        )

    worker.password_hash = hash_password(payload.new_password)
    worker.must_change_password = False
    db.commit()

    return MessageResponse(message="Password changed")
