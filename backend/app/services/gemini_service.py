import logging
from typing import TYPE_CHECKING

import google.generativeai as genai

from app.config import settings

if TYPE_CHECKING:
    from app.models.note import Note
    from app.models.patient import Patient

logger = logging.getLogger(__name__)


class GeminiService:
    def __init__(self) -> None:
        genai.configure(api_key=settings.GEMINI_API_KEY)
        self.model = genai.GenerativeModel("gemini-2.5-flash")

    def generate_summary(self, patient: "Patient", notes: list["Note"]) -> str:
        if not settings.GEMINI_API_KEY:
            return self._template_summary(patient, notes)

        try:
            notes_text = "\n".join(
                [
                    f"[{n.timestamp.strftime('%Y-%m-%d %H:%M')}] {n.content}"
                    for n in sorted(notes, key=lambda n: n.timestamp)
                ]
            )
            from datetime import date
            age = (
                date.today().year
                - patient.date_of_birth.year
                - (
                    (date.today().month, date.today().day)
                    < (patient.date_of_birth.month, patient.date_of_birth.day)
                )
            )

            prompt = f"""You are a clinical documentation assistant. Generate a concise, professional patient summary.

Patient: {patient.first_name} {patient.last_name}
Age: {age}
Date of Birth: {patient.date_of_birth}
Blood Type: {patient.blood_type or 'Unknown'}
Known Conditions: {', '.join(patient.conditions) if patient.conditions else 'None documented'}
Known Allergies: {', '.join(patient.allergies) if patient.allergies else 'None documented'}
Status: {patient.status.capitalize()}
Last Visit: {patient.last_visit or 'Not recorded'}

Clinical Notes (chronological):
{notes_text}

Write a 2–3 paragraph clinical narrative summary. Include:
1. Patient identifiers and current health status
2. Key findings and history synthesized from the notes
3. Any items requiring attention or follow-up

Be factual, professional, and concise. Do not invent information not present in the notes."""

            response = self.model.generate_content(prompt)
            return response.text

        except Exception as e:
            logger.warning(f"Gemini API error: {e}. Falling back to template summary.")
            return self._template_summary(patient, notes)

    def _template_summary(self, patient: "Patient", notes: list["Note"]) -> str:
        from datetime import date
        age = (
            date.today().year
            - patient.date_of_birth.year
            - (
                (date.today().month, date.today().day)
                < (patient.date_of_birth.month, patient.date_of_birth.day)
            )
        )
        conditions = ", ".join(patient.conditions) if patient.conditions else "none documented"
        allergies = ", ".join(patient.allergies) if patient.allergies else "none documented"
        note_count = len(notes)
        latest_note = notes[0].content if notes else "No notes available."

        return (
            f"{patient.first_name} {patient.last_name} is a {age}-year-old patient "
            f"(Blood Type: {patient.blood_type or 'Unknown'}) with a current status of {patient.status}. "
            f"Known conditions include {conditions}. Known allergies: {allergies}.\n\n"
            f"This patient has {note_count} clinical note(s) on record. "
            f"Most recent entry: \"{latest_note}\"\n\n"
            f"Last visit recorded: {patient.last_visit or 'Not on record'}. "
            f"Please review full notes for complete clinical history."
        )
