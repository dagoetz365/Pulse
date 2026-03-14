# Pulse Healthcare - Codebase Documentation

A full-stack healthcare patient management dashboard with AI-powered clinical summaries. Built with React + TypeScript on the frontend and FastAPI + PostgreSQL on the backend, orchestrated with Docker Compose.

---

## Table of Contents

1. [How to Access the App](#how-to-access-the-app)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Backend Files](#backend-files)
5. [Frontend Files](#frontend-files)
6. [Database Schema](#database-schema)
7. [API Endpoints](#api-endpoints)
8. [Testing](#testing)

---

## How to Access the App

### With Docker (Recommended)

```bash
# 1. Copy the environment file
cp .env.example .env

# 2. Start all services (PostgreSQL, Backend, Frontend)
docker compose up --build
```

This automatically runs database migrations, seeds 18 sample patients, and starts all services.

| Service    | URL                          |
|------------|------------------------------|
| Frontend   | http://localhost:5173         |
| Backend API| http://localhost:8000/api/v1  |
| API Docs   | http://localhost:8000/docs    |
| Database   | localhost:5432                |

### Without Docker (Local Development)

**Backend:**
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
# Make sure PostgreSQL is running locally, then:
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

### Environment Variables

Copy `.env.example` to `.env`:
```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password
POSTGRES_DB=pulse
DATABASE_URL=postgresql://postgres:password@db:5432/pulse
GEMINI_API_KEY=your_gemini_api_key_here  # Optional - template fallback without it
```

### Frontend Routes

| Route               | Page                 | Description                                        |
|----------------------|----------------------|---------------------------------------------------|
| `/`                  | Dashboard            | Stats, donut chart, critical patients, recent list |
| `/patients`          | Patient List         | Paginated table with search, filter, and sort      |
| `/patients/new`      | Create Patient       | Form to add a new patient                          |
| `/patients/:id`      | Patient Detail       | Two-panel: info + notes/labs/AI summary            |
| `/patients/:id/edit` | Edit Patient         | Pre-filled edit form                               |
| `/settings`          | Settings             | User preferences and notifications                 |

---

## Technology Stack

| Layer            | Technology                       | Purpose                                 |
|------------------|----------------------------------|-----------------------------------------|
| Frontend UI      | React 18 + TypeScript            | Component-based UI                      |
| UI Components    | shadcn/ui (Radix primitives)     | Accessible, unstyled components         |
| Styling          | Tailwind CSS                     | Utility-first CSS                       |
| Server State     | TanStack Query v5                | Caching, deduplication, refetching      |
| Client State     | Zustand                          | Lightweight state (filters, settings)   |
| Forms            | React Hook Form + Zod            | Type-safe form validation               |
| Routing          | React Router v6                  | Client-side routing                     |
| Charts           | Recharts                         | Interactive donut chart                 |
| HTTP Client      | Axios                            | API requests with interceptors          |
| Build Tool       | Vite                             | Fast dev server with HMR                |
| Backend API      | FastAPI                          | Async Python web framework              |
| Database         | PostgreSQL 15                    | Relational DB (ARRAY columns, UUID PKs) |
| ORM              | SQLAlchemy 2.0                   | Python ORM                              |
| Migrations       | Alembic                          | Versioned database migrations           |
| Validation       | Pydantic v2                      | Schema validation                       |
| AI               | Google Gemini 2.5 Flash          | Clinical narrative generation           |
| Testing          | pytest                           | 48 backend tests (in-memory SQLite)     |
| Containerization | Docker + Docker Compose          | Multi-container orchestration           |

---

## Project Structure

```
Pulse/
├── .env.example                    # Environment variable template
├── docker-compose.yml              # Orchestrates db, backend, frontend
│
├── backend/                        # Python FastAPI backend
│   ├── app/
│   │   ├── main.py                 # FastAPI app entry point
│   │   ├── config.py               # Settings from env vars
│   │   ├── database.py             # SQLAlchemy engine and session
│   │   ├── dependencies.py         # Dependency injection (DB, pagination)
│   │   ├── models/                 # SQLAlchemy ORM models
│   │   │   ├── patient.py
│   │   │   ├── note.py
│   │   │   └── lab.py
│   │   ├── schemas/                # Pydantic validation schemas
│   │   │   ├── common.py
│   │   │   ├── patient.py
│   │   │   ├── note.py
│   │   │   └── lab.py
│   │   ├── routers/                # API endpoint definitions
│   │   │   ├── health.py
│   │   │   ├── patients.py
│   │   │   ├── notes.py
│   │   │   └── labs.py
│   │   └── services/               # Business logic layer
│   │       ├── patient_service.py
│   │       ├── note_service.py
│   │       ├── lab_service.py
│   │       └── gemini_service.py
│   ├── scripts/
│   │   └── seed.py                 # Seeds 18 sample patients (idempotent)
│   ├── alembic/                    # Database migration files
│   │   └── versions/
│   │       ├── 0001_initial_tables.py
│   │       └── 0002_clinical_fields.py
│   ├── tests/                      # pytest test suite
│   │   ├── conftest.py
│   │   ├── test_health.py
│   │   ├── test_patients.py
│   │   ├── test_notes.py
│   │   └── test_labs.py
│   ├── requirements.txt
│   ├── start.sh                    # Container startup: migrate -> seed -> serve
│   ├── alembic.ini
│   └── Dockerfile
│
└── frontend/                       # React + TypeScript frontend
    ├── src/
    │   ├── main.tsx                # React DOM entry point
    │   ├── App.tsx                 # Router, QueryClient, ErrorBoundary
    │   ├── index.css               # Global styles
    │   ├── types/                  # TypeScript interfaces
    │   │   ├── patient.ts
    │   │   ├── note.ts
    │   │   └── lab.ts
    │   ├── lib/                    # Utilities and API client
    │   │   ├── api.ts
    │   │   ├── queryKeys.ts
    │   │   └── utils.ts
    │   ├── hooks/                  # React Query hooks
    │   │   ├── usePatients.ts
    │   │   ├── usePatient.ts
    │   │   ├── useNotes.ts
    │   │   ├── useLabs.ts
    │   │   ├── useSummary.ts
    │   │   ├── usePatientMutations.ts
    │   │   ├── useNoteMutations.ts
    │   │   ├── useLabMutations.ts
    │   │   └── useDebounce.ts
    │   ├── store/                  # Zustand state management
    │   │   ├── patientStore.ts
    │   │   ├── settingsStore.ts
    │   │   └── uiStore.ts
    │   ├── pages/                  # Route page components
    │   │   ├── DashboardPage.tsx
    │   │   ├── PatientsPage.tsx
    │   │   ├── PatientDetailPage.tsx
    │   │   ├── PatientCreatePage.tsx
    │   │   ├── PatientEditPage.tsx
    │   │   ├── SettingsPage.tsx
    │   │   └── NotFoundPage.tsx
    │   └── components/             # Reusable UI components
    │       ├── layout/             # AppShell, Sidebar, Header
    │       ├── patients/           # PatientTable, PatientForm, Filters, etc.
    │       ├── notes/              # NoteList, NoteCard, AddNoteForm
    │       ├── labs/               # LabList, LabCard, AddLabForm
    │       ├── summary/            # SummaryPanel (AI summary)
    │       ├── dashboard/          # StatusChart (donut chart)
    │       ├── common/             # ErrorBoundary, PageHeader, EmptyState, Pagination
    │       └── ui/                 # shadcn/ui primitives (button, card, dialog, etc.)
    ├── vite.config.ts
    ├── tailwind.config.ts
    ├── tsconfig.json
    ├── package.json
    ├── index.html
    └── Dockerfile
```

---

## Backend Files

### `backend/app/main.py` - Application Entry Point

Creates the FastAPI application, sets up CORS middleware, request logging, and mounts all routers.

```python
app = FastAPI(
    title="Pulse Healthcare API",
    description="Healthcare patient management dashboard API",
    version="1.0.0",
    lifespan=lifespan,
)

# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.perf_counter()
    response = await call_next(request)
    elapsed_ms = (time.perf_counter() - start) * 1000
    logger.info("%s %s %d %.1fms", request.method, request.url.path, response.status_code, elapsed_ms)
    return response

# CORS + Router registration
app.add_middleware(CORSMiddleware, allow_origins=settings.CORS_ORIGINS, ...)
app.include_router(patients.router, prefix="/api/v1/patients", tags=["Patients"])
app.include_router(notes.router, prefix="/api/v1/patients", tags=["Notes"])
app.include_router(labs.router, prefix="/api/v1/patients", tags=["Labs"])
```

---

### `backend/app/config.py` - Configuration

Loads settings from environment variables and `.env` file using Pydantic Settings.

```python
class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://postgres:password@db:5432/pulse"
    GEMINI_API_KEY: str = ""
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://frontend:5173",
        "http://localhost:3000",
    ]

    class Config:
        env_file = ".env"

settings = Settings()
```

---

### `backend/app/database.py` - Database Connection

Creates the SQLAlchemy engine with connection pooling and the session factory.

```python
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,   # reconnect after db restart
    pool_size=5,
    max_overflow=10,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
```

---

### `backend/app/dependencies.py` - Dependency Injection

Provides the database session and pagination parameters as FastAPI dependencies.

```python
def get_db() -> Generator:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class PaginationParams:
    def __init__(
        self,
        page: int = Query(1, ge=1, description="Page number"),
        page_size: int = Query(20, ge=1, le=100, description="Items per page"),
        search: str = Query("", description="Search by name or email"),
        sort_by: str = Query("last_name", description="Field to sort by"),
        sort_order: str = Query("asc", pattern="^(asc|desc)$"),
        status: str | None = Query(None, description="Filter by status"),
    ):
        ...
```

---

### `backend/app/models/patient.py` - Patient Model

SQLAlchemy model with 22 columns including PostgreSQL ARRAY fields for allergies, conditions, and family history. Uses UUID primary keys.

```python
class Patient(Base):
    __tablename__ = "patients"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    date_of_birth = Column(Date, nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    blood_type = Column(String(5))              # A+, B-, O+, AB-, etc.
    allergies = Column(ARRAY(String), server_default="{}")
    conditions = Column(ARRAY(String), server_default="{}")
    status = Column(String(20), nullable=False, default="active")
    # ... insurance, history, consent fields ...

    notes = relationship("Note", back_populates="patient", cascade="all, delete-orphan")
    labs = relationship("Lab", back_populates="patient", cascade="all, delete-orphan")
```

---

### `backend/app/models/note.py` - Note Model

Clinical notes with foreign key to patient and cascade delete.

```python
class Note(Base):
    __tablename__ = "notes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    content = Column(Text, nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

    patient = relationship("Patient", back_populates="notes")
```

---

### `backend/app/models/lab.py` - Lab Model

Lab test results with status tracking (ordered -> in_progress -> completed).

```python
class Lab(Base):
    __tablename__ = "labs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    test_name = Column(String(255), nullable=False)
    ordered_date = Column(DateTime(timezone=True), server_default=func.now())
    status = Column(String(20), nullable=False, default="ordered")  # ordered/in_progress/completed
    result = Column(Text)
    result_date = Column(DateTime(timezone=True))
    notes = Column(Text)

    patient = relationship("Patient", back_populates="labs")
```

---

### `backend/app/schemas/patient.py` - Patient Schemas

Pydantic v2 schemas for request/response validation with computed fields for `age` and `full_name`.

```python
BLOOD_TYPES = {"A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"}
STATUSES = {"active", "inactive", "critical"}

class PatientCreate(PatientBase):
    # Inherits all fields with validators for blood_type, status, and name length
    pass

class PatientUpdate(BaseModel):
    # All fields optional for partial updates
    first_name: Optional[str] = None
    status: Optional[str] = None
    # ...

class PatientOut(PatientBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    @computed_field
    @property
    def age(self) -> int:
        today = date.today()
        dob = self.date_of_birth
        return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))

    @computed_field
    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}"
```

---

### `backend/app/schemas/common.py` - Generic Paginated Response

A generic Pydantic model for paginated API responses.

```python
class PaginatedResponse(BaseModel, Generic[T]):
    items: list[T]
    total: int
    page: int
    page_size: int
    total_pages: int
```

---

### `backend/app/routers/patients.py` - Patient Endpoints

Full CRUD operations for patients with pagination, search, sorting, and filtering.

```python
@router.get("", response_model=PaginatedResponse[PatientOut])
def list_patients(params: PaginationParams = Depends(), db: Session = Depends(get_db)):
    return PatientService(db).list_patients(params)

@router.post("", response_model=PatientOut, status_code=status.HTTP_201_CREATED)
def create_patient(data: PatientCreate, db: Session = Depends(get_db)):
    return PatientService(db).create_patient(data)

@router.put("/{patient_id}", response_model=PatientOut)
def update_patient(patient_id: UUID, data: PatientUpdate, db: Session = Depends(get_db)):
    patient = PatientService(db).update_patient(patient_id, data)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient

@router.delete("/{patient_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_patient(patient_id: UUID, db: Session = Depends(get_db)):
    ...
```

---

### `backend/app/routers/notes.py` - Notes & AI Summary Endpoints

CRUD for clinical notes plus AI-powered summary generation.

```python
@router.get("/{patient_id}/notes", response_model=list[NoteOut])
def get_notes(patient_id: UUID, db: Session = Depends(get_db)):
    ...

@router.post("/{patient_id}/notes", response_model=NoteOut, status_code=status.HTTP_201_CREATED)
def add_note(patient_id: UUID, data: NoteCreate, db: Session = Depends(get_db)):
    if not data.content.strip():
        raise HTTPException(status_code=400, detail="Note content cannot be empty")
    return NoteService(db).add_note(patient_id, data)

@router.get("/{patient_id}/summary", response_model=SummaryResponse)
def get_summary(patient_id: UUID, db: Session = Depends(get_db)):
    patient = PatientService(db).get_patient(patient_id)
    notes = NoteService(db).get_notes(patient_id)
    summary = GeminiService().generate_summary(patient, notes)
    return SummaryResponse(summary=summary, patient_id=str(patient_id), generated_at=...)
```

---

### `backend/app/routers/labs.py` - Lab Endpoints

CRUD for lab orders and results.

```python
@router.get("/{patient_id}/labs", response_model=list[LabOut])
def get_labs(patient_id: UUID, db: Session = Depends(get_db)):
    ...

@router.post("/{patient_id}/labs", response_model=LabOut, status_code=status.HTTP_201_CREATED)
def add_lab(patient_id: UUID, data: LabCreate, db: Session = Depends(get_db)):
    ...

@router.put("/{patient_id}/labs/{lab_id}", response_model=LabOut)
def update_lab(patient_id: UUID, lab_id: UUID, data: LabUpdate, db: Session = Depends(get_db)):
    ...
```

---

### `backend/app/routers/health.py` - Health Check

Simple health check endpoint.

```python
@router.get("/health")
def health_check():
    return {"status": "ok"}
```

---

### `backend/app/services/patient_service.py` - Patient Business Logic

Handles list (with pagination/search/sort/filter), get, create, update, and delete operations.

```python
class PatientService:
    def __init__(self, db: Session):
        self.db = db

    def list_patients(self, params: PaginationParams) -> dict:
        query = self.db.query(Patient)
        if params.search:
            term = f"%{params.search}%"
            query = query.filter(or_(
                Patient.first_name.ilike(term),
                Patient.last_name.ilike(term),
                Patient.email.ilike(term),
            ))
        if params.status:
            query = query.filter(Patient.status == params.status)
        # Sorting with injection prevention
        sort_field = params.sort_by if params.sort_by in SORTABLE_FIELDS else "last_name"
        col = getattr(Patient, sort_field, Patient.last_name)
        query = query.order_by(asc(col) if params.sort_order == "asc" else desc(col))
        total = query.count()
        items = query.offset((params.page - 1) * params.page_size).limit(params.page_size).all()
        return {"items": items, "total": total, "page": params.page, ...}

    def create_patient(self, data: PatientCreate) -> Patient:
        patient = Patient(**data.model_dump())
        self.db.add(patient)
        self.db.commit()
        self.db.refresh(patient)
        return patient
```

---

### `backend/app/services/gemini_service.py` - AI Summary Service

Generates clinical summaries using Google Gemini 2.5 Flash, with a template fallback when no API key is configured.

```python
class GeminiService:
    def __init__(self) -> None:
        genai.configure(api_key=settings.GEMINI_API_KEY)
        self.model = genai.GenerativeModel("gemini-2.5-flash")

    def generate_summary(self, patient: "Patient", notes: list["Note"]) -> str:
        if not settings.GEMINI_API_KEY:
            return self._template_summary(patient, notes)
        prompt = f"""You are a clinical documentation assistant. Generate a concise,
        professional patient summary.
        Patient: {patient.first_name} {patient.last_name}
        Age: {age}
        Known Conditions: {', '.join(patient.conditions)}
        Clinical Notes (chronological): {notes_text}
        ..."""
        response = self.model.generate_content(prompt)
        return response.text

    def _template_summary(self, patient, notes) -> str:
        # Fallback: generates a structured text summary without AI
        return f"{patient.first_name} {patient.last_name} is a {age}-year-old patient..."
```

---

### `backend/scripts/seed.py` - Database Seeder

Idempotent script that seeds 18 sample patients with 2-5 clinical notes each and 1-3 lab results per patient. Only runs if the database is empty.

```python
def seed_if_empty():
    db = SessionLocal()
    count = db.query(Patient).count()
    if count > 0:
        print(f"Database already has {count} patients. Skipping seed.")
        return
    for p_data in PATIENTS:
        patient = Patient(**p_data)
        db.add(patient)
        db.flush()
        for _ in range(random.randint(2, 5)):
            note = Note(patient_id=patient.id, content=random.choice(NOTE_TEMPLATES), ...)
            db.add(note)
        # Seed 1-3 labs per patient
        for lab_data in random.sample(LAB_TEMPLATES, k=random.randint(1, 3)):
            lab = Lab(patient_id=patient.id, test_name=lab_data["test_name"], ...)
            db.add(lab)
    db.commit()
```

---

### `docker-compose.yml` - Docker Orchestration

Defines three services: PostgreSQL database, FastAPI backend, and Vite frontend with hot reloading.

```yaml
services:
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-postgres}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-password}
      POSTGRES_DB: ${POSTGRES_DB:-pulse}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-postgres}"]

  backend:
    build: ./backend
    env_file: .env
    volumes:
      - ./backend:/app          # hot reload
    ports:
      - "8000:8000"
    depends_on:
      db:
        condition: service_healthy

  frontend:
    build: ./frontend
    volumes:
      - ./frontend:/app         # hot reload
    ports:
      - "5173:5173"
    depends_on:
      - backend
```

---

## Frontend Files

### `frontend/src/main.tsx` - React Entry Point

Mounts the React app to the DOM with StrictMode.

```tsx
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

---

### `frontend/src/App.tsx` - Application Root

Sets up React Router, TanStack Query provider, error boundary, and lazy-loaded routes for code splitting.

```tsx
const DashboardPage = lazy(() =>
  import("@/pages/DashboardPage").then((m) => ({ default: m.DashboardPage }))
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 30, retry: 1 },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <BrowserRouter>
          <Routes>
            <Route element={<AppShell />}>
              <Route path="/" element={<Suspense fallback={<PageLoader />}><DashboardPage /></Suspense>} />
              <Route path="/patients" element={...} />
              <Route path="/patients/new" element={...} />
              <Route path="/patients/:id" element={...} />
              <Route path="/patients/:id/edit" element={...} />
              <Route path="/settings" element={...} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ErrorBoundary>
      <Toaster />
    </QueryClientProvider>
  );
}
```

---

### `frontend/src/lib/api.ts` - Axios API Client

Configured with a base URL of `/api/v1` (proxied to the backend by Vite in development). Includes an error interceptor that extracts meaningful error messages.

```tsx
export const api = axios.create({
  baseURL: "/api/v1",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const detail = error.response?.data?.detail;
    const message =
      typeof detail === "string" ? detail
      : Array.isArray(detail) ? detail.map((e: { msg: string }) => e.msg).join(", ")
      : "An unexpected error occurred";
    return Promise.reject(new Error(message));
  }
);
```

---

### `frontend/src/lib/queryKeys.ts` - TanStack Query Keys

Centralized query key factory for cache management and invalidation.

```tsx
export const queryKeys = {
  patients: {
    all: ["patients"] as const,
    list: (params: object) => ["patients", "list", params] as const,
    detail: (id: string) => ["patients", "detail", id] as const,
  },
  notes: {
    list: (patientId: string) => ["notes", patientId] as const,
  },
  labs: {
    list: (patientId: string) => ["labs", patientId] as const,
  },
  summary: {
    get: (patientId: string) => ["summary", patientId] as const,
  },
};
```

---

### `frontend/src/types/patient.ts` - Patient TypeScript Types

Defines the Patient interface and related types that mirror the backend Pydantic schemas.

```tsx
export type PatientStatus = "active" | "inactive" | "critical";
export type BloodType = "A+" | "A-" | "B+" | "B-" | "O+" | "O-" | "AB+" | "AB-";

export interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;            // computed by backend
  age: number;                  // computed by backend
  date_of_birth: string;
  email: string;
  blood_type: BloodType | null;
  allergies: string[];
  conditions: string[];
  status: PatientStatus;
  // ... insurance, history, consent fields
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}
```

---

### `frontend/src/hooks/usePatients.ts` - Patient List Hook

Fetches a paginated list of patients with search, sort, and filter parameters.

```tsx
export function usePatients(params: PatientListParams) {
  return useQuery({
    queryKey: queryKeys.patients.list(params),
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Patient>>("/patients", {
        params: { ...params, status: params.status || undefined },
      });
      return data;
    },
    placeholderData: (prev) => prev,  // keep previous data while fetching next page
  });
}
```

---

### `frontend/src/hooks/usePatientMutations.ts` - Patient Mutation Hooks

Provides create, update, and delete mutation hooks with cache invalidation and toast notifications.

```tsx
export function useCreatePatient() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (data: PatientCreate) => api.post("/patients", data).then((r) => r.data),
    onSuccess: (patient) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.patients.all });
      toast({ title: "Patient created", description: `${patient.full_name} has been added.` });
      navigate(`/patients/${patient.id}`);
    },
    onError: (err: Error) =>
      toast({ title: "Error", description: err.message, variant: "destructive" }),
  });
}

export function useUpdatePatient(id: string) { ... }
export function useDeletePatient() { ... }
```

---

### `frontend/src/store/patientStore.ts` - Patient Filter Store

Zustand store managing search, status filter, sort, and pagination state for the patient list.

```tsx
export const usePatientStore = create<PatientFilters>((set) => ({
  search: "",
  status: "",
  sortBy: "last_name",
  sortOrder: "asc",
  page: 1,
  setSearch: (search) => set({ search, page: 1 }),   // resets to page 1
  setStatus: (status) => set({ status, page: 1 }),
  setSortBy: (sortBy) => set({ sortBy }),
  setSortOrder: (sortOrder) => set({ sortOrder }),
  setPage: (page) => set({ page }),
  resetFilters: () => set({ search: "", status: "", sortBy: "last_name", sortOrder: "asc", page: 1 }),
}));
```

---

### `frontend/src/pages/DashboardPage.tsx` - Dashboard

Displays stat cards (total, active, critical, inactive), an interactive donut chart, critical patients panel, and recent patients. All stat cards are clickable and navigate to the filtered patient list.

```tsx
export function DashboardPage() {
  const navigate = useNavigate();
  const { setStatus, resetFilters } = usePatientStore();

  const { data: allData, isLoading } = usePatients({ page: 1, page_size: 100 });
  const { data: criticalData } = usePatients({ page: 1, page_size: 5, status: "critical" });

  return (
    <div className="p-6 space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Patients" value={allData?.total ?? 0} icon={Users} ... />
        <StatCard title="Active" value={activeCount} icon={UserCheck} ... />
        <StatCard title="Critical" value={criticalCount} icon={AlertTriangle} ... />
        <StatCard title="Inactive" value={inactiveCount} icon={UserX} ... />
      </div>
      {/* Donut chart + Critical patients side by side */}
      {/* Recent patients list */}
    </div>
  );
}
```

---

### `frontend/src/pages/PatientDetailPage.tsx` - Patient Detail

Two-panel layout: left column shows contact, insurance, medical info, and AI summary; right column shows clinical notes and lab results.

```tsx
export function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: patient, isLoading, isError } = usePatient(id!);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left column: patient info cards */}
      <div className="lg:col-span-1 space-y-5">
        <Card> {/* Contact info */} </Card>
        <Card> {/* Insurance */} </Card>
        <Card> {/* Medical: blood type, allergies, conditions */} </Card>
        <Card> <SummaryPanel patientId={id} /> </Card>
      </div>
      {/* Right column: notes and labs */}
      <div className="lg:col-span-2 space-y-6">
        <Card> <NoteList patientId={id} /> </Card>
        <Card> <LabList patientId={id} /> </Card>
      </div>
    </div>
  );
}
```

---

### `frontend/src/components/layout/` - Layout Components

- **`AppShell.tsx`** - Main layout wrapper with sidebar, header, and `<Outlet />` for routed content
- **`Sidebar.tsx`** - Navigation menu with links to Dashboard, Patients, and Settings
- **`Header.tsx`** - Top bar with user avatar and dropdown menu

### `frontend/src/components/patients/` - Patient Components

- **`PatientTable.tsx`** - Sortable data table with inline status badges and action buttons
- **`PatientForm.tsx`** - Create/edit form with Zod validation, used by both Create and Edit pages
- **`PatientFilters.tsx`** - Search input (350ms debounce), status dropdown, sort controls
- **`DeletePatientDialog.tsx`** - Confirmation dialog before deleting a patient
- **`StatusBadge.tsx`** - Color-coded badge component for active/inactive/critical status

### `frontend/src/components/notes/` - Note Components

- **`NoteList.tsx`** - Chronological list of clinical notes with add form at top
- **`NoteCard.tsx`** - Individual note display with timestamp
- **`AddNoteForm.tsx`** - Form to add a new clinical note
- **`DeleteNoteButton.tsx`** - Delete note with confirmation

### `frontend/src/components/labs/` - Lab Components

- **`LabList.tsx`** - Lab results list with add form
- **`LabCard.tsx`** - Individual lab result with status badge
- **`AddLabForm.tsx`** - Form to order a new lab test
- **`UpdateLabDialog.tsx`** - Dialog to update lab status and results

### `frontend/src/components/summary/SummaryPanel.tsx` - AI Summary

On-demand AI clinical summary panel. Fetches from the `/summary` endpoint when clicked.

### `frontend/src/components/dashboard/StatusChart.tsx` - Donut Chart

Interactive Recharts donut chart showing patient status distribution. Segments are clickable.

### `frontend/src/components/common/` - Shared Components

- **`ErrorBoundary.tsx`** - React error boundary
- **`PageHeader.tsx`** - Reusable page title with optional action buttons
- **`EmptyState.tsx`** - Empty state UI with icon and message
- **`Pagination.tsx`** - Pagination controls (previous/next, page numbers)

### `frontend/src/components/ui/` - shadcn/ui Primitives

Pre-built accessible components: `button`, `card`, `dialog`, `input`, `textarea`, `select`, `form`, `badge`, `table`, `dropdown-menu`, `switch`, `toast`, `skeleton`, `separator`, `label`.

---

## Database Schema

### Tables

**patients** (22 columns)
| Column                    | Type               | Notes                          |
|---------------------------|--------------------|--------------------------------|
| id                        | UUID (PK)          | Auto-generated                 |
| first_name                | VARCHAR(100)       | Required                       |
| last_name                 | VARCHAR(100)       | Required                       |
| date_of_birth             | DATE               | Required                       |
| email                     | VARCHAR(255)       | Unique, indexed                |
| phone                     | VARCHAR(30)        | Optional                       |
| address                   | VARCHAR(500)       | Optional                       |
| blood_type                | VARCHAR(5)         | A+, A-, B+, B-, O+, O-, AB+, AB- |
| allergies                 | TEXT[]             | PostgreSQL array               |
| conditions                | TEXT[]             | PostgreSQL array               |
| status                    | VARCHAR(20)        | active / inactive / critical   |
| last_visit                | DATE               | Optional                       |
| insurance_provider        | VARCHAR(255)       | Optional                       |
| insurance_policy_number   | VARCHAR(100)       | Optional                       |
| insurance_group_number    | VARCHAR(100)       | Optional                       |
| medical_history           | TEXT               | Optional                       |
| family_history            | TEXT[]             | PostgreSQL array               |
| consent_forms             | TEXT[]             | PostgreSQL array               |
| created_at                | TIMESTAMPTZ        | Auto-set                       |
| updated_at                | TIMESTAMPTZ        | Auto-updated                   |

**notes** (5 columns)
| Column     | Type          | Notes                            |
|------------|---------------|----------------------------------|
| id         | UUID (PK)     | Auto-generated                   |
| patient_id | UUID (FK)     | CASCADE delete                   |
| content    | TEXT          | Required, non-empty              |
| timestamp  | TIMESTAMPTZ   | Defaults to now                  |
| created_at | TIMESTAMPTZ   | Auto-set                         |

**labs** (8 columns)
| Column       | Type          | Notes                                |
|--------------|---------------|--------------------------------------|
| id           | UUID (PK)     | Auto-generated                       |
| patient_id   | UUID (FK)     | CASCADE delete                       |
| test_name    | VARCHAR(255)  | Required                             |
| ordered_date | TIMESTAMPTZ   | Defaults to now                      |
| status       | VARCHAR(20)   | ordered / in_progress / completed    |
| result       | TEXT          | Set when completed                   |
| result_date  | TIMESTAMPTZ   | Set when completed                   |
| notes        | TEXT          | Optional                             |
| created_at   | TIMESTAMPTZ   | Auto-set                             |

### Migrations

- `0001_initial_tables.py` - Creates `patients` and `notes` tables
- `0002_clinical_fields.py` - Adds insurance, history, consent fields to `patients`; creates `labs` table

---

## API Endpoints

All endpoints are under `/api/v1` except the health check.

### Health
| Method | Endpoint    | Response           |
|--------|-------------|--------------------|
| GET    | `/health`   | `{"status": "ok"}` |

### Patients
| Method | Endpoint           | Description                                    |
|--------|--------------------|------------------------------------------------|
| GET    | `/patients`        | List patients (paginated, searchable, sortable)|
| GET    | `/patients/{id}`   | Get single patient with computed age/full_name |
| POST   | `/patients`        | Create patient (201)                           |
| PUT    | `/patients/{id}`   | Partial update patient                         |
| DELETE | `/patients/{id}`   | Delete patient + cascade notes/labs (204)      |

**Query params for GET /patients:** `page`, `page_size`, `search`, `status`, `sort_by`, `sort_order`

### Notes
| Method | Endpoint                          | Description              |
|--------|-----------------------------------|--------------------------|
| GET    | `/patients/{id}/notes`            | List notes (newest first)|
| POST   | `/patients/{id}/notes`            | Add note (201)           |
| DELETE | `/patients/{id}/notes/{noteId}`   | Delete note (204)        |

### Labs
| Method | Endpoint                          | Description              |
|--------|-----------------------------------|--------------------------|
| GET    | `/patients/{id}/labs`             | List lab results         |
| POST   | `/patients/{id}/labs`             | Order new lab (201)      |
| PUT    | `/patients/{id}/labs/{labId}`     | Update lab status/result |
| DELETE | `/patients/{id}/labs/{labId}`     | Delete lab (204)         |

### AI Summary
| Method | Endpoint                   | Description                         |
|--------|----------------------------|-------------------------------------|
| GET    | `/patients/{id}/summary`   | Generate AI clinical summary (200/503) |

---

## Testing

**48 pytest tests** using an in-memory SQLite database (no PostgreSQL required).

```bash
# Run inside Docker
docker compose exec backend pytest -v

# Run locally
cd backend && pytest -v
```

### Test Files

| File                | Tests | Coverage                                               |
|---------------------|-------|--------------------------------------------------------|
| `test_health.py`    | 1     | Health check endpoint                                  |
| `test_patients.py`  | 23    | CRUD, validation, pagination, sorting, filtering       |
| `test_notes.py`     | 11    | Add/list/delete notes, empty content, ownership        |
| `test_labs.py`      | 14    | CRUD, status validation, partial updates               |

### Test Configuration (`conftest.py`)

Uses SQLite for speed, overrides the `get_db` dependency, and provides fixtures for sample patients, notes, and labs.
