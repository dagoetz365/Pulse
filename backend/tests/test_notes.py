"""Tests for the /api/v1/patients/{id}/notes endpoints."""

import uuid

from fastapi.testclient import TestClient


def _notes_url(patient_id: str) -> str:
    return f"/api/v1/patients/{patient_id}/notes"


# ---------------------------------------------------------------------------
# POST /api/v1/patients/{id}/notes — add note
# ---------------------------------------------------------------------------

class TestAddNote:
    """POST /api/v1/patients/{patient_id}/notes"""

    def test_add_note_success(self, client: TestClient, sample_patient: dict):
        """Adding a note with valid content returns 201."""
        patient_id = sample_patient["id"]
        payload = {"content": "Follow-up visit. Blood pressure normal."}
        resp = client.post(_notes_url(patient_id), json=payload)

        assert resp.status_code == 201
        body = resp.json()
        assert body["content"] == payload["content"]
        assert body["patient_id"] == patient_id
        assert "id" in body
        assert "timestamp" in body
        assert "created_at" in body

    def test_add_note_with_custom_timestamp(self, client: TestClient, sample_patient: dict):
        """A caller-supplied timestamp is honoured."""
        patient_id = sample_patient["id"]
        custom_ts = "2025-06-01T14:30:00Z"
        payload = {"content": "Scheduled check-up.", "timestamp": custom_ts}
        resp = client.post(_notes_url(patient_id), json=payload)

        assert resp.status_code == 201
        body = resp.json()
        # The returned timestamp should start with the date we supplied
        assert body["timestamp"].startswith("2025-06-01")

    def test_add_note_empty_content(self, client: TestClient, sample_patient: dict):
        """An empty-string content returns 400."""
        patient_id = sample_patient["id"]
        resp = client.post(_notes_url(patient_id), json={"content": "   "})
        assert resp.status_code == 400

    def test_add_note_patient_not_found(self, client: TestClient):
        """Adding a note to a non-existent patient returns 404."""
        fake_id = str(uuid.uuid4())
        resp = client.post(_notes_url(fake_id), json={"content": "Some note."})
        assert resp.status_code == 404
        assert resp.json()["detail"] == "Patient not found"


# ---------------------------------------------------------------------------
# GET /api/v1/patients/{id}/notes — list notes
# ---------------------------------------------------------------------------

class TestListNotes:
    """GET /api/v1/patients/{patient_id}/notes"""

    def test_list_notes(self, client: TestClient, sample_patient: dict, sample_note: dict):
        """Listing notes for a patient with at least one note returns them."""
        patient_id = sample_patient["id"]
        resp = client.get(_notes_url(patient_id))

        assert resp.status_code == 200
        body = resp.json()
        assert isinstance(body, list)
        assert len(body) >= 1
        assert body[0]["patient_id"] == patient_id

    def test_list_notes_empty(self, client: TestClient, sample_patient: dict):
        """A patient with no notes returns an empty list (not an error)."""
        # sample_patient has no notes yet (sample_note not requested)
        patient_id = sample_patient["id"]
        resp = client.get(_notes_url(patient_id))
        assert resp.status_code == 200
        assert resp.json() == []

    def test_list_notes_patient_not_found(self, client: TestClient):
        """Listing notes for a non-existent patient returns 404."""
        fake_id = str(uuid.uuid4())
        resp = client.get(_notes_url(fake_id))
        assert resp.status_code == 404

    def test_list_notes_ordered_by_timestamp_desc(self, client: TestClient, sample_patient: dict):
        """Notes are returned in descending timestamp order (newest first)."""
        patient_id = sample_patient["id"]

        # Create two notes with explicit timestamps
        client.post(_notes_url(patient_id), json={
            "content": "Older note",
            "timestamp": "2025-01-01T08:00:00Z",
        })
        client.post(_notes_url(patient_id), json={
            "content": "Newer note",
            "timestamp": "2025-06-01T08:00:00Z",
        })

        resp = client.get(_notes_url(patient_id))
        body = resp.json()
        assert len(body) >= 2
        timestamps = [n["timestamp"] for n in body]
        assert timestamps == sorted(timestamps, reverse=True)


# ---------------------------------------------------------------------------
# DELETE /api/v1/patients/{id}/notes/{note_id} — delete note
# ---------------------------------------------------------------------------

class TestDeleteNote:
    """DELETE /api/v1/patients/{patient_id}/notes/{note_id}"""

    def test_delete_note_success(self, client: TestClient, sample_patient: dict, sample_note: dict):
        """Deleting an existing note returns 204 and the note is removed."""
        patient_id = sample_patient["id"]
        note_id = sample_note["id"]

        resp = client.delete(f"{_notes_url(patient_id)}/{note_id}")
        assert resp.status_code == 204

        # Confirm it is gone
        notes_resp = client.get(_notes_url(patient_id))
        note_ids = [n["id"] for n in notes_resp.json()]
        assert note_id not in note_ids

    def test_delete_note_not_found(self, client: TestClient, sample_patient: dict):
        """Deleting a non-existent note returns 404."""
        patient_id = sample_patient["id"]
        fake_note_id = str(uuid.uuid4())
        resp = client.delete(f"{_notes_url(patient_id)}/{fake_note_id}")
        assert resp.status_code == 404
        assert resp.json()["detail"] == "Note not found"

    def test_delete_note_wrong_patient(self, client: TestClient, sample_note: dict):
        """Deleting a note using the wrong patient_id returns 404."""
        fake_patient_id = str(uuid.uuid4())
        note_id = sample_note["id"]
        resp = client.delete(f"{_notes_url(fake_patient_id)}/{note_id}")
        assert resp.status_code == 404
