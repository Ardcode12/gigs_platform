"""Customer backend schema additions.

Revision ID: 0002_customer_backend
Revises: 0001_initial
Create Date: 2026-09-05
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0002_customer_backend"
down_revision: Union[str, None] = "0001_initial"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    insp = sa.inspect(conn)

    # Customers table enhancements
    cust_cols = [c["name"] for c in insp.get_columns("customers")]
    if "email" not in cust_cols:
        op.add_column("customers", sa.Column("email", sa.String(length=255), nullable=True))
    if "password_hash" not in cust_cols:
        op.add_column("customers", sa.Column("password_hash", sa.String(length=255), nullable=True))
    if "is_active" not in cust_cols:
        op.add_column(
            "customers",
            sa.Column("is_active", sa.Boolean(), server_default="true", nullable=False),
        )
    if "must_change_password" not in cust_cols:
        op.add_column(
            "customers",
            sa.Column("must_change_password", sa.Boolean(), server_default="false", nullable=False),
        )
    if "saved_addresses" not in cust_cols:
        op.add_column(
            "customers",
            sa.Column("saved_addresses", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        )

    # Jobs table enhancements
    job_cols = [c["name"] for c in insp.get_columns("jobs")]
    if "otp_code" not in job_cols:
        op.add_column("jobs", sa.Column("otp_code", sa.String(length=10), nullable=True))

    # Notifications table enhancements
    notif_cols = [c["name"] for c in insp.get_columns("notifications")]
    op.alter_column("notifications", "worker_id", existing_type=sa.Integer(), nullable=True)
    if "customer_id" not in notif_cols:
        op.add_column("notifications", sa.Column("customer_id", sa.Integer(), nullable=True))
        op.create_foreign_key(
            "fk_notifications_customer_id",
            "notifications",
            "customers",
            ["customer_id"],
            ["id"],
            ondelete="CASCADE",
        )
        op.create_index("ix_notifications_customer_id", "notifications", ["customer_id"])

    # Password resets table enhancements
    pr_cols = [c["name"] for c in insp.get_columns("password_resets")]
    op.alter_column("password_resets", "worker_id", existing_type=sa.Integer(), nullable=True)
    if "customer_id" not in pr_cols:
        op.add_column("password_resets", sa.Column("customer_id", sa.Integer(), nullable=True))
        op.create_foreign_key(
            "fk_password_resets_customer_id",
            "password_resets",
            "customers",
            ["customer_id"],
            ["id"],
            ondelete="CASCADE",
        )
        op.create_index("ix_password_resets_customer_id", "password_resets", ["customer_id"])


def downgrade() -> None:
    pass
