"""
Pydantic schemas for lab result request/response validation.

Schemas:
- **LabCreate**: POST body for ordering a new lab test. Validates that
  ``test_name`` is non-empty and ``status`` is one of the allowed values.
  Defaults status to ``"ordered"`` if not provided.
- **LabUpdate**: PATCH body for updating an existing lab. All fields
  optional for partial updates (e.g. setting result and status to completed).
- **LabOut**: Response schema with all lab fields including auto-generated
  ``id``, ``patient_id``, and ``created_at``.

Constants:
    LAB_STATUSES: Valid status values — ``ordered``, ``in_progress``, ``completed``.
"""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, field_validator

LAB_STATUSES = {"ordered", "in_progress", "completed"}


class LabCreate(BaseModel):
    test_name: str
    ordered_date: Optional[datetime] = None
    status: str = "ordered"
    result: Optional[str] = None
    result_date: Optional[datetime] = None
    notes: Optional[str] = None

    @field_validator("test_name")
    @classmethod
    def validate_test_name(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Test name cannot be empty")
        return v

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        if v not in LAB_STATUSES:
            raise ValueError(f"status must be one of {sorted(LAB_STATUSES)}")
        return v


class LabUpdate(BaseModel):
    test_name: Optional[str] = None
    status: Optional[str] = None
    result: Optional[str] = None
    result_date: Optional[datetime] = None
    notes: Optional[str] = None

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: Optional[str]) -> Optional[str]:
        if v and v not in LAB_STATUSES:
            raise ValueError(f"status must be one of {sorted(LAB_STATUSES)}")
        return v


class LabOut(BaseModel):
    id: UUID
    patient_id: UUID
    test_name: str
    ordered_date: datetime
    status: str
    result: Optional[str]
    result_date: Optional[datetime]
    notes: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}
