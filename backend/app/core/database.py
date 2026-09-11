from sqlalchemy import Enum as SAEnum, create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.core.config import settings

engine = create_engine(settings.database_url)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


def get_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def sa_enum(e):
    """Shared enum column factory: VARCHAR + DB CHECK constraint (Plan 1 I-2 pattern)."""
    return SAEnum(e, native_enum=False, create_constraint=True,
                  values_callable=lambda x: [m.value for m in x])
