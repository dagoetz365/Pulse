"""
Business logic layer for patient operations.

The ``PatientService`` encapsulates all patient-related database operations,
keeping the router layer thin. Features include:

- **list_patients**: Paginated listing with case-insensitive search across
  first name, last name, and email. Supports sorting by any whitelisted
  column and optional status filtering.
- **get_patient**: Single patient lookup by UUID.
- **create_patient**: Inserts a new patient from validated schema data.
- **update_patient**: Partial update using only fields that were explicitly set.
- **delete_patient**: Removes a patient (notes and labs cascade-delete).
"""

import math
from uuid import UUID

from sqlalchemy import asc, desc, or_
from sqlalchemy.orm import Session

from app.dependencies import PaginationParams
from app.models.patient import Patient
from app.schemas.patient import SORTABLE_FIELDS, PatientCreate, PatientUpdate


class PatientService:
    def __init__(self, db: Session):
        self.db = db

    def list_patients(self, params: PaginationParams) -> dict:
        query = self.db.query(Patient)

        # Search
        if params.search:
            term = f"%{params.search}%"
            query = query.filter(
                or_(
                    Patient.first_name.ilike(term),
                    Patient.last_name.ilike(term),
                    Patient.email.ilike(term),
                )
            )

        # Status filter
        if params.status:
            query = query.filter(Patient.status == params.status)

        # Sorting — only allow known fields to prevent injection
        sort_field = params.sort_by if params.sort_by in SORTABLE_FIELDS else "last_name"
        col = getattr(Patient, sort_field, Patient.last_name)
        query = query.order_by(asc(col) if params.sort_order == "asc" else desc(col))

        total = query.count()
        offset = (params.page - 1) * params.page_size
        items = query.offset(offset).limit(params.page_size).all()

        return {
            "items": items,
            "total": total,
            "page": params.page,
            "page_size": params.page_size,
            "total_pages": math.ceil(total / params.page_size) if total > 0 else 1,
        }

    def get_patient(self, patient_id: UUID) -> Patient | None:
        return self.db.query(Patient).filter(Patient.id == patient_id).first()

    def create_patient(self, data: PatientCreate) -> Patient:
        patient = Patient(**data.model_dump())
        self.db.add(patient)
        self.db.commit()
        self.db.refresh(patient)
        return patient

    def update_patient(self, patient_id: UUID, data: PatientUpdate) -> Patient | None:
        patient = self.get_patient(patient_id)
        if not patient:
            return None
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(patient, field, value)
        self.db.commit()
        self.db.refresh(patient)
        return patient

    def delete_patient(self, patient_id: UUID) -> bool:
        patient = self.get_patient(patient_id)
        if not patient:
            return False
        self.db.delete(patient)
        self.db.commit()
        return True
