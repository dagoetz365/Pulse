"""
Lab results CRUD API router.

Mounted at ``/api/v1/patients``. Provides endpoints for:
- ``GET    /{patient_id}/labs``          — List all lab results for a patient
- ``POST   /{patient_id}/labs``          — Order a new lab test
- ``PUT    /{patient_id}/labs/{lab_id}`` — Update lab status/results
- ``DELETE /{patient_id}/labs/{lab_id}`` — Delete a lab result

All endpoints verify the parent patient exists before operating on labs.
Business logic is delegated to :class:`LabService`.
"""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.dependencies import get_db
from app.schemas.lab import LabCreate, LabOut, LabUpdate
from app.services.lab_service import LabService
from app.services.patient_service import PatientService

router = APIRouter()


@router.get("/{patient_id}/labs", response_model=list[LabOut])
def get_labs(patient_id: UUID, db: Session = Depends(get_db)):
    patient = PatientService(db).get_patient(patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return LabService(db).get_labs(patient_id)


@router.post(
    "/{patient_id}/labs",
    response_model=LabOut,
    status_code=status.HTTP_201_CREATED,
)
def add_lab(patient_id: UUID, data: LabCreate, db: Session = Depends(get_db)):
    patient = PatientService(db).get_patient(patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return LabService(db).add_lab(patient_id, data)


@router.put("/{patient_id}/labs/{lab_id}", response_model=LabOut)
def update_lab(
    patient_id: UUID, lab_id: UUID, data: LabUpdate, db: Session = Depends(get_db)
):
    lab = LabService(db).update_lab(patient_id, lab_id, data)
    if not lab:
        raise HTTPException(status_code=404, detail="Lab not found")
    return lab


@router.delete(
    "/{patient_id}/labs/{lab_id}", status_code=status.HTTP_204_NO_CONTENT
)
def delete_lab(patient_id: UUID, lab_id: UUID, db: Session = Depends(get_db)):
    success = LabService(db).delete_lab(patient_id, lab_id)
    if not success:
        raise HTTPException(status_code=404, detail="Lab not found")
