"""
Shared/generic Pydantic schemas used across multiple endpoints.

Contains the ``PaginatedResponse[T]`` generic model that wraps any list
endpoint response with pagination metadata (items, total count, page
number, page size, and computed total pages).
"""

from typing import Generic, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class PaginatedResponse(BaseModel, Generic[T]):
    items: list[T]
    total: int
    page: int
    page_size: int
    total_pages: int
