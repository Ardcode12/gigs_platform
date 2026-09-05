"""Customer chat and communication endpoints."""

import logging
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, status as http_status
from sqlalchemy import select

from app.core.deps import CurrentCustomer, DbSession
from app.models import (
    CallRequest,
    CallRequestStatus,
    ChatMessage,
    Job,
    MessageSender,
    NotificationType,
)
from app.schemas.auth import MessageResponse
from app.schemas.chat import ChatMessageOut
from app.schemas.customer import CustomerCallRequestResponse, CustomerChatMessageCreate
from app.services.notify import notify
from app.services.serialize import serialize_job_detail

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/customer/chat", tags=["customer-chat"])


@router.get("/{job_id}", response_model=list[ChatMessageOut])
def get_chat_messages(
    job_id: int, customer: CurrentCustomer, db: DbSession
) -> list[ChatMessageOut]:
    """Retrieve chat history for a job and mark worker messages as read."""
    job = db.get(Job, job_id)
    if job is None or job.customer_id != customer.id:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND, detail="Job not found"
        )

    now = datetime.now(timezone.utc)
    unread = db.scalars(
        select(ChatMessage).where(
            ChatMessage.job_id == job.id,
            ChatMessage.sender == MessageSender.WORKER,
            ChatMessage.read_at.is_(None),
        )
    ).all()
    for msg in unread:
        msg.read_at = now
    if unread:
        db.commit()

    messages = db.scalars(
        select(ChatMessage)
        .where(ChatMessage.job_id == job.id)
        .order_by(ChatMessage.sent_at.asc())
    ).all()
    return [ChatMessageOut.model_validate(m) for m in messages]


@router.post(
    "/{job_id}",
    response_model=ChatMessageOut,
    status_code=http_status.HTTP_201_CREATED,
)
def send_chat_message(
    job_id: int,
    payload: CustomerChatMessageCreate,
    customer: CurrentCustomer,
    db: DbSession,
) -> ChatMessageOut:
    """Send a message from customer to worker."""
    job = db.get(Job, job_id)
    if job is None or job.customer_id != customer.id:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND, detail="Job not found"
        )

    message = ChatMessage(job_id=job.id, sender=MessageSender.CUSTOMER, text=payload.text)
    db.add(message)
    db.flush()

    if job.worker_id is not None:
        notify(
            db,
            job.worker_id,
            NotificationType.CHAT,
            title=f"Message from {customer.name}",
            body=payload.text[:120],
            data={"job_id": job.id, "message_id": message.id},
        )

    db.commit()
    db.refresh(message)
    return ChatMessageOut.model_validate(message)


@router.post("/{job_id}/call-request/decide", response_model=MessageResponse)
def decide_call_request(
    job_id: int,
    payload: CustomerCallRequestResponse,
    customer: CurrentCustomer,
    db: DbSession,
) -> MessageResponse:
    """Respond to worker's call request."""
    job = db.get(Job, job_id)
    if job is None or job.customer_id != customer.id:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND, detail="Job not found"
        )

    request = db.scalars(
        select(CallRequest)
        .where(
            CallRequest.job_id == job.id,
            CallRequest.status == CallRequestStatus.PENDING,
        )
        .order_by(CallRequest.created_at.desc())
    ).first()
    if request is None:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail="No pending call request for this job",
        )

    request.status = (
        CallRequestStatus.COMPLETED if payload.approve else CallRequestStatus.DECLINED
    )
    db.commit()
    return MessageResponse(message=f"Call request {request.status.value}")
