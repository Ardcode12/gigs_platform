"""Store society-side payment workflow status."""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0007_payment_society_status"
down_revision: Union[str, Sequence[str], None] = "0006_society_teams"
branch_labels = None
depends_on = None


def upgrade() -> None:
    columns = {column["name"] for column in sa.inspect(op.get_bind()).get_columns("payments")}
    if "society_status" not in columns:
        op.add_column("payments", sa.Column("society_status", sa.String(30), nullable=True))


def downgrade() -> None:
    op.drop_column("payments", "society_status")
