"""Assign any remaining legacy jobs to the active society."""

from typing import Sequence, Union

from alembic import op

revision: str = "0010_backfill_orphan_jobs"
down_revision: Union[str, Sequence[str], None] = "0009_backfill_job_societies"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        UPDATE jobs AS j
        SET society_id = (SELECT id FROM societies WHERE is_active = true ORDER BY id LIMIT 1)
        WHERE j.society_id IS NULL
    """)


def downgrade() -> None:
    pass
