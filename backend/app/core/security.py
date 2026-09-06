"""Password hashing and JWT encode/decode."""

from datetime import datetime, timedelta, timezone
from typing import Any, Literal

import jwt
from passlib.context import CryptContext

from app.core.config import settings

_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

TokenType = Literal["access", "refresh"]


def hash_password(plain: str) -> str:
    return _pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return _pwd_context.verify(plain, hashed)
    except ValueError:
        # Malformed hash in the database — treat as a failed login, never a 500.
        return False


UserRole = Literal["worker", "customer", "authority", "federation"]


def _create_token(
    subject: str, token_type: TokenType, expires_delta: timedelta, role: UserRole = "worker"
) -> str:
    now = datetime.now(timezone.utc)
    payload: dict[str, Any] = {
        "sub": subject,
        "role": role,
        "type": token_type,
        "iat": now,
        "exp": now + expires_delta,
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def create_access_token(worker_id: int) -> str:
    return _create_token(
        str(worker_id),
        "access",
        timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
        role="worker",
    )


def create_refresh_token(worker_id: int) -> str:
    return _create_token(
        str(worker_id),
        "refresh",
        timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
        role="worker",
    )


def create_customer_access_token(customer_id: int) -> str:
    return _create_token(
        str(customer_id),
        "access",
        timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
        role="customer",
    )


def create_customer_refresh_token(customer_id: int) -> str:
    return _create_token(
        str(customer_id),
        "refresh",
        timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
        role="customer",
    )

def create_authority_access_token(society_id: int, role: str = "authority") -> str:
    return _create_token(str(society_id), "access", timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES), role=role)

def create_authority_refresh_token(society_id: int, role: str = "authority") -> str:
    return _create_token(str(society_id), "refresh", timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS), role=role)


def create_federation_access_token(user_id: int) -> str:
    return _create_token(str(user_id), "access", timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES), role="federation")


def create_federation_refresh_token(user_id: int) -> str:
    return _create_token(str(user_id), "refresh", timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS), role="federation")


def decode_token(
    token: str, expected_type: TokenType, expected_role: UserRole = "worker"
) -> int | None:
    """Return the user id, or None if the token is invalid/expired/wrong type/wrong role."""
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM],
        )
    except jwt.PyJWTError:
        return None

    if payload.get("type") != expected_type:
        return None

    token_role = payload.get("role", "worker")
    if token_role != expected_role:
        return None

    sub = payload.get("sub")
    if sub is None:
        return None
    try:
        return int(sub)
    except (TypeError, ValueError):
        return None
