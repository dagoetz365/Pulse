from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.dependencies import get_db
from app.schemas.note import NoteCreate, NoteOut
from app.services.gemini_service import GeminiService
from app.services.note_service import NoteService
from app.services.patient_service import PatientService

router = APIRouter()


@router.get("/{patient_id}/notes", response_model=list[NoteOut])
def get_notes(patient_id: UUID, db: Session = Depends(get_db)):
    patient = PatientService(db).get_patient(patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return NoteService(db).get_notes(patient_id)


@router.post("/{patient_id}/notes", response_model=NoteOut, status_code=status.HTTP_201_CREATED)
def add_note(patient_id: UUID, data: NoteCreate, db: Session = Depends(get_db)):
    patient = PatientService(db).get_patient(patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    if not data.content.strip():
        raise HTTPException(status_code=422, detail="Note content cannot be empty")
    return NoteService(db).add_note(patient_id, data)


@router.delete("/{patient_id}/notes/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_note(patient_id: UUID, note_id: UUID, db: Session = Depends(get_db)):
    success = NoteService(db).delete_note(patient_id, note_id)
    if not success:
        raise HTTPException(status_code=404, detail="Note not found")


@router.get("/{patient_id}/summary")
def get_summary(patient_id: UUID, db: Session = Depends(get_db)):
    patient = PatientService(db).get_patient(patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    notes = NoteService(db).get_notes(patient_id)
    try:
        summary = GeminiService().generate_summary(patient, notes)
        return {
            "summary": summary,
            "patient_id": str(patient_id),
            "generated_at": datetime.now(timezone.utc).isoformat(),
        }
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail=f"Summary generation failed: {str(e)}",
        )
