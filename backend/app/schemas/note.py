"""
Pydantic schemas for clinical note request/response validation.

Schemas:
- **NoteCreate**: POST body for adding a new note. The ``timestamp`` field
  is optional and defaults to the current server time if omitted.
- **NoteOut**: Response schema that includes the auto-generated ``id``,
  ``patient_id``, ``content``, ``timestamp``, and ``created_at``.
"""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel


class NoteCreate(BaseModel):
    content: str
    timestamp: Optional[datetime] = None  # Caller-provided; defaults to now() if omitted

    class Config:
        json_schema_extra = {
            "example": {
                "content": "Patient reports improved blood pressure. Medication compliance good.",
                "timestamp": "2025-03-01T10:30:00Z",
            }
        }


class NoteOut(BaseModel):
    id: UUID
    patient_id: UUID
    content: str
    timestamp: datetime
    created_at: datetime

    model_config = {"from_attributes": True}
