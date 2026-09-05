"""In-job chat, and call requests that never reveal a phone number (spec #5)."""

from datetime import datetime

from sqlalchemy import (
    DateTime,
    Enum as SQLEnum,
    ForeignKey,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.enums import CallRequestStatus, MessageSender

message_sender_enum = SQLEnum(
    MessageSender,
    name="message_sender",
    values_callable=lambda e: [m.value for m in e],
)
call_status_enum = SQLEnum(
    CallRequestStatus,
    name="call_request_status",
    values_callable=lambda e: [m.value for m in e],
)


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id: Mapped[int] = mapped_column(primary_key=True)
    job_id: Mapped[int] = mapped_column(
        ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False, index=True
    )
    sender: Mapped[MessageSender] = mapped_column(message_sender_enum, nullable=False)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    sent_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False, index=True
    )
    read_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class CallRequest(Base):
    """A request for the customer to call back.

    Deliberately holds no phone number: the worker asks, the customer is notified,
    and a real deployment bridges the two through a masking provider.
    """

    __tablename__ = "call_requests"

    id: Mapped[int] = mapped_column(primary_key=True)
    job_id: Mapped[int] = mapped_column(
        ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False, index=True
    )
    requested_by: Mapped[MessageSender] = mapped_column(message_sender_enum, nullable=False)
    status: Mapped[CallRequestStatus] = mapped_column(
        call_status_enum, default=CallRequestStatus.PENDING, nullable=False
    )
    note: Mapped[str | None] = mapped_column(String(300))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
