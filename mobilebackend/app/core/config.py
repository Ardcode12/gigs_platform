"""Application settings, loaded from the environment / .env file."""

from functools import lru_cache
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Database
    DATABASE_URL: str

    # Auth
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # Society admin API
    ADMIN_API_KEY: str

    # Dev behaviour
    DEV_MODE: bool = False

    # Twilio Verify V2 OTP
    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_VERIFY_SERVICE_SID: str = ""
    OTP_EXPIRY_MINUTES: int = 10
    OTP_RESEND_COOLDOWN_SECONDS: int = 30

    # CORS
    CORS_ORIGINS: str = "*"

    # Geo
    AVG_SPEED_KMPH: float = 22.0

    # Local timezone used to decide what "today", "this week" and "this month" mean
    # in the earnings breakdown. Timestamps are stored in UTC regardless.
    TIMEZONE: str = "Asia/Kolkata"

    # Chat translation. "none" keeps translation disabled until a provider is running;
    # "local" talks to the IndicTrans2 sidecar in mobilebackend/translator/.
    TRANSLATION_PROVIDER: str = "none"
    LOCAL_TRANSLATE_URL: str = "http://127.0.0.1:8001/translate"
    # Generous on purpose: the sidecar's first request loads a ~1 GB model from disk.
    LOCAL_TRANSLATE_TIMEOUT_SECONDS: float = 30.0

    @property
    def cors_origin_list(self) -> list[str]:
        if self.CORS_ORIGINS.strip() == "*":
            return ["*"]
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    @property
    def tz(self) -> ZoneInfo:
        try:
            return ZoneInfo(self.TIMEZONE)
        except ZoneInfoNotFoundError:
            return ZoneInfo("UTC")


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
