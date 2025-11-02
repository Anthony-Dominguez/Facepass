from typing import Any, Dict, Generator

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import Session, sessionmaker

from ..core import config


engine_kwargs: Dict[str, Any] = {}
if config.DATABASE_URL.startswith("sqlite"):
    engine_kwargs["connect_args"] = {"check_same_thread": False}
elif config.DATABASE_URL.startswith("postgresql"):
    # PostgreSQL connection pool settings
    engine_kwargs["pool_size"] = 5
    engine_kwargs["max_overflow"] = 10
    engine_kwargs["pool_pre_ping"] = True  # Verify connections before using
    engine_kwargs["pool_recycle"] = 3600  # Recycle connections after 1 hour

engine = create_engine(config.DATABASE_URL, **engine_kwargs)
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)
Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
