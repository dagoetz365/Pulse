from typing import Generator

from fastapi import Query
from sqlalchemy.orm import Session

from app.database import SessionLocal


def get_db() -> Generator:
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
