# Pulse Healthcare — Patient Management Dashboard

A modern, full-stack healthcare dashboard for managing patients, clinical notes, and AI-generated summaries. Built with React (TypeScript), FastAPI, PostgreSQL, and Docker.

## Quick Start

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) & Docker Compose
- (Optional) A [Google Gemini API key](https://aistudio.google.com/apikey) for AI-powered patient summaries

### 1. Clone & configure

```bash
git clone https://github.com/dagoetz365/Cura.git
cd Cura  # repo name on GitHub
cp .env.example .env
```

Edit `.env` to add your Gemini API key (optional — the app falls back to template-based summaries without it):

```env
GEMINI_API_KEY=your_key_here
```

### 2. Start everything

```bash
docker compose up --build
```

This starts three services:

| Service    | URL                        | Description                   |
|------------|----------------------------|-------------------------------|
| Frontend   | http://localhost:5173       | React dashboard (Vite HMR)   |
| Backend    | http://localhost:8000       | FastAPI REST API              |
| PostgreSQL | localhost:5432              | Database                      |

On first startup, the backend automatically:
1. Runs Alembic migrations to create the schema
2. Seeds the database with 18 realistic patients and clinical notes

### 3. Verify

```bash
curl http://localhost:8000/health
# → {"status":"ok"}
```

Open http://localhost:5173 in your browser.

## Architecture

```
healthcare-dashboard/
├── backend/                    # FastAPI application
│   ├── app/
│   │   ├── models/             # SQLAlchemy ORM models
│   │   ├── schemas/            # Pydantic request/response schemas
│   │   ├── services/           # Business logic layer
│   │   ├── routers/            # API route handlers
│   │   ├── config.py           # Environment configuration
│   │   ├── database.py         # DB engine & session
│   │   └── main.py             # FastAPI app entry point
│   ├── alembic/                # Database migrations
│   ├── scripts/seed.py         # Sample data seeder
│   ├── tests/                  # API tests (pytest)
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/                   # React + TypeScript application
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/             # shadcn/ui primitives
│   │   │   ├── layout/         # AppShell, Header, Sidebar
│   │   │   ├── patients/       # Patient table, form, filters
│   │   │   ├── notes/          # Note list, add form
│   │   │   ├── summary/        # AI summary panel
│   │   │   ├── dashboard/      # Status chart
│   │   │   └── common/         # Shared components (Pagination, ErrorBoundary)
│   │   ├── hooks/              # React Query hooks (usePatients, useNotes, useSummary)
│   │   ├── store/              # Zustand state stores (patientStore, uiStore, settingsStore)
│   │   ├── pages/              # Route pages (lazy-loaded)
│   │   ├── types/              # TypeScript interfaces
│   │   └── lib/                # API client, utilities
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
├── .env.example
└── README.md
```

## Tech Stack

### Frontend
- **React 18** + TypeScript (strict mode) + Vite
- **shadcn/ui** — accessible component primitives built on Radix UI
- **Tailwind CSS** — utility-first styling with Ascertain brand tokens
- **TanStack Query v5** — server state management with caching and deduplication
- **Zustand** — lightweight client state (filters, sidebar toggle, settings with localStorage persistence)
- **React Hook Form + Zod** — type-safe form validation mirroring Pydantic schemas
- **React Router v6** — client-side routing with lazy-loaded pages
- **Recharts** — patient status distribution donut chart
- **ESLint + Prettier** — linting with zero-warning policy, Tailwind class sorting

### Backend
- **FastAPI** — async Python web framework with auto-generated OpenAPI docs
- **SQLAlchemy 2.0** — ORM with type hints
- **Alembic** — versioned database migrations
- **PostgreSQL 15** — relational database
- **Pydantic v2** — request/response validation with computed fields
- **Google Gemini 2.5 Flash** — AI-powered clinical narrative summaries (with template fallback)

## API Reference

### Health
| Method | Endpoint  | Description        |
|--------|-----------|--------------------|
| GET    | `/health` | Health check       |

All remaining endpoints are prefixed with `/api/v1`.

### Patients
| Method | Endpoint         | Description                          |
|--------|------------------|--------------------------------------|
| GET    | `/patients`      | List patients (paginated, filterable)|
| GET    | `/patients/{id}` | Get single patient                   |
| POST   | `/patients`      | Create patient                       |
| PUT    | `/patients/{id}` | Update patient                       |
| DELETE | `/patients/{id}` | Delete patient                       |

**Query parameters for `GET /patients`:**

| Param       | Type   | Default     | Description                                    |
|-------------|--------|-------------|------------------------------------------------|
| `page`      | int    | 1           | Page number                                    |
| `page_size` | int    | 10          | Items per page (max 100)                       |
| `search`    | string | —           | Search by name or email (case-insensitive)     |
| `status`    | string | —           | Filter by status: active, inactive, critical   |
| `sort_by`   | string | created_at  | Sort field: last_name, created_at, last_visit, status |
| `sort_order`| string | desc        | Sort direction: asc, desc                      |

### Notes
| Method | Endpoint                        | Description           |
|--------|---------------------------------|-----------------------|
| GET    | `/patients/{id}/notes`          | List patient notes    |
| POST   | `/patients/{id}/notes`          | Add note              |
| DELETE | `/patients/{id}/notes/{noteId}` | Delete note           |

### Summary
| Method | Endpoint                  | Description                      |
|--------|---------------------------|----------------------------------|
| GET    | `/patients/{id}/summary`  | AI-generated patient summary     |

## Key Design Decisions

| Decision | Choice | Why |
|----------|--------|-----|
| State management | TanStack Query + Zustand | Server state (patients, notes) in Query with caching/dedup; UI state (filters, sidebar) in Zustand — clear separation |
| Component library | shadcn/ui | Unstyled Radix primitives give full control over branding; no CSS-in-JS runtime; WCAG-accessible out of the box |
| Form handling | React Hook Form + Zod | Zod schemas mirror Pydantic models; validation runs on both client and server |
| Service layer | Separate services/ | Keeps routers thin; business logic is testable independently of HTTP layer |
| AI summaries | Gemini 2.5 Flash + template fallback | Real LLM generates clinical narratives; template fallback ensures the feature works without an API key |
| Code splitting | React.lazy + Suspense | Each route page is lazy-loaded, reducing initial bundle size |
| Pagination | Server-side | Handles 100+ patients efficiently; `page`/`page_size` params with max cap |
| Search | Debounced (300ms) | Non-blocking UI; only fires API call after user stops typing |
| Error handling | Axios interceptors + ErrorBoundary | Global request/response error handling; React ErrorBoundary catches render failures |
| Settings persistence | Zustand persist middleware | Settings stored in localStorage — survives page reloads without backend changes; same Zustand pattern as other stores |

## Stretch Goals

I chose **two** stretch goals that best demonstrate backend maturity and code quality:

1. **Database migrations with Alembic** (Advanced Backend) — Versioned schema changes via `alembic/versions/`. The startup script runs `alembic upgrade head` automatically, so any developer can reproduce the exact database state. This also makes it straightforward to evolve the schema over time without manual SQL.

2. **Unit tests for API endpoints** (Testing & Quality) — 33 pytest tests covering all CRUD operations, validation edge cases (invalid email, unknown blood type, empty names), pagination, sorting, filtering, and error responses. Tests run against an in-memory SQLite database for speed: `docker compose exec backend pytest -v`.

**Additional features implemented beyond stretch goals:**
- Request logging middleware (method, path, status, duration)
- Sorting/filtering query parameters on list endpoint
- Data visualization (interactive donut chart — click any segment to filter patients by status)
- Code splitting with React.lazy for all route pages
- Hot reloading in Docker for both frontend and backend
- Clickable dashboard stat cards and chart segments (navigate to filtered patient lists)
- Settings page with persistent user preferences (notification toggles, appearance — stored in localStorage via Zustand persist)
- Email patient action on patient profile (mailto: link)
- Status-colored avatars throughout the dashboard (red for critical, green for active, amber for inactive)
- Accessible UI: aria-labels on icon-only buttons, semantic HTML, keyboard-navigable

## Development

### Hot Reload

Both frontend and backend support hot reload via Docker volume mounts:
- **Frontend**: Vite HMR — edit any `.tsx` file and see changes instantly
- **Backend**: Uvicorn `--reload` — edit any `.py` file and the server restarts

### Running without Docker

**Backend:**
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # or .venv\Scripts\activate on Windows
pip install -r requirements.txt
# Start PostgreSQL separately, then:
alembic upgrade head
python scripts/seed.py
uvicorn app.main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

### Running Tests

```bash
# Backend (33 tests)
docker compose exec backend pytest -v

# Lint + format check
cd frontend && npm run lint && npm run format
```

## Security

This project follows a security-first approach:

- **API keys are backend-only** — `GEMINI_API_KEY` is loaded via `pydantic-settings` from `.env` (gitignored). Zero references exist in frontend code; the key never reaches the client.
- **Parameterized queries** — All database access uses SQLAlchemy ORM; no raw SQL or string interpolation in queries.
- **Input validation on both sides** — Pydantic schemas validate all API inputs server-side; Zod + React Hook Form validate client-side. Server validation is the authority.
- **CORS allow-list** — Origins restricted to `localhost:5173`, `frontend:5173`, and `localhost:3000`. Production deployments should update this to the actual domain.
- **No console.log in production code** — Frontend source contains zero `console.log/debug/warn` statements.
- **Request logging** — Middleware logs HTTP method, path, status code, and duration for every request.
- **Secrets management** — `.env` is gitignored and never committed. `.env.example` ships with safe placeholder values only.
- **Error messages don't leak internals** — API error responses return user-friendly messages; stack traces and internal details are logged server-side only.

## Environment Variables

See `.env.example` for all available configuration:

| Variable          | Required | Default    | Description                     |
|-------------------|----------|------------|---------------------------------|
| POSTGRES_USER     | No       | postgres   | Database user                   |
| POSTGRES_PASSWORD | No       | password   | Database password               |
| POSTGRES_DB       | No       | pulse      | Database name                   |
| DATABASE_URL      | Auto     | —          | Built from above in compose     |
| GEMINI_API_KEY    | No       | —          | Google Gemini API key (backend-only, never exposed to client) |
