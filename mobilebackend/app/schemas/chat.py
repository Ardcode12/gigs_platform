"""Chat and call-request schemas."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import CallRequestStatus, MessageSender


class ChatMessageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    job_id: int
    sender: MessageSender
    text: str
    sent_at: datetime
    read_at: datetime | None


class ChatMessageCreate(BaseModel):
    text: str = Field(min_length=1, max_length=2000)


class CallRequestOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    job_id: int
    status: CallRequestStatus
    note: str | None
    created_at: datetime


class CallRequestCreate(BaseModel):
    note: str | None = Field(default=None, max_length=300)
