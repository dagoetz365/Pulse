# Pulse Healthcare — Test Documentation

## Running Tests

```bash
# In Docker
docker compose exec backend pytest -v

# Locally (with virtualenv activated)
cd backend && pytest -v

# With coverage
pytest --cov=app --cov-report=term-missing -v
```

## Test Structure

```
backend/tests/
├── conftest.py          # Shared fixtures (test DB, client, sample data)
├── test_health.py       # Health check endpoint (1 test)
├── test_patients.py     # Patient CRUD endpoints (21 tests)
└── test_notes.py        # Note CRUD endpoints (11 tests)
```

33 tests run against an in-memory SQLite database — no PostgreSQL required, no mocking.

## Test Coverage

### Health Check (`test_health.py`)
| Test | Expected |
|------|----------|
| `test_health_check` | 200, `{"status": "ok"}` |

### Patient CRUD (`test_patients.py`)
| Test | Expected |
|------|----------|
| `test_create_patient` | 201, returns patient with computed `age` and `full_name` |
| `test_create_patient_missing_fields` | 422, validation error |
| `test_create_patient_invalid_email` | 422 |
| `test_create_patient_invalid_blood_type` | 422 (rejects `"Z+"`) |
| `test_create_patient_invalid_status` | 422 (rejects `"unknown"`) |
| `test_create_patient_whitespace_names` | 422 |
| `test_list_patients` | 200, paginated response |
| `test_list_patients_search` | 200, filtered by name |
| `test_list_patients_empty_search` | 200, empty results |
| `test_list_patients_status_filter` | 200, filtered by status |
| `test_list_patients_sort_asc` | 200, sorted ascending |
| `test_list_patients_sort_desc` | 200, sorted descending |
| `test_list_patients_pagination` | Boundary test: `page_size=2` with 3 records |
| `test_get_patient` | 200, full patient details |
| `test_get_patient_not_found` | 404 |
| `test_update_patient_full` | 200, all fields updated |
| `test_update_patient_partial` | 200, phone changes, name untouched |
| `test_delete_patient` | 204, then GET returns 404 |

### Note CRUD (`test_notes.py`)
| Test | Expected |
|------|----------|
| `test_add_note` | 201, returns note with ID |
| `test_add_note_custom_timestamp` | 201, respects provided timestamp |
| `test_add_note_empty_content` | 400, rejects empty/whitespace |
| `test_add_note_missing_patient` | 404 |
| `test_list_notes` | 200, list of notes |
| `test_list_notes_empty` | 200, empty list |
| `test_list_notes_missing_patient` | 404 |
| `test_list_notes_order` | Newest-first (descending) |
| `test_delete_note` | 204 |
| `test_delete_note_not_found` | 404 |
| `test_delete_note_wrong_patient` | 404, validates note ownership |

## Fixtures (`conftest.py`)

| Fixture | Scope | Description |
|---------|-------|-------------|
| `db_session` | function | Fresh SQLite session per test |
| `client` | function | FastAPI TestClient with overridden DB |
| `sample_patient` | function | Pre-created patient |
| `sample_note` | function | Pre-created note attached to sample patient |

## Test Philosophy

- **Behavior over implementation** — tests verify what the API does, not how
- **Isolated** — each test gets a fresh database; no test depends on another
- **Error paths covered** — every endpoint has at least one error case (400/404/422)
- **No mocking** — tests run against a real SQLite instance for accuracy
