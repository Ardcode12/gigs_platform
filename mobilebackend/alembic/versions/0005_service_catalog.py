"""Add the service catalog and customer booking references."""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0005_service_catalog"
down_revision: Union[str, Sequence[str], None] = "0004_authority_portal"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    inspector = sa.inspect(op.get_bind())
    tables = set(inspector.get_table_names())
    if "service_categories" not in tables:
        op.create_table(
        "service_categories",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("slug", sa.String(80), nullable=False),
        sa.Column("name", sa.String(120), nullable=False),
        sa.Column("icon", sa.String(60), server_default="wrench", nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default="true", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
        op.create_index("ix_service_categories_slug", "service_categories", ["slug"], unique=True)
    if "service_subcategories" not in tables:
        op.create_table(
        "service_subcategories",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("category_id", sa.Integer(), sa.ForeignKey("service_categories.id", ondelete="CASCADE"), nullable=False),
        sa.Column("slug", sa.String(80), nullable=False),
        sa.Column("name", sa.String(120), nullable=False),
        sa.Column("icon", sa.String(60), server_default="wrench", nullable=False),
        sa.Column("base_amount", sa.Numeric(10, 2), server_default="0", nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default="true", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
        op.create_index("ix_service_subcategories_category_id", "service_subcategories", ["category_id"])
        op.create_index("ix_service_subcategories_slug", "service_subcategories", ["slug"])
    job_columns = {column["name"] for column in inspector.get_columns("jobs")}
    if "category_id" not in job_columns:
        op.add_column("jobs", sa.Column("category_id", sa.Integer(), sa.ForeignKey("service_categories.id", ondelete="SET NULL"), nullable=True))
    if "subcategory_id" not in job_columns:
        op.add_column("jobs", sa.Column("subcategory_id", sa.Integer(), sa.ForeignKey("service_subcategories.id", ondelete="SET NULL"), nullable=True))


def downgrade() -> None:
    op.drop_index("ix_jobs_subcategory_id", table_name="jobs")
    op.drop_index("ix_jobs_category_id", table_name="jobs")
    op.drop_column("jobs", "subcategory_id")
    op.drop_column("jobs", "category_id")
    op.drop_index("ix_service_subcategories_slug", table_name="service_subcategories")
    op.drop_index("ix_service_subcategories_category_id", table_name="service_subcategories")
    op.drop_table("service_subcategories")
    op.drop_index("ix_service_categories_slug", table_name="service_categories")
    op.drop_table("service_categories")
