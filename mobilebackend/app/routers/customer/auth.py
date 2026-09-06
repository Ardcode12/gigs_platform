"""Customer authentication and profile endpoints."""

import logging
import uuid

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import func, or_, select

from app.core.deps import CurrentCustomer, DbSession
from app.core.security import (
    create_customer_access_token,
    create_customer_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.models import Customer
from app.schemas.auth import (
    ChangePasswordRequest,
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    MessageResponse,
    RefreshRequest,
    ResetPasswordRequest,
    TokenPair,
)
from app.schemas.customer import (
    CustomerLoginRequest,
    CustomerLoginResponse,
    CustomerOut,
    CustomerProfileUpdate,
    CustomerSignupRequest,
    SaveAddressRequest,
    SavedAddressItem,
    SendSignupOtpRequest,
    SendSignupOtpResponse,
)
from app.services.otp import (
    create_customer_reset_code,
    create_signup_otp,
    expose_code,
    mask_phone,
    verify_customer_reset_code,
    verify_signup_otp,
)
from app.services.serialize import serialize_customer

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/customer/auth", tags=["customer-auth"])


def _find_customer(db: DbSession, identifier: str) -> Customer | None:
    raw = identifier.strip()
    digits = "".join(c for c in raw if c.isdigit())

    stmt = select(Customer).where(
        or_(
            func.lower(Customer.email) == raw.lower(),
            Customer.phone == raw,
        )
    )
    customer = db.scalars(stmt).first()
    if customer is not None:
        return customer

    if len(digits) >= 10:
        candidates = db.scalars(
            select(Customer).where(Customer.phone.like(f"%{digits[-10:]}"))
        ).all()
        if len(candidates) == 1:
            return candidates[0]
    return None


@router.post("/send-signup-otp", response_model=SendSignupOtpResponse)
def send_signup_otp(payload: SendSignupOtpRequest, db: DbSession) -> SendSignupOtpResponse:
    existing_phone = db.scalars(select(Customer).where(Customer.phone == payload.phone)).first()
    if existing_phone is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A customer with this phone number already exists",
        )

    if payload.email:
        existing_email = db.scalars(
            select(Customer).where(func.lower(Customer.email) == payload.email.lower())
        ).first()
        if existing_email is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A customer with this email address already exists",
            )

    code = create_signup_otp(db, payload.phone)
    db.commit()

    return SendSignupOtpResponse(
        message=f"Verification code sent to {mask_phone(payload.phone)}",
        masked_phone=mask_phone(payload.phone),
        dev_code=expose_code(code),
    )


@router.post("/signup", response_model=CustomerLoginResponse, status_code=status.HTTP_201_CREATED)
def signup(payload: CustomerSignupRequest, db: DbSession) -> CustomerLoginResponse:
    existing_phone = db.scalars(select(Customer).where(Customer.phone == payload.phone)).first()
    if existing_phone is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A customer with this phone number already exists",
        )

    if payload.email:
        existing_email = db.scalars(
            select(Customer).where(func.lower(Customer.email) == payload.email.lower())
        ).first()
        if existing_email is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A customer with this email address already exists",
            )

    ok, reason = verify_signup_otp(db, payload.phone, payload.otp)
    if not ok:
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=reason,
        )

    customer = Customer(
        name=payload.name,
        phone=payload.phone,
        email=payload.email,
        password_hash=hash_password(payload.password),
        city=payload.city,
        saved_addresses=[],
    )
    db.add(customer)
    db.commit()
    db.refresh(customer)

    return CustomerLoginResponse(
        access_token=create_customer_access_token(customer.id),
        refresh_token=create_customer_refresh_token(customer.id),
        customer=serialize_customer(customer),
    )


@router.post("/login", response_model=CustomerLoginResponse)
def login(payload: CustomerLoginRequest, db: DbSession) -> CustomerLoginResponse:
    customer = _find_customer(db, payload.identifier)

    if (
        customer is None
        or customer.password_hash is None
        or not verify_password(payload.password, customer.password_hash)
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect phone/email or password",
        )

    if not customer.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated. Please contact support.",
        )

    return CustomerLoginResponse(
        access_token=create_customer_access_token(customer.id),
        refresh_token=create_customer_refresh_token(customer.id),
        customer=serialize_customer(customer),
    )


@router.post("/refresh", response_model=TokenPair)
def refresh(payload: RefreshRequest, db: DbSession) -> TokenPair:
    customer_id = decode_token(payload.refresh_token, "refresh", expected_role="customer")
    if customer_id is None or db.get(Customer, customer_id) is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )
    return TokenPair(
        access_token=create_customer_access_token(customer_id),
        refresh_token=create_customer_refresh_token(customer_id),
    )


@router.get("/me", response_model=CustomerOut)
def me(customer: CurrentCustomer) -> CustomerOut:
    return serialize_customer(customer)


@router.patch("/me", response_model=CustomerOut)
def update_profile(payload: CustomerProfileUpdate, customer: CurrentCustomer, db: DbSession) -> CustomerOut:
    if payload.name is not None:
        customer.name = payload.name
    if payload.email is not None:
        existing = db.scalars(
            select(Customer).where(
                func.lower(Customer.email) == payload.email.lower(), Customer.id != customer.id
            )
        ).first()
        if existing is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This email address is already in use",
            )
        customer.email = payload.email
    if payload.city is not None:
        customer.city = payload.city
    if payload.photo_url is not None:
        customer.photo_url = payload.photo_url

    db.commit()
    db.refresh(customer)
    return serialize_customer(customer)


@router.post("/addresses", response_model=CustomerOut)
def add_saved_address(payload: SaveAddressRequest, customer: CurrentCustomer, db: DbSession) -> CustomerOut:
    addresses = customer.saved_addresses if isinstance(customer.saved_addresses, list) else []

    address_id = str(uuid.uuid4())[:8]
    new_item = SavedAddressItem(
        id=address_id,
        title=payload.title,
        address=payload.address,
        landmark=payload.landmark,
        lat=payload.lat,
        lng=payload.lng,
    )
    addresses.append(new_item.model_dump())
    customer.saved_addresses = addresses

    db.commit()
    db.refresh(customer)
    return serialize_customer(customer)


@router.delete("/addresses/{address_id}", response_model=CustomerOut)
def delete_saved_address(address_id: str, customer: CurrentCustomer, db: DbSession) -> CustomerOut:
    addresses = customer.saved_addresses if isinstance(customer.saved_addresses, list) else []
    filtered = [a for a in addresses if isinstance(a, dict) and a.get("id") != address_id]

    customer.saved_addresses = filtered
    db.commit()
    db.refresh(customer)
    return serialize_customer(customer)


@router.post("/forgot-password", response_model=ForgotPasswordResponse)
def forgot_password(payload: ForgotPasswordRequest, db: DbSession) -> ForgotPasswordResponse:
    customer = _find_customer(db, payload.identifier)

    if customer is None:
        return ForgotPasswordResponse(
            message="If that account is registered, a reset code has been sent to the phone number on file."
        )

    code = create_customer_reset_code(db, customer)
    db.commit()

    return ForgotPasswordResponse(
        message="If that account is registered, a reset code has been sent to the phone number on file.",
        masked_phone=mask_phone(customer.phone),
        dev_code=expose_code(code),
    )


@router.post("/reset-password", response_model=MessageResponse)
def reset_password(payload: ResetPasswordRequest, db: DbSession) -> MessageResponse:
    customer = _find_customer(db, payload.identifier)
    if customer is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid code. Please request a new one.",
        )

    ok, reason = verify_customer_reset_code(db, customer, payload.code)
    if not ok:
        db.commit()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=reason)

    customer.password_hash = hash_password(payload.new_password)
    customer.must_change_password = False
    db.commit()

    return MessageResponse(message="Password updated. You can now log in.")


@router.post("/change-password", response_model=MessageResponse)
def change_password(
    payload: ChangePasswordRequest, customer: CurrentCustomer, db: DbSession
) -> MessageResponse:
    if not customer.password_hash or not verify_password(payload.current_password, customer.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect",
        )
    if payload.current_password == payload.new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be different from the current one",
        )

    customer.password_hash = hash_password(payload.new_password)
    customer.must_change_password = False
    db.commit()

    return MessageResponse(message="Password changed")


@router.post("/logout", response_model=MessageResponse)
def customer_logout() -> MessageResponse:
    """Drop customer session."""
    return MessageResponse(message="Logged out")
