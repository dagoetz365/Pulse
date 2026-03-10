# Cura — Build Progress & Interview Prep

Healthcare patient management dashboard built for Ascertain take-home assessment.

**App**: Cura | **Stack**: React 18 + TypeScript + Vite, FastAPI, PostgreSQL, Docker | **AI**: Gemini 2.5 Flash

---

## Session Log

### Session 1 — 2026-03-09

**Planning Phase**
- [x] Read and analyzed full take-home prompt (Parts 1-5 + stretch goals)
- [x] Researched UI references: Preclinic healthcare admin template for layout structure
- [x] Studied Ascertain's actual website for brand colors (soft lavender #F0EBF8, purple accent #7C5CBF)
- [x] Decided NOT to use Ascertain logo — used neutral branding with "Cura" name
- [x] Chose app name: **Cura** (Latin for "care") — professional, medical, distinctive
- [x] Evaluated LLM options: Gemini 1.5 Flash (deprecated/dead), 2.0 Flash (retiring June 2026) → chose **Gemini 2.5 Flash** (best current free-tier model)
- [x] Defined full tech stack and architecture plan

**Part 1 — Foundation (COMPLETE)**
- [x] Initialized Vite + React 18 + TypeScript project
- [x] Configured Tailwind CSS with Ascertain brand color tokens (HSL CSS variables)
- [x] Set up shadcn/ui (13 components written manually — button, input, card, dialog, dropdown-menu, form, table, toast, etc.)
- [x] Configured React Router v6, TanStack Query v5, Zustand, React Hook Form + Zod
- [x] Set up Prettier + TypeScript strict mode
- [x] Initialized FastAPI with `GET /health` → `{"status": "ok"}`
- [x] PostgreSQL schema: patients table (UUID PK, personal info, medical info, status, timestamps)
- [x] Alembic migration: `0001_initial_tables.py` creates patients + notes tables
- [x] Seed script: 18 realistic patients + 2-5 clinical notes each, runs automatically on startup

**Part 2 — Core Dashboard (COMPLETE)**
- [x] Patient CRUD API: GET (paginated + search + sort + status filter), POST, PUT, DELETE
- [x] Responsive layout: collapsible sidebar + header + main content area
- [x] PatientTable component: sortable columns (name, age, last visit, status), search bar, status filter, pagination
- [x] Debounced search (300ms) — non-blocking
- [x] Routes: `/` (dashboard), `/patients` (list), `/patients/new`, `/patients/:id`, `/patients/:id/edit`, `*` (404)
- [x] Dashboard home page: stat cards (total, active, critical, inactive), critical patients list, recent patients list

**Part 3 — Patient Notes (COMPLETE)**
- [x] Notes API: POST (accepts timestamp + text), GET (sorted desc), DELETE
- [x] Summary API: `GET /patients/{id}/summary` — uses Gemini 2.5 Flash to synthesize narrative from profile + notes
- [x] Fallback: template-based summary when no API key configured
- [x] Notes UI: chronological list with timestamps, add form, delete with confirmation
- [x] Summary panel: on-demand generation (button click), cached 10min, loading/error states

**Part 4 — Forms (COMPLETE)**
- [x] Patient form: personal info (name, DOB, email, phone, address) + medical info (blood type, allergies, conditions, status)
- [x] React Hook Form + Zod schema validation (mirrors Pydantic backend schemas)
- [x] Client-side validation: required fields, email format, date validation
- [x] Server-side validation: Pydantic + proper HTTP status codes (422 for validation, 404 for not found)
- [x] Error messages displayed inline under fields
- [x] Network error handling with toast notifications

**Part 5 — Docker (COMPLETE)**
- [x] `backend/Dockerfile`: Python 3.11-slim, auto-runs migrations + seed + uvicorn
- [x] `frontend/Dockerfile`: Node 20-alpine, Vite dev server with HMR
- [x] `docker-compose.yml`: 3 services (db healthcheck, backend depends_on healthy, frontend)
- [x] `.env.example` with all required variables documented
- [x] Hot reload: volume mounts for both frontend and backend source code

**Stretch Goals (COMPLETE)**
- [x] Alembic migrations (production-grade, not init scripts)
- [x] Docker hot reload for both frontend and backend

### Session 2 — 2026-03-10

- [x] Fixed missing `<Toaster />` component in App.tsx (toasts wouldn't render without it)
- [x] Wrote comprehensive README.md with Quick Start, Architecture, API Reference, Design Decisions
- [ ] Initialize git with branching strategy (main → development → feature branches)
- [ ] Write backend API tests (pytest)
- [ ] Write frontend component tests
- [ ] Push to GitHub with feature branch PRs

---

## Architecture Decisions (Interview Talking Points)

| Decision | Choice | Why | Alternative Considered |
|----------|--------|-----|----------------------|
| State management | TanStack Query + Zustand | Server state in Query (caching, dedup, background refetch); UI state in Zustand (filters, sidebar) — clear separation of concerns | Redux Toolkit — too heavy for this scope; Context API — no caching |
| Component library | shadcn/ui + Tailwind | Unstyled Radix primitives = full control over Ascertain brand theming; no CSS-in-JS runtime cost; copy-paste ownership of components | MUI — opinionated styling fights custom branding; Chakra — similar tradeoff |
| Form handling | React Hook Form + Zod | Zod schemas mirror Pydantic validation shapes; controlled validation without re-renders; type inference from schema | Formik — heavier; manual validation — error-prone |
| Service layer | Separate `services/` directory | Keeps routers thin (routing + HTTP concerns only); business logic testable independently; single responsibility | Fat routers — works for small apps but doesn't scale |
| AI summaries | On-demand + 10min cache | User clicks "Generate" — avoids wasting API quota on page load; staleTime prevents redundant calls | Auto-generate on page load — expensive; no cache — wasteful |
| Pagination | Server-side with `page`/`page_size` | Handles 100+ patients efficiently; cursor-based would be better at scale but page-based is simpler and matches prompt requirements | Infinite scroll — considered but explicit pagination gives better UX for medical data |
| Search | Debounced 300ms, server-side ilike | Non-blocking UI; only hits API after user stops typing; PostgreSQL ilike handles case-insensitivity | Client-side filter — doesn't scale; full-text search — over-engineered for this scope |
| Sort field whitelist | `SORTABLE_FIELDS` set in schema | Prevents SQL injection via `sort_by` parameter; validates before query construction | Raw string interpolation — dangerous; ORM-only sort — harder to extend |
| Database IDs | UUID v4 | No sequential enumeration; safe in URLs; standard for healthcare data | Auto-increment — exposes record count; ULID — less standard |
| Migrations | Alembic | Production-grade; supports auto-generation from models; rollback capability | Init SQL scripts — no versioning; no rollback |

## What I'd Add With More Time

1. **WebSocket real-time updates** — notify other tabs when a patient is updated/deleted
2. **Role-based access control** — doctors see everything, nurses see assigned patients, admins manage users
3. **Audit logging** — who changed what, when (critical for healthcare compliance)
4. **E2E tests with Playwright** — full user journey tests (create patient → add notes → generate summary)
5. **Rate limiting** — protect API from abuse, especially the Gemini summary endpoint
6. **Request logging middleware** — structured JSON logs with request ID for debugging
7. **Data visualization** — patient status distribution chart, visit frequency trends (Recharts)
8. **Dark mode toggle** — CSS variables already support it, just need a theme switcher
9. **Virtualized table** — for 1000+ patients, use `@tanstack/react-virtual`
10. **CI/CD pipeline** — GitHub Actions for lint + type-check + test on PR

## Code Quality Highlights

- **TypeScript strict mode** — no `any` types, full type safety from API to UI
- **Computed fields** — `age` derived from DOB in Pydantic schema, never stored in DB
- **Error boundaries** — `ErrorBoundary` component wraps pages for graceful failure
- **Loading skeletons** — every data-dependent component has a skeleton state, not just spinners
- **Toast notifications** — all mutations (create/update/delete) show success/error feedback
- **Input validation** — both client (Zod) and server (Pydantic) with matching rules
- **SQL injection prevention** — sort field whitelist, parameterized queries via ORM
- **Responsive design** — sidebar collapses on mobile, grid adapts from 1 to 4 columns
- **Automatic DB seeding** — `seed_if_empty()` checks COUNT(*) before inserting, idempotent
