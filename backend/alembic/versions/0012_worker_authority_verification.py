"""Track Federation verification separately from Society KYC."""
from typing import Sequence, Union
import sqlalchemy as sa
from alembic import op

revision: str = "0012_worker_auth_verify"
down_revision: Union[str, Sequence[str], None] = "0011_federation_governance"
branch_labels = None
depends_on = None

def upgrade() -> None:
    inspector = sa.inspect(op.get_bind())
    columns = {column["name"] for column in inspector.get_columns("workers")}
    for name, column in (("authority_status", sa.Column("authority_status", sa.String(30), server_default="pending", nullable=False)), ("authority_reason", sa.Column("authority_reason", sa.String(500))), ("authority_verified_at", sa.Column("authority_verified_at", sa.DateTime(timezone=True)))):
        if name not in columns: op.add_column("workers", column)
    indexes = {index["name"] for index in inspector.get_indexes("workers")}
    if "ix_workers_authority_status" not in indexes: op.create_index("ix_workers_authority_status", "workers", ["authority_status"], unique=False)

def downgrade() -> None:
    op.drop_index("ix_workers_authority_status", table_name="workers")
    op.drop_column("workers", "authority_verified_at")
    op.drop_column("workers", "authority_reason")
    op.drop_column("workers", "authority_status")
