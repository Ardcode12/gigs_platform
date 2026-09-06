"""Payloads for the authority portal; extra fields support the portal's profile data."""
from typing import Any
from pydantic import BaseModel, ConfigDict, Field

class AuthorityPayload(BaseModel):
    model_config = ConfigDict(extra="allow")

    def get(self, key: str, default: Any = None) -> Any:
        return self.model_extra.get(key, default)

class StatusPayload(AuthorityPayload):
    status: str

class IdPayload(AuthorityPayload):
    workerId: int | None = None

class BulkAssignment(AuthorityPayload):
    workerIds: list[int] = Field(default_factory=list)
    leadId: int | None = None

class RatePayload(AuthorityPayload):
    baseRate: float = 0
    hourlyRate: float = 0
    dailyRate: float = 0

class ComplaintPayload(AuthorityPayload):
    title: str = "Complaint"
    description: str = ""

class TextPayload(AuthorityPayload):
    response: str | None = None
    resolution: str | None = None
    reason: str | None = None


class FederationLoginPayload(BaseModel):
    email: str
    password: str


class SocietyCreatePayload(BaseModel):
    name: str
    city: str | None = None
    societyCode: str
    password: str
