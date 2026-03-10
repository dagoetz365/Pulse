"""
Shared pytest fixtures for the healthcare-dashboard backend test suite.

Provides:
- An in-memory SQLite database with all tables created.
- A FastAPI TestClient whose ``get_db`` dependency yields the test session.
- Convenience fixtures (``sample_patient``, ``sample_note``) that pre-populate
  the database via the API and return the JSON response bodies.

SQLite compatibility notes
--------------------------
The production models use ``sqlalchemy.dialects.postgresql.UUID`` and
``sqlalchemy.ARRAY(String)`` — both are PostgreSQL-specific.  Before creating
the tables we patch those columns to use ``String(36)`` and ``JSON``
respectively so that the same ``Base.metadata`` works on SQLite.
"""

import json
import uuid
from typing import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import JSON, String, create_engine, event
from sqlalchemy.orm import Session, sessionmaker

from app.database import Base
from app.dependencies import get_db
from app.main import app
from app.models.note import Note  # noqa: F401 — ensure model is registered
from app.models.patient import Patient  # noqa: F401 — ensure model is registered

# ---------------------------------------------------------------------------
# Engine / Session that lives for the whole test session
# ---------------------------------------------------------------------------

SQLALCHEMY_TEST_DATABASE_URL = "sqlite:///file::memory:?cache=shared&uri=true"

test_engine = create_engine(
    SQLALCHEMY_TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
)

TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


# ---------------------------------------------------------------------------
# SQLite compatibility: patch PostgreSQL-specific column types
# ---------------------------------------------------------------------------

def _patch_columns_for_sqlite() -> None:
    """Replace ARRAY and PostgreSQL UUID columns with SQLite-friendly types."""
    patient_table = Base.metadata.tables["patients"]
    note_table = Base.metadata.tables["notes"]

    # --- patients.allergies / patients.conditions: ARRAY(String) -> JSON ---
    for col_name in ("allergies", "conditions"):
        col = patient_table.c[col_name]
        col.type = JSON()

    # --- every UUID column -> String(36) ---
    for table in (patient_table, note_table):
        for col in table.columns:
            if hasattr(col.type, "as_uuid") or type(col.type).__name__ == "UUID":
                col.type = String(36)


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture(scope="session", autouse=True)
def _create_tables() -> Generator:
    """Create all tables once for the entire test session, then drop them."""
    _patch_columns_for_sqlite()
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture()
def db_session() -> Generator[Session, None, None]:
    """Yield a fresh SQLAlchemy session; rolls back after every test."""
    connection = test_engine.connect()
    transaction = connection.begin()
    session = TestSessionLocal(bind=connection)

    # Nested transaction so that service-level commits don't actually persist
    nested = connection.begin_nested()

    @event.listens_for(session, "after_transaction_end")
    def restart_savepoint(sess, trans):
        nonlocal nested
        if trans.nested and not trans._parent.nested:
            nested = connection.begin_nested()

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture()
def client(db_session: Session) -> Generator[TestClient, None, None]:
    """FastAPI TestClient that uses the per-test db_session."""
    def _override_get_db():
        try:
            yield db_session
        finally:
            pass  # session lifecycle managed by the db_session fixture

    app.dependency_overrides[get_db] = _override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


# ---------------------------------------------------------------------------
# Convenience data fixtures
# ---------------------------------------------------------------------------

SAMPLE_PATIENT_PAYLOAD = {
    "first_name": "Jane",
    "last_name": "Doe",
    "date_of_birth": "1990-05-15",
    "email": "jane.doe@example.com",
    "phone": "555-0100",
    "address": "123 Elm Street",
    "blood_type": "A+",
    "allergies": ["penicillin"],
    "conditions": ["hypertension"],
    "status": "active",
    "last_visit": "2025-01-10",
}


@pytest.fixture()
def sample_patient(client: TestClient) -> dict:
    """Create a patient via POST and return the response JSON."""
    resp = client.post("/api/v1/patients/", json=SAMPLE_PATIENT_PAYLOAD)
    assert resp.status_code == 201, resp.text
    return resp.json()


@pytest.fixture()
def sample_note(client: TestClient, sample_patient: dict) -> dict:
    """Create a note for the sample patient and return the response JSON."""
    patient_id = sample_patient["id"]
    payload = {"content": "Initial consultation. Patient in good health."}
    resp = client.post(f"/api/v1/patients/{patient_id}/notes", json=payload)
    assert resp.status_code == 201, resp.text
    return resp.json()
