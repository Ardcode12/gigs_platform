"""Add otp_verifications table for signup OTP verification.

Revision ID: 0003_signup_otp
Revises: 0002_customer_backend
Create Date: 2026-09-05
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0003_signup_otp"
down_revision: Union[str, None] = "0002_customer_backend"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    insp = sa.inspect(conn)

    tables = insp.get_table_names()
    if "otp_verifications" not in tables:
        op.create_table(
            "otp_verifications",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("phone", sa.String(length=20), nullable=False),
            sa.Column("code_hash", sa.String(length=255), nullable=False),
            sa.Column("purpose", sa.String(length=50), server_default="signup", nullable=False),
            sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("used_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("attempts", sa.Integer(), server_default="0", nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        )
        op.create_index("ix_otp_verifications_phone", "otp_verifications", ["phone"])


def downgrade() -> None:
    conn = op.get_bind()
    insp = sa.inspect(conn)
    if "otp_verifications" in insp.get_table_names():
        op.drop_table("otp_verifications")
