# Pulse Healthcare — Patient Management Dashboard

Full-stack dashboard for managing patients, clinical notes, and AI-generated summaries. Interactive charts, real-time search, Gemini-powered narratives — one command to run.

## Quick Start

```bash
git clone https://github.com/dagoetz365/Cura.git
cd Cura
cp .env.example .env          # optionally add GEMINI_API_KEY for AI summaries
docker compose up --build      # starts frontend, backend, and database
```

Open **http://localhost:5173** — seeds 18 patients with clinical notes on first run.

> Gemini API key is optional — summaries fall back to a structured template without it. Free key at [aistudio.google.com](https://aistudio.google.com/apikey).

## Features

- **Dashboard** — Clickable stat cards and interactive donut chart that filter patients by status. Critical patients panel, recent patients with status-colored avatars.
- **Patient CRUD** — Sortable, paginated table with 350ms debounced search and status filtering. Inline view/edit/delete actions.
- **Patient Detail** — Two-panel layout: contact info, medical info (blood type, allergy/condition tags), AI summary on the left; clinical note timeline on the right.
- **Forms** — Zod validation mirroring backend Pydantic schemas. Custom tag input for allergies/conditions (Enter to add, X to remove). Blood type dropdown, status selector.
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
| DELETE | `/patients/{id}` | 204 / 404 | Cascade deletes notes |
| GET | `/patients/{id}/notes` | 200 / 404 | Ordered newest-first |
| POST | `/patients/{id}/notes` | 201 / 400 | Rejects empty/whitespace |
| DELETE | `/patients/{id}/notes/{noteId}` | 204 / 404 | Validates note belongs to patient |
| GET | `/patients/{id}/summary` | 200 / 503 | Gemini or template fallback |

## Testing

33 pytest tests against in-memory SQLite — no PostgreSQL, no mocking.

```bash
docker compose exec backend pytest -v
```

**Patients (21 tests):** Valid create with computed fields · missing fields (422) · invalid email (422) · invalid blood type `"Z+"` (422) · invalid status `"unknown"` (422) · whitespace-only names (422) · paginated list · search by name · empty search results · filter by status · sort asc/desc · pagination boundary (`page_size=2` with 3 records) · get by ID · 404 on missing · full update · partial update (phone changes, name untouched) · delete → 204 then GET → 404

**Notes (12 tests):** Add note · custom timestamp · empty content (400) · missing patient (404) · list notes · empty list · missing patient (404) · descending order · delete (204) · missing note (404) · wrong patient ID (404)

## Design Decisions

| Decision | Reasoning |
|----------|-----------|
| TanStack Query + Zustand | Server state (patients/notes) in Query with cache; client state (filters/sidebar) in Zustand — clear separation |
| Zod mirrors Pydantic | Same validation rules both sides; server is authority |
| Gemini → template fallback | Feature always works, even without API key |
| `services/` separate from `routers/` | Thin routes, testable business logic |
| `SORTABLE_FIELDS` whitelist | Prevents SQL injection via sort parameter |
| `React.lazy` on all 7 pages | Code splitting with skeleton fallbacks |
| Vite proxy (`/api` → backend) | Backend URL never in client bundle; no `VITE_` prefix on secrets |

## Stretch Goals

Two chosen per the assessment instructions:

1. **Alembic migrations** — Versioned schema, auto-runs on startup via `alembic upgrade head`
2. **Unit tests** — 33 tests covering CRUD, validation edge cases, pagination, sorting, error responses

**Beyond requirements:** Request logging middleware · interactive donut chart · settings with localStorage persistence · status-colored avatars · email action (mailto:) · accessible UI (aria-labels, semantic HTML, keyboard nav)

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
