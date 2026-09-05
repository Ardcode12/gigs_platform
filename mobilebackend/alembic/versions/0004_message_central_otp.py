"""Store Message Central verification IDs instead of local OTPs."""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0004_message_central_otp"
down_revision: Union[str, None] = "0003_signup_otp"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)

    otp_columns = {column["name"]: column for column in inspector.get_columns("otp_verifications")}
    if "verification_id" not in otp_columns:
        op.add_column(
            "otp_verifications",
            sa.Column("verification_id", sa.String(length=255), nullable=True),
        )
        op.create_index(
            "ix_otp_verifications_verification_id",
            "otp_verifications",
            ["verification_id"],
        )
    if otp_columns.get("code_hash", {}).get("nullable") is False:
        op.alter_column(
            "otp_verifications",
            "code_hash",
            existing_type=sa.String(length=255),
            nullable=True,
        )

    reset_columns = {column["name"]: column for column in inspector.get_columns("password_resets")}
    if "verification_id" not in reset_columns:
        op.add_column(
            "password_resets",
            sa.Column("verification_id", sa.String(length=255), nullable=True),
        )
        op.create_index(
            "ix_password_resets_verification_id",
            "password_resets",
            ["verification_id"],
        )
    if reset_columns.get("code_hash", {}).get("nullable") is False:
        op.alter_column(
            "password_resets",
            "code_hash",
            existing_type=sa.String(length=255),
            nullable=True,
        )


def downgrade() -> None:
    op.drop_index("ix_password_resets_verification_id", table_name="password_resets")
    op.drop_column("password_resets", "verification_id")
    op.drop_index("ix_otp_verifications_verification_id", table_name="otp_verifications")
    op.drop_column("otp_verifications", "verification_id")
