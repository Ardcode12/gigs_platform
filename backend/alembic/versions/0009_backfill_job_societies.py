"""Associate legacy jobs with the worker's society."""

from typing import Sequence, Union

from alembic import op

revision: str = "0009_backfill_job_societies"
down_revision: Union[str, Sequence[str], None] = "0008_society_settings"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        UPDATE jobs AS j
        SET society_id = w.society_id
        FROM workers AS w
        WHERE j.society_id IS NULL AND j.worker_id = w.id
    """)
    op.execute("""
        UPDATE jobs AS j
        SET society_id = (SELECT id FROM societies WHERE is_active = true ORDER BY id LIMIT 1)
        WHERE j.society_id IS NULL
    """)


def downgrade() -> None:
    pass
