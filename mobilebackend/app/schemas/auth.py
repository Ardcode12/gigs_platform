"""Auth request/response schemas."""

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.worker import WorkerOut


class LoginRequest(BaseModel):
    #: Worker code (e.g. "WM1042") or registered phone number — either works.
    identifier: str = Field(min_length=3, max_length=32)
    password: str = Field(min_length=1, max_length=128)


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class LoginResponse(TokenPair):
    worker: WorkerOut
    must_change_password: bool


class RefreshRequest(BaseModel):
    refresh_token: str


class ForgotPasswordRequest(BaseModel):
    identifier: str = Field(min_length=3, max_length=32)


class ForgotPasswordResponse(BaseModel):
    """Always reports success, so this endpoint can't be used to enumerate workers."""

    message: str
    masked_phone: str | None = None
    #: Populated only when DEV_MODE is on, so the flow is testable without SMS.
    dev_code: str | None = None


class ResetPasswordRequest(BaseModel):
    identifier: str = Field(min_length=3, max_length=32)
    code: str = Field(min_length=4, max_length=8)
    new_password: str = Field(min_length=6, max_length=128)


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(min_length=1, max_length=128)
    new_password: str = Field(min_length=6, max_length=128)


class MessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    message: str
