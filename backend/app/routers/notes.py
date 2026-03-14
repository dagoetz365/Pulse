"""
Clinical notes and AI summary API router.

Mounted at ``/api/v1/patients``. Provides endpoints for:
- ``GET    /{patient_id}/notes``           — List all notes for a patient
- ``POST   /{patient_id}/notes``           — Add a new clinical note
- ``DELETE  /{patient_id}/notes/{note_id}``— Delete a specific note
- ``GET    /{patient_id}/summary``         — Generate an AI-powered clinical
  summary using Google Gemini (falls back to a template if unavailable)

The summary endpoint returns a ``SummaryResponse`` containing the generated
text, patient ID, and a UTC timestamp of when the summary was produced.
"""

import logging
from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.dependencies import get_db
from app.schemas.note import NoteCreate, NoteOut
from app.services.gemini_service import GeminiService
from app.services.note_service import NoteService
from app.services.patient_service import PatientService

logger = logging.getLogger(__name__)


class SummaryResponse(BaseModel):
    """Response model for AI-generated clinical summaries."""

    summary: str
    patient_id: str
    generated_at: str

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
        raise HTTPException(status_code=400, detail="Note content cannot be empty")
    return NoteService(db).add_note(patient_id, data)


@router.delete("/{patient_id}/notes/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_note(patient_id: UUID, note_id: UUID, db: Session = Depends(get_db)):
    success = NoteService(db).delete_note(patient_id, note_id)
    if not success:
        raise HTTPException(status_code=404, detail="Note not found")


@router.get("/{patient_id}/summary", response_model=SummaryResponse)
def get_summary(patient_id: UUID, db: Session = Depends(get_db)):
    patient = PatientService(db).get_patient(patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    notes = NoteService(db).get_notes(patient_id)
    try:
        summary = GeminiService().generate_summary(patient, notes)
        return SummaryResponse(
            summary=summary,
            patient_id=str(patient_id),
            generated_at=datetime.now(timezone.utc).isoformat(),
        )
    except Exception as e:
        logger.error("Summary generation failed for patient %s: %s", patient_id, e)
        raise HTTPException(
            status_code=503,
            detail="Unable to generate summary. Please try again later.",
        )
