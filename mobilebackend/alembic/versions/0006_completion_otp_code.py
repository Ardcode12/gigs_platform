"""Add completion_otp_code column to jobs

Revision ID: 0006_completion_otp_code
Revises: 0005_service_catalog
Create Date: 2026-09-07
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

revision = "0006_completion_otp_code"
down_revision = ("0005_service_catalog", "0004_message_central_otp")
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = inspect(conn)
    cols = [c["name"] for c in inspector.get_columns("jobs")]

    if "completion_otp_code" not in cols:
        op.add_column("jobs", sa.Column("completion_otp_code", sa.String(10), nullable=True))


def downgrade() -> None:
    op.drop_column("jobs", "completion_otp_code")
