"""Authority portal account and records.

Revision ID: 0004_authority_portal
Revises: 0003_signup_otp, 0003_chat_translation

This migration is intentionally not executed by the application. Apply it with
the project's normal Alembic deployment process before using the authority API.
"""
from typing import Sequence, Union
import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0004_authority_portal"
down_revision: Union[str, Sequence[str], None] = ("0003_signup_otp", "0003_chat_translation")
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    inspector = sa.inspect(op.get_bind())
    society_columns = {column["name"] for column in inspector.get_columns("societies")}
    worker_columns = {column["name"] for column in inspector.get_columns("workers")}
    for name, column in (
        ("society_code", sa.Column("society_code", sa.String(64), nullable=True)),
        ("password_hash", sa.Column("password_hash", sa.String(255), nullable=True)),
        ("is_active", sa.Column("is_active", sa.Boolean(), server_default="true", nullable=False)),
    ):
        if name not in society_columns:
            op.add_column("societies", column)
    if "society_code" not in society_columns:
        op.create_index("ix_societies_society_code", "societies", ["society_code"], unique=True)
    job_columns = {column["name"] for column in inspector.get_columns("jobs")}
    if "society_id" not in job_columns:
        op.add_column("jobs", sa.Column("society_id", sa.Integer(), sa.ForeignKey("societies.id", ondelete="SET NULL"), nullable=True))
    for name, column in (
        ("kyc_status", sa.Column("kyc_status", sa.String(30), server_default="pending", nullable=False)),
        ("kyc_method", sa.Column("kyc_method", sa.String(40), nullable=True)),
        ("kyc_refs", sa.Column("kyc_refs", postgresql.JSONB(), server_default="[]", nullable=False)),
        ("kyc_reason", sa.Column("kyc_reason", sa.String(300), nullable=True)),
        ("authority_data", sa.Column("authority_data", postgresql.JSONB(), server_default="{}", nullable=False)),
    ):
        if name not in worker_columns:
            op.add_column("workers", column)
    for table, columns in {
        "federation_users": [
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("email", sa.String(255), nullable=False, unique=True),
            sa.Column("name", sa.String(150), nullable=False),
            sa.Column("password_hash", sa.String(255), nullable=False),
            sa.Column("is_active", sa.Boolean(), server_default="true", nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        ],
        "society_rates": [
            sa.Column("id", sa.Integer(), primary_key=True), sa.Column("society_id", sa.Integer(), sa.ForeignKey("societies.id", ondelete="CASCADE"), nullable=False),
            sa.Column("category", sa.String(100), nullable=False), sa.Column("base_rate", sa.Numeric(10, 2), server_default="0", nullable=False),
            sa.Column("hourly_rate", sa.Numeric(10, 2), server_default="0", nullable=False), sa.Column("daily_rate", sa.Numeric(10, 2), server_default="0", nullable=False),
            sa.Column("data", postgresql.JSONB(), server_default="{}", nullable=False), sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False)],
        "welfare_enrollments": [sa.Column("id", sa.Integer(), primary_key=True), sa.Column("society_id", sa.Integer(), sa.ForeignKey("societies.id", ondelete="CASCADE"), nullable=False), sa.Column("worker_id", sa.Integer(), sa.ForeignKey("workers.id", ondelete="CASCADE"), nullable=False), sa.Column("scheme_id", sa.String(100), nullable=False), sa.Column("data", postgresql.JSONB(), server_default="{}", nullable=False), sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False)],
        "worker_advances": [sa.Column("id", sa.Integer(), primary_key=True), sa.Column("society_id", sa.Integer(), sa.ForeignKey("societies.id", ondelete="CASCADE"), nullable=False), sa.Column("worker_id", sa.Integer(), sa.ForeignKey("workers.id", ondelete="CASCADE"), nullable=False), sa.Column("amount", sa.Numeric(10, 2), nullable=False), sa.Column("reason", sa.Text(), nullable=False), sa.Column("status", sa.String(30), server_default="pending", nullable=False), sa.Column("data", postgresql.JSONB(), server_default="{}", nullable=False), sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False)],
        "society_complaints": [sa.Column("id", sa.Integer(), primary_key=True), sa.Column("society_id", sa.Integer(), sa.ForeignKey("societies.id", ondelete="CASCADE"), nullable=False), sa.Column("job_id", sa.Integer(), sa.ForeignKey("jobs.id", ondelete="SET NULL")), sa.Column("status", sa.String(30), server_default="open", nullable=False), sa.Column("title", sa.String(200), nullable=False), sa.Column("description", sa.Text(), nullable=False), sa.Column("responses", postgresql.JSONB(), server_default="[]", nullable=False), sa.Column("data", postgresql.JSONB(), server_default="{}", nullable=False), sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False)],
        "gps_requests": [sa.Column("id", sa.Integer(), primary_key=True), sa.Column("society_id", sa.Integer(), sa.ForeignKey("societies.id", ondelete="CASCADE"), nullable=False), sa.Column("status", sa.String(30), server_default="requested", nullable=False), sa.Column("data", postgresql.JSONB(), server_default="{}", nullable=False), sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False)],
    }.items():
        if table not in inspector.get_table_names():
            op.create_table(table, *columns)
            if any(column.name == "society_id" for column in columns):
                op.create_index(f"ix_{table}_society_id", table, ["society_id"])

def downgrade() -> None:
    for table in ("federation_users", "gps_requests", "society_complaints", "worker_advances", "welfare_enrollments", "society_rates"):
        op.drop_table(table)
    op.drop_column("jobs", "society_id")
