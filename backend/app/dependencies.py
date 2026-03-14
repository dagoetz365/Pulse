"""
FastAPI dependency injection helpers.

Provides reusable dependencies that are injected into route handlers via
``Depends()``:

- **get_db**: Yields a SQLAlchemy session and ensures it is closed after the
  request completes, even if an exception occurs.
- **PaginationParams**: Parses and validates common query parameters for
  paginated list endpoints (page, page_size, search, sort_by, sort_order,
  status filter).
"""

from typing import Generator

from fastapi import Query
from sqlalchemy.orm import Session

from app.database import SessionLocal


def get_db() -> Generator:
    """Yield a database session and close it when the request finishes."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class PaginationParams:
    def __init__(
        self,
        page: int = Query(1, ge=1, description="Page number"),
        page_size: int = Query(20, ge=1, le=100, description="Items per page"),
        search: str = Query("", description="Search by name or email"),
        sort_by: str = Query("last_name", description="Field to sort by"),
        sort_order: str = Query("asc", pattern="^(asc|desc)$", description="Sort direction"),
        status: str | None = Query(None, description="Filter by status"),
    ):
        self.page = page
        self.page_size = page_size
        self.search = search
        self.sort_by = sort_by
        self.sort_order = sort_order
        self.status = status
