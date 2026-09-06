"""Federation governance records and Society lifecycle fields."""
from typing import Sequence, Union
import sqlalchemy as sa
from alembic import op

revision: str = "0011_federation_governance"
down_revision: Union[str, Sequence[str], None] = "0010_backfill_orphan_jobs"
branch_labels = None
depends_on = None

def upgrade() -> None:
    inspector = sa.inspect(op.get_bind())
    society_columns = {c["name"] for c in inspector.get_columns("societies")}
    for name, column in (("status", sa.Column("status", sa.String(40), server_default="active", nullable=False)), ("registration_number", sa.Column("registration_number", sa.String(100), nullable=True)), ("registration_expiry", sa.Column("registration_expiry", sa.DateTime(timezone=True), nullable=True)), ("status_reason", sa.Column("status_reason", sa.String(500), nullable=True))):
        if name not in society_columns: op.add_column("societies", column)
    op.create_index("ix_societies_status", "societies", ["status"], unique=False) if "ix_societies_status" not in {i["name"] for i in inspector.get_indexes("societies")} else None
    for table, columns in {
        "authority_documents": [sa.Column("id", sa.Integer(), primary_key=True), sa.Column("society_id", sa.Integer(), sa.ForeignKey("societies.id", ondelete="CASCADE")), sa.Column("worker_id", sa.Integer(), sa.ForeignKey("workers.id", ondelete="CASCADE")), sa.Column("name", sa.String(200), nullable=False), sa.Column("category", sa.String(50), nullable=False), sa.Column("status", sa.String(30), server_default="pending", nullable=False), sa.Column("expires_at", sa.DateTime(timezone=True)), sa.Column("reason", sa.Text()), sa.Column("data", sa.JSON(), server_default="{}", nullable=False), sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False)],
        "authority_inspections": [sa.Column("id", sa.Integer(), primary_key=True), sa.Column("society_id", sa.Integer(), sa.ForeignKey("societies.id", ondelete="CASCADE"), nullable=False), sa.Column("officer_id", sa.Integer(), sa.ForeignKey("federation_users.id", ondelete="SET NULL")), sa.Column("inspection_type", sa.String(50), nullable=False), sa.Column("purpose", sa.Text(), nullable=False), sa.Column("scheduled_at", sa.DateTime(timezone=True)), sa.Column("result", sa.String(30), server_default="scheduled", nullable=False), sa.Column("notes", sa.Text()), sa.Column("data", sa.JSON(), server_default="{}", nullable=False), sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False)],
        "authority_audit_logs": [sa.Column("id", sa.Integer(), primary_key=True), sa.Column("actor_id", sa.Integer(), sa.ForeignKey("federation_users.id", ondelete="SET NULL")), sa.Column("action", sa.String(100), nullable=False), sa.Column("module", sa.String(80), nullable=False), sa.Column("entity_type", sa.String(80), nullable=False), sa.Column("entity_id", sa.Integer()), sa.Column("reason", sa.Text()), sa.Column("data", sa.JSON(), server_default="{}", nullable=False), sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False)],
    }.items():
        if table not in inspector.get_table_names(): op.create_table(table, *columns)

def downgrade() -> None:
    for table in ("authority_audit_logs", "authority_inspections", "authority_documents"): op.drop_table(table)
