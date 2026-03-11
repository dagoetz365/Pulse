"""Tests for the /api/v1/patients/{id}/labs endpoints."""

import uuid

from fastapi.testclient import TestClient


def _labs_url(patient_id: str) -> str:
    return f"/api/v1/patients/{patient_id}/labs"


class TestAddLab:
    def test_add_lab_success(self, client: TestClient, sample_patient: dict):
        patient_id = sample_patient["id"]
        payload = {"test_name": "Lipid Panel"}
        resp = client.post(_labs_url(patient_id), json=payload)
        assert resp.status_code == 201
        body = resp.json()
        assert body["test_name"] == "Lipid Panel"
        assert body["status"] == "ordered"
        assert body["patient_id"] == patient_id
        assert body["result"] is None

    def test_add_lab_with_status(self, client: TestClient, sample_patient: dict):
        patient_id = sample_patient["id"]
        payload = {"test_name": "CBC", "status": "in_progress"}
        resp = client.post(_labs_url(patient_id), json=payload)
        assert resp.status_code == 201
        assert resp.json()["status"] == "in_progress"

    def test_add_lab_empty_test_name(self, client: TestClient, sample_patient: dict):
        patient_id = sample_patient["id"]
        resp = client.post(_labs_url(patient_id), json={"test_name": "  "})
        assert resp.status_code == 422

    def test_add_lab_invalid_status(self, client: TestClient, sample_patient: dict):
        patient_id = sample_patient["id"]
        resp = client.post(
            _labs_url(patient_id), json={"test_name": "CBC", "status": "invalid"}
        )
        assert resp.status_code == 422

    def test_add_lab_patient_not_found(self, client: TestClient):
        fake_id = str(uuid.uuid4())
        resp = client.post(_labs_url(fake_id), json={"test_name": "CBC"})
        assert resp.status_code == 404


class TestListLabs:
    def test_list_labs(self, client: TestClient, sample_patient: dict, sample_lab: dict):
        patient_id = sample_patient["id"]
        resp = client.get(_labs_url(patient_id))
        assert resp.status_code == 200
        body = resp.json()
        assert isinstance(body, list)
        assert len(body) >= 1

    def test_list_labs_empty(self, client: TestClient, sample_patient: dict):
        patient_id = sample_patient["id"]
        resp = client.get(_labs_url(patient_id))
        assert resp.status_code == 200
        assert resp.json() == []

    def test_list_labs_patient_not_found(self, client: TestClient):
        fake_id = str(uuid.uuid4())
        resp = client.get(_labs_url(fake_id))
        assert resp.status_code == 404


class TestUpdateLab:
    def test_update_lab_with_result(
        self, client: TestClient, sample_patient: dict, sample_lab: dict
    ):
        patient_id = sample_patient["id"]
        lab_id = sample_lab["id"]
        update = {
            "status": "completed",
            "result": "WBC: 7.2, RBC: 4.8, Hemoglobin: 14.2",
            "result_date": "2026-03-11T10:00:00Z",
        }
        resp = client.put(f"{_labs_url(patient_id)}/{lab_id}", json=update)
        assert resp.status_code == 200
        body = resp.json()
        assert body["status"] == "completed"
        assert body["result"] == "WBC: 7.2, RBC: 4.8, Hemoglobin: 14.2"

    def test_update_lab_partial(
        self, client: TestClient, sample_patient: dict, sample_lab: dict
    ):
        patient_id = sample_patient["id"]
        lab_id = sample_lab["id"]
        resp = client.put(
            f"{_labs_url(patient_id)}/{lab_id}", json={"status": "in_progress"}
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["status"] == "in_progress"
        assert body["test_name"] == "Complete Blood Count (CBC)"  # unchanged

    def test_update_lab_not_found(self, client: TestClient, sample_patient: dict):
        patient_id = sample_patient["id"]
        fake_lab_id = str(uuid.uuid4())
        resp = client.put(
            f"{_labs_url(patient_id)}/{fake_lab_id}", json={"status": "completed"}
        )
        assert resp.status_code == 404


class TestDeleteLab:
    def test_delete_lab_success(
        self, client: TestClient, sample_patient: dict, sample_lab: dict
    ):
        patient_id = sample_patient["id"]
        lab_id = sample_lab["id"]
        resp = client.delete(f"{_labs_url(patient_id)}/{lab_id}")
        assert resp.status_code == 204

    def test_delete_lab_not_found(self, client: TestClient, sample_patient: dict):
        patient_id = sample_patient["id"]
        fake_lab_id = str(uuid.uuid4())
        resp = client.delete(f"{_labs_url(patient_id)}/{fake_lab_id}")
        assert resp.status_code == 404
