"""
Pydantic schemas for patient request/response validation.

Defines three schema tiers:
- **PatientBase**: Shared fields and validators for create and output schemas.
  Validates blood type against the allowed set, status against
  ``active/inactive/critical``, and enforces name length constraints.
- **PatientCreate**: Inherits PatientBase unchanged; used for POST bodies.
- **PatientUpdate**: All fields optional for PATCH partial updates.
- **PatientOut**: Response schema that adds ``id``, timestamps, and computed
  ``age`` and ``full_name`` properties derived from stored fields.

Constants:
    BLOOD_TYPES: Valid blood type strings (e.g. "A+", "O-").
    STATUSES: Valid patient statuses.
    SORTABLE_FIELDS: Whitelist of column names allowed in sort queries
    (prevents SQL injection through sort parameters).
"""

from datetime import date, datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, computed_field, field_validator

BLOOD_TYPES = {"A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"}
STATUSES = {"active", "inactive", "critical"}
SORTABLE_FIELDS = {
    "first_name", "last_name", "date_of_birth", "email", "status", "last_visit", "created_at"
}


class PatientBase(BaseModel):
    first_name: str
    last_name: str
    date_of_birth: date
    email: EmailStr
    phone: Optional[str] = None
    address: Optional[str] = None
    blood_type: Optional[str] = None
    allergies: list[str] = []
    conditions: list[str] = []
    status: str = "active"
    last_visit: Optional[date] = None

    # Insurance
    insurance_provider: Optional[str] = None
    insurance_policy_number: Optional[str] = None
    insurance_group_number: Optional[str] = None

    # History
    medical_history: Optional[str] = None
    family_history: list[str] = []

    # Consent
    consent_forms: list[str] = []

    @field_validator("blood_type")
    @classmethod
    def validate_blood_type(cls, v: Optional[str]) -> Optional[str]:
        if v and v not in BLOOD_TYPES:
            raise ValueError(f"blood_type must be one of {sorted(BLOOD_TYPES)}")
        return v

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        if v not in STATUSES:
            raise ValueError(f"status must be one of {sorted(STATUSES)}")
        return v

    @field_validator("first_name", "last_name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Name cannot be empty")
        if len(v) > 100:
            raise ValueError("Name cannot exceed 100 characters")
        return v


class PatientCreate(PatientBase):
    pass


class PatientUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    date_of_birth: Optional[date] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    blood_type: Optional[str] = None
    allergies: Optional[list[str]] = None
    conditions: Optional[list[str]] = None
    status: Optional[str] = None
    last_visit: Optional[date] = None
    insurance_provider: Optional[str] = None
    insurance_policy_number: Optional[str] = None
    insurance_group_number: Optional[str] = None
    medical_history: Optional[str] = None
    family_history: Optional[list[str]] = None
    consent_forms: Optional[list[str]] = None

    @field_validator("blood_type")
    @classmethod
    def validate_blood_type(cls, v: Optional[str]) -> Optional[str]:
        if v and v not in BLOOD_TYPES:
            raise ValueError(f"blood_type must be one of {sorted(BLOOD_TYPES)}")
        return v

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: Optional[str]) -> Optional[str]:
        if v and v not in STATUSES:
            raise ValueError(f"status must be one of {sorted(STATUSES)}")
        return v


class PatientOut(PatientBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    @computed_field
    @property
    def age(self) -> int:
        today = date.today()
        dob = self.date_of_birth
        return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))

    @computed_field
    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}"

    model_config = {"from_attributes": True}
