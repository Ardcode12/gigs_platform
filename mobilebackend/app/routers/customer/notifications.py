"""Customer notifications endpoints."""

import logging
from typing import Any

from fastapi import APIRouter, HTTPException, Query, status as http_status
from pydantic import BaseModel
from sqlalchemy import func, select

from app.core.deps import CurrentCustomer, DbSession
from app.models import Notification, NotificationType
from app.schemas.auth import MessageResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/customer/notifications", tags=["customer-notifications"])


class CustomerNotificationOut(BaseModel):
    id: int
    type: NotificationType
    title: str
    body: str | None = None
    data: dict[str, Any]
    is_read: bool
    created_at: Any

    class Config:
        from_attributes = True


class CustomerNotificationsResponse(BaseModel):
    items: list[CustomerNotificationOut]
    unread_count: int


@router.get("", response_model=CustomerNotificationsResponse)
def list_notifications(
    customer: CurrentCustomer,
    db: DbSession,
    unread_only: bool = Query(default=False),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
) -> CustomerNotificationsResponse:
    stmt = select(Notification).where(Notification.customer_id == customer.id)
    if unread_only:
        stmt = stmt.where(Notification.is_read.is_(False))

    items = db.scalars(
        stmt.order_by(Notification.created_at.desc()).limit(limit).offset(offset)
    ).all()

    unread_count = db.scalar(
        select(func.count())
        .select_from(Notification)
        .where(Notification.customer_id == customer.id, Notification.is_read.is_(False))
    ) or 0

    return CustomerNotificationsResponse(
        items=[CustomerNotificationOut.model_validate(i) for i in items],
        unread_count=unread_count,
    )


@router.post("/{notification_id}/read", response_model=MessageResponse)
def mark_read(
    notification_id: int, customer: CurrentCustomer, db: DbSession
) -> MessageResponse:
    notification = db.get(Notification, notification_id)
    if notification is None or notification.customer_id != customer.id:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND, detail="Notification not found"
        )

    notification.is_read = True
    db.commit()
    return MessageResponse(message="Notification marked read")


@router.post("/read-all", response_model=MessageResponse)
def mark_all_read(customer: CurrentCustomer, db: DbSession) -> MessageResponse:
    unread = db.scalars(
        select(Notification).where(
            Notification.customer_id == customer.id, Notification.is_read.is_(False)
        )
    ).all()
    for item in unread:
        item.is_read = True
    db.commit()
    return MessageResponse(message="All notifications marked read")
