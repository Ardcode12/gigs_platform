"""Database engine and session factory."""

from collections.abc import Iterator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings

engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,  # Supabase closes idle connections; re-check before handing one out
    pool_size=5,
    max_overflow=10,
)

# If you move DATABASE_URL to Supabase's TRANSACTION pooler (port 6543), prepared
# statements have to go: the pooler hands each transaction a different backend, so a
# statement prepared on one is missing on the next. In psycopg 3 that is
# `prepare_threshold=None` (None disables preparation; 0 would prepare immediately):
#
#     engine = create_engine(
#         settings.DATABASE_URL,
#         pool_pre_ping=True,
#         poolclass=NullPool,                    # the pooler is already pooling
#         connect_args={"prepare_threshold": None},
#     )
#
# Alembic needs the same treatment, or `alembic upgrade head` fails there. The
# direct connection on 5432 (what .env.example uses) needs none of this — check the
# value above against the current Supabase docs before switching.

SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


def get_db() -> Iterator[Session]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
