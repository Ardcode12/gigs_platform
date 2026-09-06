"""Persist Federation welfare review state."""
from typing import Sequence, Union
import sqlalchemy as sa
from alembic import op

revision: str = "0013_welfare_reviews"
down_revision: Union[str, Sequence[str], None] = "0012_worker_auth_verify"
branch_labels = None
depends_on = None

def upgrade() -> None:
    inspector = sa.inspect(op.get_bind()); columns = {c["name"] for c in inspector.get_columns("welfare_enrollments")}
    for name, column in (("status", sa.Column("status", sa.String(30), server_default="draft", nullable=False)), ("federation_reason", sa.Column("federation_reason", sa.Text())), ("reviewed_at", sa.Column("reviewed_at", sa.DateTime(timezone=True))), ("reviewed_by", sa.Column("reviewed_by", sa.Integer(), sa.ForeignKey("federation_users.id", ondelete="SET NULL")))):
        if name not in columns: op.add_column("welfare_enrollments", column)

def downgrade() -> None:
    for name in ("reviewed_by", "reviewed_at", "federation_reason", "status"): op.drop_column("welfare_enrollments", name)
