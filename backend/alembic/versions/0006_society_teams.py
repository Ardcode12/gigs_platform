"""Persist society booking teams."""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0006_society_teams"
down_revision: Union[str, Sequence[str], None] = "0005_service_catalog"
branch_labels = None
depends_on = None


def upgrade() -> None:
    inspector = sa.inspect(op.get_bind())
    columns = {column["name"] for column in inspector.get_columns("jobs")}
    if "team_worker_ids" not in columns:
        op.add_column("jobs", sa.Column("team_worker_ids", postgresql.JSONB(), server_default="[]", nullable=False))
    if "team_lead_id" not in columns:
        op.add_column("jobs", sa.Column("team_lead_id", sa.Integer(), sa.ForeignKey("workers.id", ondelete="SET NULL"), nullable=True))


def downgrade() -> None:
    op.drop_column("jobs", "team_lead_id")
    op.drop_column("jobs", "team_worker_ids")
