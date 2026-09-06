"""Persist Society Portal settings."""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0008_society_settings"
down_revision: Union[str, Sequence[str], None] = "0007_payment_society_status"
branch_labels = None
depends_on = None


def upgrade() -> None:
    columns = {column["name"] for column in sa.inspect(op.get_bind()).get_columns("societies")}
    if "settings" not in columns:
        op.add_column("societies", sa.Column("settings", postgresql.JSONB(), server_default="{}", nullable=False))
    op.execute("UPDATE societies SET settings = '{}'::jsonb WHERE settings IS NULL")


def downgrade() -> None:
    op.drop_column("societies", "settings")
