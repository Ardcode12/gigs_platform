"""Create a notification row and push the matching live event.

Every place that needs to tell a worker something goes through `notify`, so the
persistent feed (spec #12) and the WebSocket event can never drift apart.
"""

from typing import Any

from sqlalchemy.orm import Session

from app.models import Notification, NotificationType, WsEvent
from app.ws.manager import manager

#: Which live event accompanies each notification type.
_EVENT_FOR_TYPE: dict[NotificationType, WsEvent] = {
    NotificationType.NEW_JOB: WsEvent.NEW_JOB_REQUEST,
    NotificationType.CHAT: WsEvent.CHAT_MESSAGE,
    NotificationType.EXTRA_AMOUNT: WsEvent.EXTRA_AMOUNT_DECISION,
    NotificationType.PAYMENT: WsEvent.PAYMENT_UPDATE,
    NotificationType.JOB_UPDATE: WsEvent.JOB_UPDATE,
}


def notify(
    db: Session,
    worker_id: int,
    notification_type: NotificationType,
    title: str,
    body: str | None = None,
    data: dict[str, Any] | None = None,
    *,
    push: bool = True,
) -> Notification:
    """Persist a notification and (by default) push it live.

    The caller is responsible for committing; the row is flushed so its id is
    available for the pushed payload.
    """
    notification = Notification(
        worker_id=worker_id,
        type=notification_type,
        title=title,
        body=body,
        data=data or {},
    )
    db.add(notification)
    db.flush()

    if push:
        event = _EVENT_FOR_TYPE[notification_type]
        manager.push_threadsafe(
            worker_id,
            event.value,
            {
                "notification_id": notification.id,
                "title": title,
                "body": body,
                **(data or {}),
            },
        )

    return notification


def push_event(worker_id: int, event: WsEvent, payload: dict[str, Any]) -> None:
    """Push a live event with no notification row — for silent screen refreshes."""
    manager.push_threadsafe(worker_id, event.value, payload)
