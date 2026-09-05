"""Add job arrival/completion OTPs, cash verification, and reports.

Revision ID: 0002_job_verification
Revises: 0001_initial
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0002_job_verification"
down_revision: Union[str, None] = "0001_initial"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("jobs", sa.Column("arrival_otp_hash", sa.String(255), nullable=True))
    op.add_column("jobs", sa.Column("arrival_otp_expires_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("jobs", sa.Column("arrival_otp_attempts", sa.Integer(), server_default="0", nullable=False))
    op.add_column("jobs", sa.Column("arrival_verified_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("jobs", sa.Column("completion_otp_hash", sa.String(255), nullable=True))
    op.add_column("jobs", sa.Column("completion_otp_expires_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("jobs", sa.Column("completion_otp_attempts", sa.Integer(), server_default="0", nullable=False))
    op.add_column("jobs", sa.Column("completion_verified_at", sa.DateTime(timezone=True), nullable=True))

    payment_method = sa.Enum("digital", "cash", name="payment_method")
    payment_method.create(op.get_bind(), checkfirst=True)
    op.add_column("payments", sa.Column("payment_method", payment_method, server_default="digital", nullable=False))
    op.add_column("payments", sa.Column("cash_otp_hash", sa.String(255), nullable=True))
    op.add_column("payments", sa.Column("cash_otp_expires_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("payments", sa.Column("cash_otp_attempts", sa.Integer(), server_default="0", nullable=False))
    op.add_column("payments", sa.Column("cash_verified_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("payments", sa.Column("digital_transaction_id", sa.String(255), nullable=True))

    reporter_type = sa.Enum("worker", "customer", name="reporter_type")
    report_status = sa.Enum("open", "reviewing", "resolved", "rejected", name="report_status")
    reporter_type.create(op.get_bind(), checkfirst=True)
    report_status.create(op.get_bind(), checkfirst=True)
    reporter_type_ref = postgresql.ENUM(
        "worker", "customer", name="reporter_type", create_type=False
    )
    report_status_ref = postgresql.ENUM(
        "open", "reviewing", "resolved", "rejected", name="report_status", create_type=False
    )
    op.create_table(
        "job_reports",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("job_id", sa.Integer(), sa.ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False),
        sa.Column("reporter_type", reporter_type_ref, nullable=False),
        sa.Column("reporter_id", sa.Integer(), nullable=False),
        sa.Column("category", sa.String(100), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("status", report_status_ref, server_default="open", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("resolved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("resolution_note", sa.Text(), nullable=True),
    )
    op.create_index("ix_job_reports_job_id", "job_reports", ["job_id"])


def downgrade() -> None:
    op.drop_index("ix_job_reports_job_id", table_name="job_reports")
    op.drop_table("job_reports")
    op.drop_column("payments", "digital_transaction_id")
    op.drop_column("payments", "cash_verified_at")
    op.drop_column("payments", "cash_otp_attempts")
    op.drop_column("payments", "cash_otp_expires_at")
    op.drop_column("payments", "cash_otp_hash")
    op.drop_column("payments", "payment_method")
    op.drop_column("jobs", "completion_verified_at")
    op.drop_column("jobs", "completion_otp_attempts")
    op.drop_column("jobs", "completion_otp_expires_at")
    op.drop_column("jobs", "completion_otp_hash")
    op.drop_column("jobs", "arrival_verified_at")
    op.drop_column("jobs", "arrival_otp_attempts")
    op.drop_column("jobs", "arrival_otp_expires_at")
    op.drop_column("jobs", "arrival_otp_hash")
    bind = op.get_bind()
    sa.Enum(name="report_status").drop(bind, checkfirst=True)
    sa.Enum(name="reporter_type").drop(bind, checkfirst=True)
    sa.Enum(name="payment_method").drop(bind, checkfirst=True)
