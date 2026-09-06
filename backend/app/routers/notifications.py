"""The in-app notification feed (spec #12).

Rows are written by `services/notify.py`, which pushes the matching WebSocket event
at the same time — so this endpoint is the catch-up view for whatever the worker
missed while the app was closed.
"""

from fastapi import APIRouter, HTTPException, Query, status as http_status
from sqlalchemy import func, select, update

from app.core.deps import CurrentWorker, DbSession
from app.models import Notification, NotificationType
from app.schemas.auth import MessageResponse
from app.schemas.misc import NotificationOut, UnreadCountOut

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


@router.get("", response_model=list[NotificationOut])
def list_notifications(
    worker: CurrentWorker,
    db: DbSession,
    unread_only: bool = Query(default=False),
    notification_type: NotificationType | None = Query(default=None, alias="type"),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
) -> list[NotificationOut]:
    stmt = select(Notification).where(Notification.worker_id == worker.id)
    if unread_only:
        stmt = stmt.where(Notification.is_read.is_(False))
    if notification_type is not None:
        stmt = stmt.where(Notification.type == notification_type)

    rows = db.scalars(
        stmt.order_by(Notification.created_at.desc()).limit(limit).offset(offset)
    ).all()
    return [NotificationOut.model_validate(n) for n in rows]


@router.get("/unread-count", response_model=UnreadCountOut)
def unread_count(worker: CurrentWorker, db: DbSession) -> UnreadCountOut:
    """Feeds the badge on the home-screen bell."""
    count = db.scalar(
        select(func.count())
        .select_from(Notification)
        .where(Notification.worker_id == worker.id, Notification.is_read.is_(False))
    )
    return UnreadCountOut(unread=count or 0)


@router.post("/{notification_id}/read", response_model=NotificationOut)
def mark_read(notification_id: int, worker: CurrentWorker, db: DbSession) -> NotificationOut:
    notification = db.get(Notification, notification_id)
    if notification is None or notification.worker_id != worker.id:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND, detail="Notification not found"
        )

    notification.is_read = True
    db.commit()
    db.refresh(notification)
    return NotificationOut.model_validate(notification)


@router.post("/read-all", response_model=MessageResponse)
def mark_all_read(worker: CurrentWorker, db: DbSession) -> MessageResponse:
    result = db.execute(
        update(Notification)
        .where(Notification.worker_id == worker.id, Notification.is_read.is_(False))
        .values(is_read=True)
    )
    db.commit()
    return MessageResponse(message=f"{result.rowcount or 0} notifications marked read")
