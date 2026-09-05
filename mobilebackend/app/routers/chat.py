"""In-job chat and call requests (spec #5).

The whole point of this module is that a worker can reach the customer without
either side learning the other's number. Messages go through the server, and
"call me" is a *request* — `CallRequest` has no phone column, and no response
here or anywhere else carries one.

Chat is available on a job that is still only a request, because the spec calls
for communicating *before* booking.
"""

from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Query, status as http_status
from sqlalchemy import select, update

from app.core.deps import CurrentWorker, DbSession
from app.models import (
    CallRequest,
    CallRequestStatus,
    ChatMessage,
    JobStatus,
    MessageSender,
    WsEvent,
)
from app.schemas.chat import (
    CallRequestCreate,
    CallRequestOut,
    ChatMessageCreate,
    ChatMessageOut,
)
from app.services.access import get_job_for_worker
from app.services.notify import push_event

router = APIRouter(prefix="/api/jobs", tags=["chat"])

#: Once a job is finished or dead, the thread is history — readable, not writable.
_CLOSED_STATUSES = (JobStatus.COMPLETED, JobStatus.REJECTED, JobStatus.CANCELLED)


@router.get("/{job_id}/messages", response_model=list[ChatMessageOut])
def list_messages(
    job_id: int,
    worker: CurrentWorker,
    db: DbSession,
    limit: int = Query(default=200, ge=1, le=500),
) -> list[ChatMessageOut]:
    """The thread, oldest first, marking the customer's messages read.

    Fetching the thread *is* reading it — that is what the worker just did by
    opening the screen — so there is no separate mark-read call to forget.
    """
    job = get_job_for_worker(db, worker, job_id)

    rows = db.scalars(
        select(ChatMessage)
        .where(ChatMessage.job_id == job.id)
        .order_by(ChatMessage.sent_at.desc())
        .limit(limit)
    ).all()

    db.execute(
        update(ChatMessage)
        .where(
            ChatMessage.job_id == job.id,
            ChatMessage.sender == MessageSender.CUSTOMER,
            ChatMessage.read_at.is_(None),
        )
        .values(read_at=datetime.now(timezone.utc))
    )
    db.commit()

    # Reversed so the client gets chronological order without a second sort.
    return [ChatMessageOut.model_validate(m) for m in reversed(rows)]


@router.post(
    "/{job_id}/messages",
    response_model=ChatMessageOut,
    status_code=http_status.HTTP_201_CREATED,
)
def send_message(
    job_id: int, payload: ChatMessageCreate, worker: CurrentWorker, db: DbSession
) -> ChatMessageOut:
    job = get_job_for_worker(db, worker, job_id)
    if job.status in _CLOSED_STATUSES:
        raise HTTPException(
            status_code=http_status.HTTP_409_CONFLICT,
            detail="This job is closed — you can read the chat but not add to it",
        )

    message = ChatMessage(
        job_id=job.id,
        sender=MessageSender.WORKER,
        text=payload.text.strip(),
    )
    db.add(message)
    db.commit()
    db.refresh(message)

    # No notification row: the worker wrote this, so telling them about it would be
    # noise. The event exists only so their other signed-in devices catch up.
    push_event(
        worker.id,
        WsEvent.CHAT_MESSAGE,
        {"job_id": job.id, "message_id": message.id, "sender": MessageSender.WORKER.value},
    )
    return ChatMessageOut.model_validate(message)


@router.post(
    "/{job_id}/call-request",
    response_model=CallRequestOut,
    status_code=http_status.HTTP_201_CREATED,
)
def request_call(
    job_id: int, payload: CallRequestCreate, worker: CurrentWorker, db: DbSession
) -> CallRequestOut:
    """Ask the customer to call back.

    Nothing here returns or stores a number. In a real deployment the customer's
    app rings them and a masking provider bridges the call.
    """
    job = get_job_for_worker(db, worker, job_id)
    if job.status in _CLOSED_STATUSES:
        raise HTTPException(
            status_code=http_status.HTTP_409_CONFLICT,
            detail="This job is closed",
        )

    pending = db.scalars(
        select(CallRequest).where(
            CallRequest.job_id == job.id,
            CallRequest.requested_by == MessageSender.WORKER,
            CallRequest.status == CallRequestStatus.PENDING,
        )
    ).first()
    if pending is not None:
        # Not an error: the worker tapped twice, and the outstanding request stands.
        return CallRequestOut.model_validate(pending)

    call_request = CallRequest(
        job_id=job.id,
        requested_by=MessageSender.WORKER,
        note=payload.note,
    )
    db.add(call_request)
    db.commit()
    db.refresh(call_request)

    return CallRequestOut.model_validate(call_request)


@router.get("/{job_id}/call-requests", response_model=list[CallRequestOut])
def list_call_requests(job_id: int, worker: CurrentWorker, db: DbSession) -> list[CallRequestOut]:
    """So the chat screen can show "call requested — waiting for the customer"."""
    job = get_job_for_worker(db, worker, job_id)
    rows = db.scalars(
        select(CallRequest)
        .where(CallRequest.job_id == job.id)
        .order_by(CallRequest.created_at.desc())
    ).all()
    return [CallRequestOut.model_validate(r) for r in rows]
