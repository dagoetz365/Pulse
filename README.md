# Cura — Healthcare Patient Management Dashboard

A modern, full-stack healthcare dashboard for managing patients, clinical notes, and AI-generated summaries. Built with React (TypeScript), FastAPI, PostgreSQL, and Docker.

## Quick Start

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) & Docker Compose
- (Optional) A [Google Gemini API key](https://aistudio.google.com/apikey) for AI-powered patient summaries

### 1. Clone & configure

```bash
git clone <repo-url>
cd healthcare-dashboard
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
curl http://localhost:8000/api/v1/health
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
│   │   │   └── summary/        # AI summary panel
│   │   │   └── common/         # Shared components
│   │   ├── hooks/              # React Query hooks
│   │   ├── store/              # Zustand state stores
│   │   ├── pages/              # Route pages
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
- **React 18** + TypeScript + Vite
- **shadcn/ui** — accessible component primitives built on Radix UI
- **Tailwind CSS** — utility-first styling
- **TanStack Query v5** — server state management with caching
- **TanStack Table** — headless table with server-side sort/filter
- **Zustand** — lightweight client state (filters, sidebar toggle)
- **React Hook Form + Zod** — type-safe form validation
- **React Router v6** — client-side routing

### Backend
- **FastAPI** — async Python web framework
- **SQLAlchemy 2.0** — ORM with type hints
- **Alembic** — database migrations
- **PostgreSQL 15** — relational database
- **Pydantic v2** — request/response validation
- **Google Gemini 2.5 Flash** — AI patient summaries (optional)

## API Reference

All endpoints are prefixed with `/api/v1`.

### Health
| Method | Endpoint  | Description        |
|--------|-----------|--------------------|
| GET    | `/health` | Health check       |

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
| Component library | shadcn/ui | Unstyled Radix primitives give full control over branding; no CSS-in-JS runtime |
| Form handling | React Hook Form + Zod | Zod schemas mirror Pydantic models; validation runs on both client and server |
| Service layer | Separate services/ | Keeps routers thin; business logic is testable independently |
| AI summaries | On-demand + cached | Summary only generated when user clicks "Generate"; cached 10min to avoid API waste |
| Pagination | Server-side | Handles 100+ patients efficiently; `page`/`page_size` params |
| Search | Debounced (300ms) | Non-blocking UI; only fires API call after user stops typing |

## Stretch Goals

I chose **two** stretch goals that best demonstrate backend maturity and code quality:

1. **Database migrations with Alembic** (Advanced Backend) — Versioned schema changes via `alembic/versions/`. The startup script runs `alembic upgrade head` automatically, so any developer can reproduce the exact database state. This also makes it straightforward to evolve the schema over time without manual SQL.

2. **Unit tests for API endpoints** (Testing & Quality) — 33 pytest tests covering all CRUD operations, validation edge cases (invalid email, unknown blood type, empty names), pagination, sorting, filtering, and error responses. Tests run against an in-memory SQLite database for speed: `docker compose exec backend pytest -v`.

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
# Backend
docker compose exec backend pytest -v

# Frontend
cd frontend && npm test
```

## Environment Variables

See `.env.example` for all available configuration:

| Variable          | Required | Default    | Description                     |
|-------------------|----------|------------|---------------------------------|
| POSTGRES_USER     | No       | postgres   | Database user                   |
| POSTGRES_PASSWORD | No       | password   | Database password               |
| POSTGRES_DB       | No       | cura       | Database name                   |
| DATABASE_URL      | Auto     | —          | Built from above in compose     |
| GEMINI_API_KEY    | No       | —          | Google Gemini API key           |
| VITE_API_URL      | No       | /api/v1    | Frontend API base URL           |
