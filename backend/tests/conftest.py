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
``sqlalchemy.ARRAY(String)`` -- both are PostgreSQL-specific.  Before creating
the tables we patch those columns to use ``String(36)`` and ``JSON``
respectively so that the same ``Base.metadata`` works on SQLite.

We set DATABASE_URL env-var **before** any app module is imported so that
the production ``create_engine`` call in ``app.database`` targets SQLite
rather than PostgreSQL (avoiding the psycopg2 dependency).
"""

import os
import sqlite3

# --- Must happen before any app.* import ---
os.environ["DATABASE_URL"] = "sqlite:///file::memory:?cache=shared&uri=true"

import uuid
from typing import Generator

# Register adapters so SQLite can bind Python UUID objects as strings
sqlite3.register_adapter(uuid.UUID, lambda u: str(u))
sqlite3.register_converter("UUID", lambda b: uuid.UUID(b.decode()))

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import JSON, String, TypeDecorator, create_engine, event
from sqlalchemy.orm import Session, sessionmaker

from app.database import Base
from app.dependencies import get_db
from app.main import app
from app.models.note import Note  # noqa: F401
from app.models.patient import Patient  # noqa: F401


# ---------------------------------------------------------------------------
# SQLite-compatible UUID type
# ---------------------------------------------------------------------------

class SQLiteUUID(TypeDecorator):
    """A UUID type that stores as String(36) for SQLite compatibility.

    Converts Python ``uuid.UUID`` objects to/from plain strings so that
    SQLite can store them and ORM filters like ``Patient.id == some_uuid``
    work correctly.
    """

    impl = String(36)
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is not None:
            return str(value)
        return value

    def process_result_value(self, value, dialect):
        if value is not None:
            return str(value)
        return value


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

    # --- every UUID column -> SQLiteUUID (String(36) with proper coercion) ---
    for table in (patient_table, note_table):
        for col in table.columns:
            if hasattr(col.type, "as_uuid") or type(col.type).__name__ == "UUID":
                col.type = SQLiteUUID()


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


@pytest.fixture(autouse=True)
def _clean_tables() -> Generator:
    """Delete all rows from every table after each test for isolation."""
    yield
    with test_engine.connect() as conn:
        for table in reversed(Base.metadata.sorted_tables):
            conn.execute(table.delete())
        conn.commit()


@pytest.fixture()
def db_session() -> Generator[Session, None, None]:
    """Yield a plain SQLAlchemy session for the test."""
    session = TestSessionLocal()
    try:
        yield session
    finally:
        session.close()


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
