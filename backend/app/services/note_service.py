"""
Business logic layer for clinical note operations.

The ``NoteService`` handles creating, listing, and deleting clinical notes
for a given patient. Notes are always scoped to a specific patient_id to
prevent cross-patient access. Listing returns notes in reverse
chronological order (newest first).
"""

from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.note import Note
from app.schemas.note import NoteCreate


class NoteService:
    def __init__(self, db: Session):
        self.db = db

    def get_notes(self, patient_id: UUID) -> list[Note]:
        return (
            self.db.query(Note)
            .filter(Note.patient_id == patient_id)
            .order_by(Note.timestamp.desc())
            .all()
        )

    def add_note(self, patient_id: UUID, data: NoteCreate) -> Note:
        note = Note(
            patient_id=patient_id,
            content=data.content,
            timestamp=data.timestamp or datetime.now(timezone.utc),
        )
        self.db.add(note)
        self.db.commit()
        self.db.refresh(note)
        return note

    def delete_note(self, patient_id: UUID, note_id: UUID) -> bool:
        note = (
            self.db.query(Note)
            .filter(Note.id == note_id, Note.patient_id == patient_id)
            .first()
        )
        if not note:
            return False
        self.db.delete(note)
        self.db.commit()
        return True
