# Pulse Healthcare — Test Documentation

## Overview

This document describes the testing strategy, test structure, and how to run tests for the Pulse Healthcare dashboard.

---

## Test Structure

```
backend/
├── tests/
│   ├── __init__.py
│   ├── conftest.py          # Shared fixtures (test DB, client, sample data)
│   ├── test_health.py       # Health check endpoint tests
│   ├── test_patients.py     # Patient CRUD endpoint tests
│   └── test_notes.py        # Note CRUD endpoint tests

frontend/
├── src/
│   └── __tests__/           # (planned) Component and hook tests
```

---

## Backend Tests (pytest)

### Setup

Tests use an in-memory SQLite database to avoid needing PostgreSQL running. The FastAPI `get_db` dependency is overridden with a test database session.

### Running Tests

```bash
# In Docker
docker compose exec backend pytest -v

# Locally (with virtualenv activated)
cd backend
pytest -v

# With coverage
pytest --cov=app --cov-report=term-missing -v
```

### Test Categories

#### Health Check (`test_health.py`)
| Test | Description | Expected |
|------|-------------|----------|
| `test_health_check` | GET /api/v1/health | 200, `{"status": "ok"}` |

#### Patient CRUD (`test_patients.py`)
| Test | Description | Expected |
|------|-------------|----------|
| `test_create_patient` | POST valid patient data | 201, returns patient with ID |
| `test_create_patient_invalid` | POST missing required fields | 422, validation error |
| `test_list_patients` | GET /patients | 200, paginated response |
| `test_list_patients_search` | GET /patients?search=name | 200, filtered results |
| `test_list_patients_status_filter` | GET /patients?status=active | 200, status-filtered results |
| `test_list_patients_sort` | GET /patients?sort_by=last_name&sort_order=asc | 200, sorted results |
| `test_get_patient` | GET /patients/{id} | 200, patient details |
| `test_get_patient_not_found` | GET /patients/{bad-id} | 404 |
| `test_update_patient` | PUT /patients/{id} with changes | 200, updated patient |
| `test_update_patient_not_found` | PUT /patients/{bad-id} | 404 |
| `test_delete_patient` | DELETE /patients/{id} | 204 |
| `test_delete_patient_not_found` | DELETE /patients/{bad-id} | 404 |

#### Note CRUD (`test_notes.py`)
| Test | Description | Expected |
|------|-------------|----------|
| `test_add_note` | POST note to patient | 201, returns note |
| `test_add_note_with_timestamp` | POST note with custom timestamp | 201, respects timestamp |
| `test_list_notes` | GET /patients/{id}/notes | 200, list of notes |
| `test_delete_note` | DELETE /patients/{id}/notes/{noteId} | 204 |
| `test_delete_note_not_found` | DELETE with bad note ID | 404 |

### Test Fixtures (`conftest.py`)

| Fixture | Scope | Description |
|---------|-------|-------------|
| `db_session` | function | Fresh SQLite session per test |
| `client` | function | FastAPI TestClient with test DB |
| `sample_patient` | function | Pre-created patient for tests that need one |
| `sample_note` | function | Pre-created note attached to sample_patient |

### Assertions & Coverage

Each test validates:
- **Status code** — correct HTTP status for success and error cases
- **Response shape** — correct JSON structure (fields present, types correct)
- **Business logic** — pagination totals, search filtering, sort order
- **Error messages** — 404 returns `{"detail": "..."}`, 422 returns validation errors
- **Side effects** — DELETE actually removes the resource (subsequent GET returns 404)

---

## Frontend Tests (planned)

### Approach
- **Component tests**: Vitest + React Testing Library
- **Hook tests**: `renderHook` with mocked API responses (MSW)
- **E2E tests**: Playwright (stretch goal)

### Priority Components to Test
1. `PatientForm` — form validation, submit behavior, error display
2. `PatientTable` — renders data, handles empty state, pagination clicks
3. `PatientFilters` — search debounce, status filter, sort changes
4. `DeletePatientDialog` — confirmation flow, calls delete mutation
5. `NoteList` / `AddNoteForm` — renders notes, add/delete flow

---

## Test Philosophy

1. **Test behavior, not implementation** — tests verify what the API does, not how it does it
2. **Isolated** — each test gets a fresh database; no test depends on another
3. **Realistic data** — fixtures use realistic patient/note data, not "test123"
4. **Error paths tested** — every endpoint has at least one error case (404, 422)
5. **No mocking the database** — tests run against a real SQLite instance for accuracy
