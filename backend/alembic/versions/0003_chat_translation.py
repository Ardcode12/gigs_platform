"""Add source-language metadata and cached chat translations.

Revision ID: 0003_chat_translation
Revises: 0002_job_verification
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0003_chat_translation"
down_revision: Union[str, None] = "0002_job_verification"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("chat_messages", sa.Column("source_lang", sa.String(16), server_default="en", nullable=False))
    op.create_table(
        "chat_message_translations",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("message_id", sa.Integer(), sa.ForeignKey("chat_messages.id", ondelete="CASCADE"), nullable=False),
        sa.Column("target_lang", sa.String(16), nullable=False),
        sa.Column("translated_text", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("message_id", "target_lang", name="uq_chat_translation_message_lang"),
    )
    op.create_index("ix_chat_message_translations_message_id", "chat_message_translations", ["message_id"])


def downgrade() -> None:
    op.drop_index("ix_chat_message_translations_message_id", table_name="chat_message_translations")
    op.drop_table("chat_message_translations")
    op.drop_column("chat_messages", "source_lang")
