"""Clear application rows and provision the federation development account.

This intentionally preserves schema and migration history. It is for local/manual
testing only and requires RESET_CONFIRM=WORKMAT in the environment.
"""

import os

from sqlalchemy import delete

from app.core.security import hash_password
from app.db.session import SessionLocal
from app.models import (
    CallRequest,
    ChatMessage,
    ChatMessageTranslation,
    Customer,
    ServiceCategory,
    ServiceSubcategory,
    ExtraAmountRequest,
    FederationUser,
    GpsRequest,
    Job,
    JobRejection,
    JobReport,
    JobService,
    JobStatusEvent,
    Notification,
    OtpVerification,
    PasswordReset,
    Payment,
    Rating,
    Society,
    SocietyComplaint,
    SocietyRate,
    WelfareEnrollment,
    Worker,
    WorkerAdvance,
)


MODELS = (
    ChatMessageTranslation,
    ChatMessage,
    CallRequest,
    JobReport,
    OtpVerification,
    PasswordReset,
    Notification,
    Payment,
    Rating,
    ExtraAmountRequest,
    JobRejection,
    JobStatusEvent,
    JobService,
    SocietyComplaint,
    WelfareEnrollment,
    WorkerAdvance,
    SocietyRate,
    GpsRequest,
    Job,
    Worker,
    Customer,
    Society,
    FederationUser,
    ServiceSubcategory,
    ServiceCategory,
)


def main() -> None:
    if os.getenv("RESET_CONFIRM") != "WORKMAT":
        raise SystemExit("Refusing reset. Set RESET_CONFIRM=WORKMAT to continue.")
    db = SessionLocal()
    try:
        for model in MODELS:
            db.execute(delete(model))
        db.add(
            FederationUser(
                email="federation@workmat.local",
                name="WORKMAT Federation Admin",
                password_hash=hash_password("Federation@123"),
            )
        )
        db.commit()
        print("Application data cleared.")
        print("Federation email: federation@workmat.local")
        print("Federation password: Federation@123")
    finally:
        db.close()


if __name__ == "__main__":
    main()
