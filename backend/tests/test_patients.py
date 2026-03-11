"""Tests for the /api/v1/patients endpoints."""

import uuid

from fastapi.testclient import TestClient


BASE_URL = "/api/v1/patients"


# ---------------------------------------------------------------------------
# POST /api/v1/patients — create
# ---------------------------------------------------------------------------

class TestCreatePatient:
    """POST /api/v1/patients"""

    def test_create_patient_valid(self, client: TestClient):
        """Creating a patient with valid data returns 201 and the full record."""
        payload = {
            "first_name": "Alice",
            "last_name": "Smith",
            "date_of_birth": "1985-03-20",
            "email": "alice.smith@example.com",
            "phone": "555-0101",
            "blood_type": "O+",
            "allergies": ["aspirin"],
            "conditions": ["diabetes"],
            "status": "active",
        }
        resp = client.post(f"{BASE_URL}/", json=payload)

        assert resp.status_code == 201
        body = resp.json()

        # Verify returned fields match input
        assert body["first_name"] == "Alice"
        assert body["last_name"] == "Smith"
        assert body["date_of_birth"] == "1985-03-20"
        assert body["email"] == "alice.smith@example.com"
        assert body["blood_type"] == "O+"
        assert body["allergies"] == ["aspirin"]
        assert body["conditions"] == ["diabetes"]
        assert body["status"] == "active"

        # Computed / auto-generated fields
        assert "id" in body
        assert "created_at" in body
        assert "updated_at" in body
        assert "age" in body
        assert "full_name" in body
        assert body["full_name"] == "Alice Smith"

    def test_create_patient_missing_required_fields(self, client: TestClient):
        """Omitting required fields (first_name, last_name, dob, email) returns 422."""
        resp = client.post(f"{BASE_URL}/", json={})
        assert resp.status_code == 422

    def test_create_patient_invalid_email(self, client: TestClient):
        """An invalid email address returns 422."""
        payload = {
            "first_name": "Bob",
            "last_name": "Jones",
            "date_of_birth": "1990-01-01",
            "email": "not-an-email",
        }
        resp = client.post(f"{BASE_URL}/", json=payload)
        assert resp.status_code == 422

    def test_create_patient_invalid_blood_type(self, client: TestClient):
        """A blood type not in the allowed set returns 422."""
        payload = {
            "first_name": "Carol",
            "last_name": "White",
            "date_of_birth": "1995-06-15",
            "email": "carol.white@example.com",
            "blood_type": "Z+",
        }
        resp = client.post(f"{BASE_URL}/", json=payload)
        assert resp.status_code == 422

    def test_create_patient_invalid_status(self, client: TestClient):
        """A status not in {active, inactive, critical} returns 422."""
        payload = {
            "first_name": "Dan",
            "last_name": "Green",
            "date_of_birth": "1988-12-01",
            "email": "dan.green@example.com",
            "status": "unknown",
        }
        resp = client.post(f"{BASE_URL}/", json=payload)
        assert resp.status_code == 422

    def test_create_patient_empty_name(self, client: TestClient):
        """An empty first_name or last_name returns 422."""
        payload = {
            "first_name": "  ",
            "last_name": "Brown",
            "date_of_birth": "2000-01-01",
            "email": "brown@example.com",
        }
        resp = client.post(f"{BASE_URL}/", json=payload)
        assert resp.status_code == 422

    def test_create_patient_with_clinical_fields(self, client: TestClient):
        """Creating a patient with insurance, history, and consent fields."""
        payload = {
            "first_name": "Test",
            "last_name": "Clinical",
            "date_of_birth": "1985-01-01",
            "email": "clinical@example.com",
            "insurance_provider": "Aetna",
            "insurance_policy_number": "AET-999",
            "medical_history": "History of migraines.",
            "family_history": ["Heart Disease"],
            "consent_forms": ["HIPAA Privacy Notice", "Treatment Consent"],
        }
        resp = client.post(f"{BASE_URL}/", json=payload)
        assert resp.status_code == 201
        body = resp.json()
        assert body["insurance_provider"] == "Aetna"
        assert body["insurance_policy_number"] == "AET-999"
        assert body["medical_history"] == "History of migraines."
        assert body["family_history"] == ["Heart Disease"]
        assert body["consent_forms"] == ["HIPAA Privacy Notice", "Treatment Consent"]


# ---------------------------------------------------------------------------
# GET /api/v1/patients — list
# ---------------------------------------------------------------------------

class TestListPatients:
    """GET /api/v1/patients"""

    def test_list_patients_returns_paginated_response(self, client: TestClient, sample_patient: dict):
        """The response has items, total, page, page_size, total_pages."""
        resp = client.get(f"{BASE_URL}/")
        assert resp.status_code == 200

        body = resp.json()
        assert "items" in body
        assert "total" in body
        assert "page" in body
        assert "page_size" in body
        assert "total_pages" in body
        assert body["total"] >= 1
        assert isinstance(body["items"], list)
        assert len(body["items"]) >= 1

    def test_list_patients_search_by_name(self, client: TestClient, sample_patient: dict):
        """Searching by first_name or last_name filters correctly."""
        resp = client.get(f"{BASE_URL}/", params={"search": "Jane"})
        body = resp.json()
        assert body["total"] >= 1
        assert any(p["first_name"] == "Jane" for p in body["items"])

    def test_list_patients_search_no_match(self, client: TestClient, sample_patient: dict):
        """A search term with no matches returns an empty list."""
        resp = client.get(f"{BASE_URL}/", params={"search": "ZZZZNOTFOUND"})
        body = resp.json()
        assert body["total"] == 0
        assert body["items"] == []

    def test_list_patients_filter_by_status(self, client: TestClient, sample_patient: dict):
        """Filtering by status returns only patients with that status."""
        resp = client.get(f"{BASE_URL}/", params={"status": "active"})
        body = resp.json()
        assert body["total"] >= 1
        assert all(p["status"] == "active" for p in body["items"])

    def test_list_patients_filter_by_status_no_match(self, client: TestClient, sample_patient: dict):
        """Filtering by a status that no patient has returns an empty list."""
        resp = client.get(f"{BASE_URL}/", params={"status": "critical"})
        body = resp.json()
        # sample_patient is 'active', so 'critical' should return 0
        assert body["total"] == 0

    def test_list_patients_sort_by_first_name_asc(self, client: TestClient):
        """Sorting by first_name ascending orders patients correctly."""
        # Create two patients to verify ordering
        client.post(f"{BASE_URL}/", json={
            "first_name": "Zara",
            "last_name": "Last",
            "date_of_birth": "1990-01-01",
            "email": "zara@example.com",
        })
        client.post(f"{BASE_URL}/", json={
            "first_name": "Aaron",
            "last_name": "First",
            "date_of_birth": "1990-01-01",
            "email": "aaron@example.com",
        })

        resp = client.get(f"{BASE_URL}/", params={"sort_by": "first_name", "sort_order": "asc"})
        body = resp.json()
        names = [p["first_name"] for p in body["items"]]
        assert names == sorted(names, key=str.lower)

    def test_list_patients_sort_by_first_name_desc(self, client: TestClient):
        """Sorting by first_name descending orders patients correctly."""
        client.post(f"{BASE_URL}/", json={
            "first_name": "Zara",
            "last_name": "Desc",
            "date_of_birth": "1990-01-01",
            "email": "zara.desc@example.com",
        })
        client.post(f"{BASE_URL}/", json={
            "first_name": "Aaron",
            "last_name": "Desc",
            "date_of_birth": "1990-01-01",
            "email": "aaron.desc@example.com",
        })

        resp = client.get(f"{BASE_URL}/", params={"sort_by": "first_name", "sort_order": "desc"})
        body = resp.json()
        names = [p["first_name"] for p in body["items"]]
        assert names == sorted(names, key=str.lower, reverse=True)

    def test_list_patients_pagination(self, client: TestClient):
        """page_size limits the number of items returned."""
        # Create a few patients
        for i in range(3):
            client.post(f"{BASE_URL}/", json={
                "first_name": f"Page{i}",
                "last_name": "Test",
                "date_of_birth": "1990-01-01",
                "email": f"page{i}@example.com",
            })

        resp = client.get(f"{BASE_URL}/", params={"page_size": 2, "page": 1})
        body = resp.json()
        assert len(body["items"]) <= 2
        assert body["page"] == 1
        assert body["page_size"] == 2


# ---------------------------------------------------------------------------
# GET /api/v1/patients/{id} — retrieve single patient
# ---------------------------------------------------------------------------

class TestGetPatient:
    """GET /api/v1/patients/{id}"""

    def test_get_patient_exists(self, client: TestClient, sample_patient: dict):
        """Retrieving an existing patient returns 200 with full data."""
        patient_id = sample_patient["id"]
        resp = client.get(f"{BASE_URL}/{patient_id}")
        assert resp.status_code == 200

        body = resp.json()
        assert body["id"] == patient_id
        assert body["first_name"] == sample_patient["first_name"]
        assert body["last_name"] == sample_patient["last_name"]
        assert body["email"] == sample_patient["email"]

    def test_get_patient_not_found(self, client: TestClient):
        """Retrieving a non-existent patient returns 404."""
        fake_id = str(uuid.uuid4())
        resp = client.get(f"{BASE_URL}/{fake_id}")
        assert resp.status_code == 404
        assert resp.json()["detail"] == "Patient not found"


# ---------------------------------------------------------------------------
# PUT /api/v1/patients/{id} — update
# ---------------------------------------------------------------------------

class TestUpdatePatient:
    """PUT /api/v1/patients/{id}"""

    def test_update_patient_success(self, client: TestClient, sample_patient: dict):
        """Updating an existing patient returns 200 with the modified data."""
        patient_id = sample_patient["id"]
        update_payload = {
            "first_name": "Janet",
            "status": "critical",
            "allergies": ["penicillin", "latex"],
        }
        resp = client.put(f"{BASE_URL}/{patient_id}", json=update_payload)
        assert resp.status_code == 200

        body = resp.json()
        assert body["first_name"] == "Janet"
        assert body["status"] == "critical"
        assert body["allergies"] == ["penicillin", "latex"]
        # Unchanged fields should remain
        assert body["last_name"] == sample_patient["last_name"]
        assert body["email"] == sample_patient["email"]

    def test_update_patient_partial(self, client: TestClient, sample_patient: dict):
        """A partial update (only phone) leaves other fields unchanged."""
        patient_id = sample_patient["id"]
        resp = client.put(f"{BASE_URL}/{patient_id}", json={"phone": "555-9999"})
        assert resp.status_code == 200

        body = resp.json()
        assert body["phone"] == "555-9999"
        assert body["first_name"] == sample_patient["first_name"]

    def test_update_patient_insurance(self, client: TestClient, sample_patient: dict):
        """Updating insurance fields leaves other fields unchanged."""
        patient_id = sample_patient["id"]
        resp = client.put(
            f"{BASE_URL}/{patient_id}", json={"insurance_provider": "Cigna"}
        )
        assert resp.status_code == 200
        assert resp.json()["insurance_provider"] == "Cigna"
        assert resp.json()["first_name"] == sample_patient["first_name"]

    def test_update_patient_not_found(self, client: TestClient):
        """Updating a non-existent patient returns 404."""
        fake_id = str(uuid.uuid4())
        resp = client.put(f"{BASE_URL}/{fake_id}", json={"first_name": "Nobody"})
        assert resp.status_code == 404
        assert resp.json()["detail"] == "Patient not found"


# ---------------------------------------------------------------------------
# DELETE /api/v1/patients/{id} — delete
# ---------------------------------------------------------------------------

class TestDeletePatient:
    """DELETE /api/v1/patients/{id}"""

    def test_delete_patient_success(self, client: TestClient, sample_patient: dict):
        """Deleting an existing patient returns 204 and the patient is gone."""
        patient_id = sample_patient["id"]

        resp = client.delete(f"{BASE_URL}/{patient_id}")
        assert resp.status_code == 204

        # Confirm it is actually gone
        get_resp = client.get(f"{BASE_URL}/{patient_id}")
        assert get_resp.status_code == 404

    def test_delete_patient_not_found(self, client: TestClient):
        """Deleting a non-existent patient returns 404."""
        fake_id = str(uuid.uuid4())
        resp = client.delete(f"{BASE_URL}/{fake_id}")
        assert resp.status_code == 404
        assert resp.json()["detail"] == "Patient not found"
