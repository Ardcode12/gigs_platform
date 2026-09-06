"""Shared FastAPI dependencies."""

from typing import Annotated

from fastapi import Depends, Header, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import decode_token
from app.db.session import get_db
from app.models import Customer, FederationUser, Society, Worker

bearer_scheme = HTTPBearer(auto_error=False)

DbSession = Annotated[Session, Depends(get_db)]


def get_current_worker(
    db: DbSession,
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
) -> Worker:
    unauthorized = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Not authenticated",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if credentials is None:
        raise unauthorized

    worker_id = decode_token(credentials.credentials, "access", expected_role="worker")
    if worker_id is None:
        raise unauthorized

    worker = db.get(Worker, worker_id)
    if worker is None:
        raise unauthorized
    return worker


CurrentWorker = Annotated[Worker, Depends(get_current_worker)]


def get_current_customer(
    db: DbSession,
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
) -> Customer:
    unauthorized = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Not authenticated",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if credentials is None:
        raise unauthorized

    customer_id = decode_token(credentials.credentials, "access", expected_role="customer")
    if customer_id is None:
        raise unauthorized

    customer = db.get(Customer, customer_id)
    if customer is None or not customer.is_active:
        raise unauthorized
    return customer


CurrentCustomer = Annotated[Customer, Depends(get_current_customer)]

def get_current_authority(
    db: DbSession,
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
) -> Society:
    unauthorized = HTTPException(status_code=401, detail="Not authenticated", headers={"WWW-Authenticate": "Bearer"})
    if credentials is None:
        raise unauthorized
    society_id = decode_token(credentials.credentials, "access", expected_role="authority")
    society = db.get(Society, society_id) if society_id is not None else None
    if society is None or not society.is_active:
        raise unauthorized
    return society

CurrentAuthority = Annotated[Society, Depends(get_current_authority)]


def get_current_federation(
    db: DbSession,
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
) -> FederationUser:
    unauthorized = HTTPException(status_code=401, detail="Not authenticated", headers={"WWW-Authenticate": "Bearer"})
    if credentials is None:
        raise unauthorized
    user_id = decode_token(credentials.credentials, "access", expected_role="federation")
    user = db.get(FederationUser, user_id) if user_id is not None else None
    if user is None or not user.is_active:
        raise unauthorized
    return user


CurrentFederation = Annotated[FederationUser, Depends(get_current_federation)]


def require_admin_key(x_admin_key: Annotated[str | None, Header()] = None) -> None:
    """Guard the society-facing routes with a shared secret.

    Deliberately simple: there is no society UI, and the alternative (a second
    account system) would be more surface area than this earns.
    """
    if not x_admin_key or x_admin_key != settings.ADMIN_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid or missing X-Admin-Key",
        )


AdminGuard = Depends(require_admin_key)
