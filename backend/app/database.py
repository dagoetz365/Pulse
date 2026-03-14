"""
SQLAlchemy database engine and session configuration.

Creates a connection pool to PostgreSQL with:
- ``pool_pre_ping``: Validates connections before use so stale connections
  after a database restart are automatically recycled.
- ``pool_size=5``: Maintains 5 persistent connections.
- ``max_overflow=10``: Allows up to 10 additional connections under load.

Exports:
    engine: The SQLAlchemy engine instance.
    SessionLocal: A configured sessionmaker for creating database sessions.
    Base: Declarative base class that all ORM models inherit from.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from app.config import settings

engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,  # reconnect after db restart
    pool_size=5,
    max_overflow=10,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()
