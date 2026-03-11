# Pulse Healthcare — Patient Management Dashboard

Full-stack dashboard for managing patients, clinical notes, and AI-generated summaries. Interactive charts, real-time search, Gemini-powered narratives — one command to run.

## Quick Start

```bash
git clone https://github.com/dagoetz365/Pulse.git
cd Pulse
cp .env.example .env          # optionally add GEMINI_API_KEY for AI summaries
docker compose up --build      # starts frontend, backend, and database
```

Open **http://localhost:5173** — seeds 18 patients with clinical notes on first run.

> Gemini API key is optional — summaries fall back to a structured template without it. Free key at [aistudio.google.com](https://aistudio.google.com/apikey).

## Features

- **Dashboard** — Clickable stat cards and interactive donut chart that filter patients by status. Critical patients panel, recent patients with status-colored avatars.
- **Patient CRUD** — Sortable, paginated table with 350ms debounced search and status filtering. Inline view/edit/delete actions.
- **Patient Detail** — Two-panel layout. Left: contact info, insurance details, medical info (blood type, allergy/condition tags, medical history, family history), consent forms, AI summary. Right: clinical note timeline and lab results.
- **Labs & Results** — Order lab tests, track status (ordered → in progress → completed), record results with dates and notes. Full CRUD with cascade delete on patient removal.
- **Insurance & Clinical Data** — Insurance provider/policy/group fields, free-text medical history, family history tags, consent form tracking — all optional, shown only when populated.
- **Forms** — Zod validation mirroring backend Pydantic schemas. Custom tag input for allergies/conditions/family history/consent forms (Enter to add, X to remove). Blood type dropdown, status selector.
- **Clinical Notes** — Chronological timeline, newest-first. Optional custom timestamps. Rejects empty content (400). Validates note ownership on delete.
- **AI Summary** — On-demand via Gemini 2.5 Flash. Sends patient demographics + all notes → 2–3 paragraph clinical narrative. 10-minute cache. Template fallback if no API key.

## Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Frontend | React 18 + TypeScript (strict) + Vite | Type safety, fast HMR |
| UI | shadcn/ui (Radix primitives) + Tailwind CSS | Accessible, unstyled, full branding control |
| Server State | TanStack Query v5 | Caching, deduplication, background refetch |
| Client State | Zustand + persist middleware | Filters, sidebar, settings in localStorage |
| Forms | React Hook Form + Zod | Mirrors Pydantic — validation on both sides |
| Backend | FastAPI + SQLAlchemy 2.0 + Alembic | Async, auto-generated OpenAPI docs, versioned migrations |
| Database | PostgreSQL 15 | ARRAY columns, UUID PKs, cascade deletes |
| AI | Google Gemini 2.5 Flash | Clinical narrative generation with template fallback |
| Infra | Docker Compose (3 services) | One command, hot reload via volume mounts |

## API

All endpoints under `/api/v1` except `/health`.

| Method | Endpoint | Status | Notes |
|--------|----------|--------|-------|
| GET | `/health` | 200 | |
| GET | `/patients` | 200 | `page`, `page_size`, `search`, `status`, `sort_by`, `sort_order` |
| GET | `/patients/{id}` | 200 / 404 | Computed `age` and `full_name` |
| POST | `/patients` | 201 / 422 | Validates email, blood type, status, non-empty names |
| PUT | `/patients/{id}` | 200 / 404 | Partial update — only sent fields change |
| DELETE | `/patients/{id}` | 204 / 404 | Cascade deletes notes and labs |
| GET | `/patients/{id}/notes` | 200 / 404 | Ordered newest-first |
| POST | `/patients/{id}/notes` | 201 / 400 | Rejects empty/whitespace |
| DELETE | `/patients/{id}/notes/{noteId}` | 204 / 404 | Validates note belongs to patient |
| GET | `/patients/{id}/labs` | 200 / 404 | Ordered newest-first |
| POST | `/patients/{id}/labs` | 201 / 404 | Validates test_name, status |
| PUT | `/patients/{id}/labs/{labId}` | 200 / 404 | Partial update (status, result, notes) |
| DELETE | `/patients/{id}/labs/{labId}` | 204 / 404 | Validates lab belongs to patient |
| GET | `/patients/{id}/summary` | 200 / 503 | Gemini or template fallback |

## Testing

48 pytest tests against in-memory SQLite — no PostgreSQL, no mocking.

```bash
docker compose exec backend pytest -v
```

**Patients (23 tests):** Valid create with computed fields · missing fields (422) · invalid email (422) · invalid blood type `"Z+"` (422) · invalid status `"unknown"` (422) · whitespace-only names (422) · clinical fields (insurance, history, consent) · paginated list · search by name · empty search results · filter by status · sort asc/desc · pagination boundary (`page_size=2` with 3 records) · get by ID · 404 on missing · full update · partial update (phone changes, name untouched) · insurance update · delete → 204 then GET → 404

**Notes (12 tests):** Add note · custom timestamp · empty content (400) · missing patient (404) · list notes · empty list · missing patient (404) · descending order · delete (204) · missing note (404) · wrong patient ID (404)

**Labs (14 tests):** Order lab · empty test name (422) · invalid status (422) · missing patient (404) · with optional notes · list labs · empty list · missing patient (404) · update status · partial update · update with results · delete (204) · missing lab (404)

## Key Decisions

| Decision | Reasoning |
|----------|-----------|
| TanStack Query + Zustand | Server state in Query (cache/dedup); client state in Zustand — clear separation, no overlap |
| Zod mirrors Pydantic | Same validation both sides; server is authority |
| Gemini → template fallback | Always works, even without an API key |
| `services/` vs `routers/` | Thin routes, testable business logic |
| `SORTABLE_FIELDS` whitelist | Prevents SQL injection via sort parameter |
| Vite proxy (`/api` → backend) | Backend URL never in client bundle; secrets never prefixed with `VITE_` |

## Stretch Goals

1. **Alembic migrations** — Two versioned migrations, auto-run on startup via `alembic upgrade head`
2. **Unit tests** — 48 pytest tests covering CRUD, validation edge cases, pagination, sorting, error responses
3. **Code splitting & lazy loading** — Route-level `React.lazy()` with `<Suspense>` skeleton loaders
4. **Dark/light theme** — Toggle in settings, persisted via Zustand + localStorage
5. **Data visualization** — Interactive donut chart (Recharts) with clickable segments that filter patients
6. **Sorting/filtering query params** — `sort_by`, `sort_order`, `status`, `search` on list endpoint
7. **Hot reloading in Docker** — Volume mounts for both frontend (Vite HMR) and backend (uvicorn `--reload`)

## Running Without Docker

```bash
# Backend
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
alembic upgrade head && python scripts/seed.py
uvicorn app.main:app --reload --port 8000

# Frontend
cd frontend
npm install && npm run dev
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `POSTGRES_DB` | `pulse` | Database name |
| `GEMINI_API_KEY` | — | Gemini key (backend-only, never exposed to client) |

See `.env.example` for the full list (`POSTGRES_USER`, `POSTGRES_PASSWORD`, `DATABASE_URL`).
