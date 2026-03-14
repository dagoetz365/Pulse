"""
Patient CRUD API router.

Mounted at ``/api/v1/patients``. Provides endpoints for:
- ``GET  /``             — List patients with pagination, search, sort, and status filter
- ``GET  /{patient_id}`` — Retrieve a single patient by UUID
- ``POST /``             — Create a new patient record
- ``PUT  /{patient_id}`` — Update an existing patient (partial update)
- ``DELETE /{patient_id}``— Delete a patient and cascade-remove their notes and labs

All endpoints delegate business logic to :class:`PatientService`.
"""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.dependencies import PaginationParams, get_db
from app.schemas.common import PaginatedResponse
from app.schemas.patient import PatientCreate, PatientOut, PatientUpdate
from app.services.patient_service import PatientService

router = APIRouter()


@router.get("", response_model=PaginatedResponse[PatientOut])
def list_patients(
    params: PaginationParams = Depends(),
    db: Session = Depends(get_db),
):
    return PatientService(db).list_patients(params)


@router.get("/{patient_id}", response_model=PatientOut)
def get_patient(patient_id: UUID, db: Session = Depends(get_db)):
    patient = PatientService(db).get_patient(patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient


@router.post("", response_model=PatientOut, status_code=status.HTTP_201_CREATED)
def create_patient(data: PatientCreate, db: Session = Depends(get_db)):
    return PatientService(db).create_patient(data)


@router.put("/{patient_id}", response_model=PatientOut)
def update_patient(patient_id: UUID, data: PatientUpdate, db: Session = Depends(get_db)):
    patient = PatientService(db).update_patient(patient_id, data)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient


@router.delete("/{patient_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_patient(patient_id: UUID, db: Session = Depends(get_db)):
    success = PatientService(db).delete_patient(patient_id)
    if not success:
        raise HTTPException(status_code=404, detail="Patient not found")
