# Pulse Healthcare - Detailed Codebase Documentation

A full-stack healthcare patient management dashboard with AI-powered clinical summaries. Built with React + TypeScript on the frontend and FastAPI + PostgreSQL on the backend, orchestrated with Docker Compose.

This document explains **every line of code** in every file across the entire project.

---

## Table of Contents

1. [How to Access the App](#how-to-access-the-app)
2. [Backend Files](#backend-files)
3. [Frontend Files](#frontend-files)
4. [Infrastructure Files](#infrastructure-files)

---

## How to Access the App

### With Docker (Recommended)

```bash
# 1. Copy the environment file
cp .env.example .env

# 2. Start all services (PostgreSQL, Backend, Frontend)
docker compose up --build
```

| Service     | URL                          |
|-------------|------------------------------|
| Frontend    | http://localhost:5173         |
| Backend API | http://localhost:8000/api/v1  |
| API Docs    | http://localhost:8000/docs    |
| Database    | localhost:5432                |

### Without Docker

**Backend:**
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
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

```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password
POSTGRES_DB=pulse
DATABASE_URL=postgresql://postgres:password@db:5432/pulse
GEMINI_API_KEY=your_gemini_api_key_here  # Optional - template fallback without it
```

---

## Backend Files

---

### `backend/app/main.py` — Application Entry Point

This file creates the FastAPI application, sets up logging, CORS middleware, and connects all the API routers.

```python
import logging                          # Line 1: Imports Python's built-in logging module so we can log request info to the console
import time                             # Line 2: Imports the time module to measure how long each HTTP request takes to process
from contextlib import asynccontextmanager  # Line 3: Imports asynccontextmanager decorator, used to define the app's startup/shutdown lifecycle

from fastapi import FastAPI, Request    # Line 5: Imports FastAPI (the web framework class) and Request (represents an incoming HTTP request)
from fastapi.middleware.cors import CORSMiddleware  # Line 6: Imports CORS middleware — this allows the frontend (on port 5173) to make API calls to the backend (on port 8000) without being blocked by the browser's same-origin policy

from app.config import settings         # Line 8: Imports the settings object which holds DATABASE_URL, GEMINI_API_KEY, and CORS_ORIGINS loaded from environment variables
from app.routers import health, labs, notes, patients  # Line 9: Imports the four router modules — each one defines a group of API endpoints (health check, patient CRUD, notes CRUD, labs CRUD)

logger = logging.getLogger("pulse")     # Line 11: Creates a logger instance named "pulse" — all log messages from this file will be tagged with this name
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")  # Line 12: Configures logging to show INFO-level messages and above, with a format that includes the timestamp, log level (INFO/WARNING/ERROR), and the message text


@asynccontextmanager                    # Line 15: Decorator that turns the function below into an async context manager (has setup before yield and teardown after yield)
async def lifespan(app: FastAPI):       # Line 16: Defines the lifespan function — FastAPI calls this when the app starts up and shuts down. The code before `yield` runs on startup, the code after runs on shutdown
    yield                               # Line 17: yield with nothing means: no special startup or shutdown logic is needed. This is a placeholder in case you want to add database pool initialization or cleanup later


app = FastAPI(                          # Line 20: Creates the main FastAPI application instance — this is the core object that handles all HTTP requests
    title="Pulse Healthcare API",       # Line 21: Sets the API title shown in the auto-generated Swagger docs at /docs
    description="Healthcare patient management dashboard API",  # Line 22: Sets the API description shown in the Swagger docs
    version="1.0.0",                    # Line 23: Sets the API version number shown in the Swagger docs
    lifespan=lifespan,                  # Line 24: Passes the lifespan function so FastAPI knows to call it on startup/shutdown
)


@app.middleware("http")                 # Line 28: Registers the function below as HTTP middleware — it runs on EVERY incoming request before and after the route handler
async def log_requests(request: Request, call_next):  # Line 29: Defines the middleware function. `request` is the incoming HTTP request, `call_next` is a function that passes the request to the next handler (the actual route)
    start = time.perf_counter()         # Line 30: Records the current time with high precision — this is the start of the timer for measuring request duration
    response = await call_next(request) # Line 31: Passes the request to the actual route handler and waits for the response. Everything between start and this line is "before the route", everything after is "after the route"
    elapsed_ms = (time.perf_counter() - start) * 1000  # Line 32: Calculates how many milliseconds elapsed between when the request came in and when the response was ready, by subtracting start time from current time and converting seconds to milliseconds
    logger.info("%s %s %d %.1fms", request.method, request.url.path, response.status_code, elapsed_ms)  # Line 33: Logs the request info — HTTP method (GET/POST/etc), URL path (/api/v1/patients), response status code (200/404/etc), and how long it took in milliseconds
    return response                     # Line 34: Returns the response back to the client (browser/frontend)


app.add_middleware(                     # Line 37: Adds CORS (Cross-Origin Resource Sharing) middleware to the app
    CORSMiddleware,                     # Line 38: Specifies we're adding the CORSMiddleware class
    allow_origins=settings.CORS_ORIGINS,  # Line 39: Sets which frontend URLs are allowed to call this API — loaded from settings (localhost:5173, frontend:5173, localhost:3000)
    allow_credentials=True,             # Line 40: Allows the frontend to send cookies and authentication headers with requests
    allow_methods=["*"],                # Line 41: Allows all HTTP methods (GET, POST, PUT, DELETE, OPTIONS, etc.)
    allow_headers=["*"],                # Line 42: Allows all HTTP headers to be sent in requests
)

app.include_router(health.router, tags=["Health"])  # Line 45: Mounts the health check router at the root path — the /health endpoint. The tag groups it in Swagger docs
app.include_router(patients.router, prefix="/api/v1/patients", tags=["Patients"])  # Line 46: Mounts the patients router at /api/v1/patients — so all patient endpoints start with that URL prefix
app.include_router(notes.router, prefix="/api/v1/patients", tags=["Notes"])  # Line 47: Mounts the notes router at /api/v1/patients — notes are nested under patients (e.g., /api/v1/patients/{id}/notes)
app.include_router(labs.router, prefix="/api/v1/patients", tags=["Labs"])  # Line 48: Mounts the labs router at /api/v1/patients — labs are also nested under patients (e.g., /api/v1/patients/{id}/labs)
```

---

### `backend/app/config.py` — Configuration

This file loads all application settings from environment variables using Pydantic Settings.

```python
from pydantic_settings import BaseSettings  # Line 1: Imports BaseSettings from pydantic-settings — a class that automatically reads values from environment variables and .env files

class Settings(BaseSettings):           # Line 4: Defines a Settings class that inherits from BaseSettings. Each attribute becomes a setting that can be overridden by an environment variable of the same name
    DATABASE_URL: str = "postgresql://postgres:password@db:5432/pulse"  # Line 5: The PostgreSQL connection string. Default points to the Docker container hostname "db". If a DATABASE_URL env var exists, it overrides this default
    GEMINI_API_KEY: str = ""            # Line 6: The Google Gemini API key for AI summaries. Empty string means AI is disabled and the app falls back to template-based summaries
    CORS_ORIGINS: list[str] = [         # Line 7: A list of URLs that are allowed to make cross-origin requests to this API
        "http://localhost:5173",        # Line 8: The Vite dev server URL when running the frontend locally
        "http://frontend:5173",         # Line 9: The Docker container hostname for the frontend service
        "http://localhost:3000",        # Line 10: An alternative frontend port, in case someone runs it on port 3000
    ]

    class Config:                       # Line 13: Inner Config class that tells Pydantic Settings where to find additional configuration
        env_file = ".env"               # Line 14: Tells Pydantic to also read from a .env file in the current directory. Environment variables take priority over .env values

settings = Settings()                   # Line 17: Creates a single global instance of Settings. This is imported by other files (main.py, database.py, gemini_service.py) to access configuration values
```

---

### `backend/app/database.py` — Database Connection

This file creates the SQLAlchemy database engine (connection pool) and session factory.

```python
from sqlalchemy import create_engine    # Line 1: Imports create_engine — a function that creates a database connection pool that manages multiple connections to PostgreSQL
from sqlalchemy.orm import declarative_base, sessionmaker  # Line 2: Imports declarative_base (creates the base class that all ORM models inherit from) and sessionmaker (a factory that creates database sessions for queries)

from app.config import settings         # Line 4: Imports the settings object to get the DATABASE_URL connection string

engine = create_engine(                 # Line 6: Creates the SQLAlchemy engine — this manages a pool of database connections
    settings.DATABASE_URL,              # Line 7: The PostgreSQL connection URL (e.g., postgresql://postgres:password@db:5432/pulse)
    pool_pre_ping=True,                 # Line 8: Before using a connection from the pool, send a quick "ping" to make sure it's still alive. This handles cases where the database restarted and old connections are stale
    pool_size=5,                        # Line 9: Keep 5 connections open in the pool at all times, ready to handle requests
    max_overflow=10,                    # Line 10: Allow up to 10 additional connections beyond the pool_size during traffic spikes (total max = 15 connections)
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)  # Line 13: Creates a session factory. autocommit=False means you must explicitly call commit() to save changes. autoflush=False means changes aren't automatically sent to the DB before queries. bind=engine connects sessions to our PostgreSQL engine

Base = declarative_base()               # Line 15: Creates the declarative base class — every ORM model (Patient, Note, Lab) inherits from this. It tracks all model classes and their table metadata for creating/dropping tables
```

---

### `backend/app/dependencies.py` — Dependency Injection

This file provides reusable dependencies that FastAPI injects into route handlers: the database session and pagination parameters.

```python
from typing import Generator            # Line 1: Imports Generator type hint — used because get_db is a generator function (uses yield)

from fastapi import Query               # Line 3: Imports Query — a FastAPI class that defines query string parameters with validation rules (min, max, default, pattern, description)
from sqlalchemy.orm import Session      # Line 4: Imports Session type for type hints — represents a database session object

from app.database import SessionLocal   # Line 6: Imports the session factory that creates new database sessions


def get_db() -> Generator:              # Line 9: Defines a dependency function that provides a database session to route handlers. FastAPI calls this automatically when a route declares `db: Session = Depends(get_db)`
    db = SessionLocal()                 # Line 10: Creates a new database session from the session factory
    try:                                # Line 11: Try block ensures the session is always closed, even if the route handler throws an error
        yield db                        # Line 12: Yields (provides) the session to the route handler. The route handler uses it to query the database. Code after yield runs after the route handler finishes
    finally:                            # Line 13: Finally block always executes, whether the route succeeded or threw an error
        db.close()                      # Line 14: Closes the database session, returning the connection to the pool so other requests can use it


class PaginationParams:                 # Line 17: A class that FastAPI uses as a dependency to parse pagination-related query parameters from the URL. When a route declares `params: PaginationParams = Depends()`, FastAPI auto-creates this from the URL query string
    def __init__(                       # Line 18: Constructor — FastAPI reads the default values and Query() definitions to know what query parameters to expect
        self,
        page: int = Query(1, ge=1, description="Page number"),  # Line 20: The page number, defaults to 1, must be >= 1 (ge=1). Example URL: /patients?page=2
        page_size: int = Query(20, ge=1, le=100, description="Items per page"),  # Line 21: How many items per page, defaults to 20, must be between 1 and 100
        search: str = Query("", description="Search by name or email"),  # Line 22: A search term to filter patients by first name, last name, or email. Empty string means no search filter
        sort_by: str = Query("last_name", description="Field to sort by"),  # Line 23: Which column to sort results by. Defaults to sorting by last name
        sort_order: str = Query("asc", pattern="^(asc|desc)$", description="Sort direction"),  # Line 24: Sort direction — must be exactly "asc" or "desc" (enforced by regex pattern). Defaults to ascending
        status: str | None = Query(None, description="Filter by status"),  # Line 25: Optional status filter — can be "active", "inactive", or "critical". None means show all statuses
    ):
        self.page = page                # Line 27: Stores page number on the instance so the service layer can access it
        self.page_size = page_size      # Line 28: Stores page size on the instance
        self.search = search            # Line 29: Stores search term on the instance
        self.sort_by = sort_by          # Line 30: Stores sort field on the instance
        self.sort_order = sort_order    # Line 31: Stores sort direction on the instance
        self.status = status            # Line 32: Stores status filter on the instance
```

---

### `backend/app/models/patient.py` — Patient ORM Model

This file defines the SQLAlchemy ORM model for the `patients` database table — it maps Python objects to database rows.

```python
import uuid                             # Line 1: Imports the uuid module to generate unique identifiers (UUID v4) for new patient records
from datetime import datetime           # Line 2: Imports datetime (not directly used in this file but available for type context)

from sqlalchemy import ARRAY, Column, Date, DateTime, String, Text, func  # Line 4: Imports SQLAlchemy column types — ARRAY (PostgreSQL array), Column (defines a table column), Date/DateTime (date types), String/Text (text types), func (SQL functions like NOW())
from sqlalchemy.dialects.postgresql import UUID  # Line 5: Imports the PostgreSQL-specific UUID column type that stores UUIDs natively (not as strings)
from sqlalchemy.orm import relationship  # Line 6: Imports relationship — defines how this model relates to other models (Patient has many Notes, Patient has many Labs)

from app.database import Base           # Line 8: Imports the Base class that all ORM models must inherit from — it registers this model's table in SQLAlchemy's metadata


class Patient(Base):                    # Line 11: Defines the Patient model class, inheriting from Base. SQLAlchemy uses this to map Python objects to rows in the "patients" table
    __tablename__ = "patients"          # Line 12: Tells SQLAlchemy the name of the database table this model maps to

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)  # Line 14: Primary key column — stores a UUID. as_uuid=True means Python gets a uuid.UUID object (not a string). default=uuid.uuid4 auto-generates a new UUID for each new patient
    first_name = Column(String(100), nullable=False)  # Line 15: Patient's first name — VARCHAR(100) in the database, cannot be NULL (required field)
    last_name = Column(String(100), nullable=False)  # Line 16: Patient's last name — VARCHAR(100), required
    date_of_birth = Column(Date, nullable=False)  # Line 17: Patient's date of birth — stored as a DATE type in PostgreSQL, required
    email = Column(String(255), unique=True, nullable=False, index=True)  # Line 18: Patient's email — VARCHAR(255), must be unique across all patients, required, and has a database index for fast lookups
    phone = Column(String(30))          # Line 19: Patient's phone number — VARCHAR(30), optional (nullable=True is the default)
    address = Column(String(500))       # Line 20: Patient's address — VARCHAR(500), optional

    blood_type = Column(String(5))      # Line 23: Blood type (e.g., "A+", "O-", "AB+") — VARCHAR(5), optional
    allergies = Column(ARRAY(String), server_default="{}")  # Line 24: List of allergies stored as a PostgreSQL ARRAY of strings. server_default="{}" means the database sets it to an empty array if not provided
    conditions = Column(ARRAY(String), server_default="{}")  # Line 25: List of medical conditions (e.g., "Hypertension", "Diabetes") — PostgreSQL string array, defaults to empty
    status = Column(String(20), nullable=False, default="active")  # Line 26: Patient status — must be "active", "inactive", or "critical". Defaults to "active" for new patients. nullable=False means it's always required
    last_visit = Column(Date)           # Line 27: Date of the patient's most recent visit — optional DATE column

    insurance_provider = Column(String(255))  # Line 30: Name of insurance company (e.g., "Blue Cross") — optional
    insurance_policy_number = Column(String(100))  # Line 31: Insurance policy ID number — optional
    insurance_group_number = Column(String(100))  # Line 32: Insurance group number — optional

    medical_history = Column(Text)      # Line 35: Free-text medical history (unlimited length TEXT column) — optional
    family_history = Column(ARRAY(String), server_default="{}")  # Line 36: List of family medical conditions (e.g., "Heart Disease (father)") — PostgreSQL string array, defaults to empty

    consent_forms = Column(ARRAY(String), server_default="{}")  # Line 39: List of signed consent form names (e.g., "HIPAA Privacy Notice") — PostgreSQL string array, defaults to empty

    created_at = Column(DateTime(timezone=True), server_default=func.now())  # Line 41: Timestamp when the patient record was created — the database auto-sets this to the current time using PostgreSQL's NOW() function. timezone=True stores it with timezone info
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())  # Line 42: Timestamp when the record was last modified — auto-set on creation AND auto-updated every time the row is modified (onupdate=func.now())

    notes = relationship("Note", back_populates="patient", cascade="all, delete-orphan", order_by="Note.timestamp.desc()")  # Line 44: Defines a one-to-many relationship: one Patient has many Notes. back_populates="patient" links to Note.patient. cascade="all, delete-orphan" means when a patient is deleted, all their notes are automatically deleted too. order_by sorts notes newest-first
    labs = relationship("Lab", back_populates="patient", cascade="all, delete-orphan", order_by="Lab.ordered_date.desc()")  # Line 45: Same pattern for labs — one Patient has many Labs, cascade delete, ordered by most recent first
```

---

### `backend/app/models/note.py` — Note ORM Model

This file defines the database model for clinical notes that belong to patients.

```python
import uuid                             # Line 1: Imports uuid module to generate unique IDs for new notes

from sqlalchemy import Column, DateTime, ForeignKey, Text, func  # Line 3: Imports column types — Column (defines columns), DateTime (timestamp type), ForeignKey (links to another table), Text (unlimited text), func (SQL functions like NOW())
from sqlalchemy.dialects.postgresql import UUID  # Line 4: Imports PostgreSQL UUID type for the id and patient_id columns
from sqlalchemy.orm import relationship  # Line 5: Imports relationship to define the link back to the Patient model

from app.database import Base           # Line 7: Imports Base so this model is registered with SQLAlchemy


class Note(Base):                       # Line 10: Defines the Note model — maps to the "notes" database table
    __tablename__ = "notes"             # Line 11: The database table name

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)  # Line 13: Primary key — auto-generated UUID for each note
    patient_id = Column(                # Line 14: Foreign key column that links this note to a specific patient
        UUID(as_uuid=True),             # Line 15: Same UUID type as the patient's id column
        ForeignKey("patients.id", ondelete="CASCADE"),  # Line 16: References the patients.id column. ondelete="CASCADE" means if the patient is deleted from the patients table, all their notes are automatically deleted too
        nullable=False,                 # Line 17: Every note must belong to a patient (required)
        index=True,                     # Line 18: Creates a database index on patient_id for fast lookups when fetching all notes for a specific patient
    )
    content = Column(Text, nullable=False)  # Line 20: The actual text of the clinical note — unlimited length, required
    timestamp = Column(DateTime(timezone=True), server_default=func.now())  # Line 21: When the clinical observation was made — defaults to the current time but can be set to a past time by the user
    created_at = Column(DateTime(timezone=True), server_default=func.now())  # Line 22: When this database record was created — always auto-set to current time

    patient = relationship("Patient", back_populates="notes")  # Line 24: Defines the reverse relationship — lets you access note.patient to get the Patient object this note belongs to. back_populates="notes" links to Patient.notes
```

---

### `backend/app/models/lab.py` — Lab ORM Model

This file defines the database model for lab test orders and results.

```python
import uuid                             # Line 1: Imports uuid for generating unique lab record IDs

from sqlalchemy import Column, DateTime, ForeignKey, String, Text, func  # Line 3: Imports column types needed for the lab table
from sqlalchemy.dialects.postgresql import UUID  # Line 4: PostgreSQL UUID type
from sqlalchemy.orm import relationship  # Line 5: For defining the relationship back to Patient

from app.database import Base           # Line 7: Base class for ORM models


class Lab(Base):                        # Line 10: Defines the Lab model — maps to the "labs" database table
    __tablename__ = "labs"              # Line 11: Database table name

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)  # Line 13: Primary key — auto-generated UUID
    patient_id = Column(                # Line 14: Foreign key linking this lab to a patient
        UUID(as_uuid=True),             # Line 15: UUID type matching patients.id
        ForeignKey("patients.id", ondelete="CASCADE"),  # Line 16: CASCADE delete — deleting a patient deletes all their labs
        nullable=False,                 # Line 17: Every lab must belong to a patient
        index=True,                     # Line 18: Index for fast lookups by patient
    )
    test_name = Column(String(255), nullable=False)  # Line 20: Name of the lab test (e.g., "Complete Blood Count (CBC)") — required
    ordered_date = Column(DateTime(timezone=True), server_default=func.now())  # Line 21: When the lab was ordered — defaults to current time
    status = Column(String(20), nullable=False, default="ordered")  # Line 22: Current status of the lab — "ordered" (just placed), "in_progress" (being processed), or "completed" (results available). Defaults to "ordered"
    result = Column(Text)               # Line 23: The lab test results text — NULL until the lab is completed
    result_date = Column(DateTime(timezone=True))  # Line 24: When the results came back — NULL until completed
    notes = Column(Text)                # Line 25: Optional additional notes about the lab order
    created_at = Column(DateTime(timezone=True), server_default=func.now())  # Line 26: When this record was created in the database

    patient = relationship("Patient", back_populates="labs")  # Line 28: Reverse relationship — lab.patient gives you the Patient object
```

---

### `backend/app/schemas/common.py` — Generic Paginated Response

This file defines a reusable Pydantic model for paginated API responses.

```python
from typing import Generic, TypeVar    # Line 1: Imports Generic (base class for generic types) and TypeVar (creates a type variable placeholder)

from pydantic import BaseModel         # Line 3: Imports BaseModel — all Pydantic schemas inherit from this for automatic validation and serialization

T = TypeVar("T")                       # Line 5: Creates a type variable "T" — this is a placeholder that gets replaced with a real type like PatientOut when used. Allows PaginatedResponse to work with any item type


class PaginatedResponse(BaseModel, Generic[T]):  # Line 8: Defines a generic paginated response schema. PaginatedResponse[PatientOut] means a paginated list of patients, PaginatedResponse[NoteOut] means a paginated list of notes
    items: list[T]                     # Line 9: The list of items for the current page — the type depends on what T is (Patient objects, Note objects, etc.)
    total: int                         # Line 10: The total number of items across ALL pages (not just this page) — used by the frontend to calculate total pages
    page: int                          # Line 11: The current page number (1-indexed)
    page_size: int                     # Line 12: How many items are on each page
    total_pages: int                   # Line 13: The total number of pages — calculated as ceil(total / page_size)
```

---

### `backend/app/schemas/patient.py` — Patient Validation Schemas

This file defines Pydantic schemas for validating patient data in API requests and responses.

```python
from datetime import date, datetime    # Line 1: Imports date (for date_of_birth) and datetime (for created_at, updated_at)
from typing import Optional            # Line 2: Imports Optional — used to mark fields that can be None
from uuid import UUID                  # Line 3: Imports UUID type for the patient ID

from pydantic import BaseModel, EmailStr, computed_field, field_validator  # Line 5: Imports BaseModel (base schema class), EmailStr (validates email format), computed_field (auto-calculated fields), field_validator (custom validation logic)

BLOOD_TYPES = {"A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"}  # Line 7: A set of all valid blood type values — used by the validator to reject invalid blood types
STATUSES = {"active", "inactive", "critical"}  # Line 8: A set of all valid patient statuses — used by the validator
SORTABLE_FIELDS = {                    # Line 9: A set of column names that are allowed as sort fields — prevents SQL injection by only allowing known column names
    "first_name", "last_name", "date_of_birth", "email", "status", "last_visit", "created_at"
}


class PatientBase(BaseModel):          # Line 14: Base schema with all patient fields — used as the parent class for PatientCreate and PatientOut
    first_name: str                    # Line 15: Patient's first name — required string
    last_name: str                     # Line 16: Patient's last name — required string
    date_of_birth: date                # Line 17: Date of birth — required, Pydantic auto-parses "1990-05-15" strings into Python date objects
    email: EmailStr                    # Line 18: Email — required, Pydantic validates this is a properly formatted email address (has @, domain, etc.)
    phone: Optional[str] = None        # Line 19: Phone number — optional, defaults to None if not provided
    address: Optional[str] = None      # Line 20: Address — optional
    blood_type: Optional[str] = None   # Line 21: Blood type — optional, validated by the blood_type validator below
    allergies: list[str] = []          # Line 22: List of allergy strings — optional, defaults to empty list
    conditions: list[str] = []         # Line 23: List of medical conditions — optional, defaults to empty list
    status: str = "active"             # Line 24: Patient status — defaults to "active", validated by the status validator below
    last_visit: Optional[date] = None  # Line 25: Date of most recent visit — optional

    insurance_provider: Optional[str] = None  # Line 28: Insurance company name — optional
    insurance_policy_number: Optional[str] = None  # Line 29: Policy number — optional
    insurance_group_number: Optional[str] = None  # Line 30: Group number — optional

    medical_history: Optional[str] = None  # Line 33: Free-text medical history — optional
    family_history: list[str] = []     # Line 34: List of family conditions — optional, defaults to empty list

    consent_forms: list[str] = []      # Line 37: List of signed consent form names — optional, defaults to empty list

    @field_validator("blood_type")     # Line 39: Decorator that tells Pydantic to run this function whenever blood_type is set — validates the value before accepting it
    @classmethod                       # Line 40: Required by Pydantic v2 — validators must be class methods
    def validate_blood_type(cls, v: Optional[str]) -> Optional[str]:  # Line 41: The validator function — receives the value (v) and returns it if valid, or raises ValueError if invalid
        if v and v not in BLOOD_TYPES: # Line 42: If a blood type was provided AND it's not in the allowed set (A+, A-, B+, etc.)...
            raise ValueError(f"blood_type must be one of {sorted(BLOOD_TYPES)}")  # Line 43: ...raise an error with a message listing all valid blood types
        return v                       # Line 44: If valid (or None), return the value unchanged

    @field_validator("status")         # Line 46: Validator for the status field
    @classmethod                       # Line 47: Must be a classmethod
    def validate_status(cls, v: str) -> str:  # Line 48: Receives the status value
        if v not in STATUSES:          # Line 49: If the status isn't "active", "inactive", or "critical"...
            raise ValueError(f"status must be one of {sorted(STATUSES)}")  # Line 50: ...raise an error listing valid statuses
        return v                       # Line 51: Return valid status unchanged

    @field_validator("first_name", "last_name")  # Line 53: Validator that runs on BOTH first_name and last_name fields
    @classmethod                       # Line 54: Must be a classmethod
    def validate_name(cls, v: str) -> str:  # Line 55: Receives the name value
        v = v.strip()                  # Line 56: Removes leading and trailing whitespace from the name
        if not v:                      # Line 57: If the name is empty after stripping...
            raise ValueError("Name cannot be empty")  # Line 58: ...raise an error
        if len(v) > 100:              # Line 59: If the name exceeds 100 characters...
            raise ValueError("Name cannot exceed 100 characters")  # Line 60: ...raise an error (matches the database column limit)
        return v                       # Line 61: Return the trimmed name


class PatientCreate(PatientBase):      # Line 64: Schema for creating a new patient — inherits ALL fields and validators from PatientBase. Used to validate POST /patients request bodies
    pass                               # Line 65: No additional fields needed — PatientBase has everything


class PatientUpdate(BaseModel):        # Line 68: Schema for updating a patient — inherits from BaseModel (NOT PatientBase) because all fields must be optional for partial updates
    first_name: Optional[str] = None   # Line 69: Optional — only include fields you want to change
    last_name: Optional[str] = None    # Line 70: Optional
    date_of_birth: Optional[date] = None  # Line 71: Optional
    email: Optional[EmailStr] = None   # Line 72: Optional
    phone: Optional[str] = None        # Line 73: Optional
    address: Optional[str] = None      # Line 74: Optional
    blood_type: Optional[str] = None   # Line 75: Optional
    allergies: Optional[list[str]] = None  # Line 76: Optional — None means "don't change", [] means "clear the list"
    conditions: Optional[list[str]] = None  # Line 77: Optional
    status: Optional[str] = None       # Line 78: Optional
    last_visit: Optional[date] = None  # Line 79: Optional
    insurance_provider: Optional[str] = None  # Line 80: Optional
    insurance_policy_number: Optional[str] = None  # Line 81: Optional
    insurance_group_number: Optional[str] = None  # Line 82: Optional
    medical_history: Optional[str] = None  # Line 83: Optional
    family_history: Optional[list[str]] = None  # Line 84: Optional
    consent_forms: Optional[list[str]] = None  # Line 85: Optional

    @field_validator("blood_type")     # Line 87: Same blood type validation as PatientBase — ensures updates also use valid blood types
    @classmethod
    def validate_blood_type(cls, v: Optional[str]) -> Optional[str]:
        if v and v not in BLOOD_TYPES:
            raise ValueError(f"blood_type must be one of {sorted(BLOOD_TYPES)}")
        return v

    @field_validator("status")         # Line 94: Same status validation for updates
    @classmethod
    def validate_status(cls, v: Optional[str]) -> Optional[str]:
        if v and v not in STATUSES:
            raise ValueError(f"status must be one of {sorted(STATUSES)}")
        return v


class PatientOut(PatientBase):         # Line 102: Schema for API responses — includes all PatientBase fields plus id, timestamps, and computed fields
    id: UUID                           # Line 103: The patient's unique ID — included in responses but not in create/update requests
    created_at: datetime               # Line 104: When the record was created
    updated_at: datetime               # Line 105: When the record was last updated

    @computed_field                     # Line 107: Tells Pydantic to automatically include this property in the JSON output
    @property                          # Line 108: Makes this a Python property (calculated on access, not stored)
    def age(self) -> int:              # Line 109: Calculates the patient's current age from their date of birth
        today = date.today()           # Line 110: Gets today's date
        dob = self.date_of_birth       # Line 111: Gets the patient's date of birth
        return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))  # Line 112: Subtracts birth year from current year, then subtracts 1 if the birthday hasn't happened yet this year. The tuple comparison (month, day) < (month, day) returns True (1) if birthday is later this year

    @computed_field                     # Line 114: Another computed field included in JSON output
    @property                          # Line 115: Property — calculated, not stored
    def full_name(self) -> str:        # Line 116: Combines first and last name into a single string
        return f"{self.first_name} {self.last_name}"  # Line 117: Returns "Jane Doe" format

    model_config = {"from_attributes": True}  # Line 119: Tells Pydantic to read values from SQLAlchemy model attributes (patient.first_name) instead of requiring a dictionary. This is what allows PatientOut to serialize ORM objects directly
```

---

### `backend/app/schemas/note.py` — Note Validation Schemas

```python
from datetime import datetime          # Line 1: Imports datetime for timestamp fields
from typing import Optional            # Line 2: Imports Optional for nullable fields
from uuid import UUID                  # Line 3: Imports UUID for ID fields

from pydantic import BaseModel         # Line 5: Imports BaseModel for schema definitions


class NoteCreate(BaseModel):           # Line 8: Schema for creating a new note — validates POST request bodies
    content: str                       # Line 9: The note text — required string
    timestamp: Optional[datetime] = None  # Line 10: Optional timestamp — if not provided, the server defaults to the current time. Allows backdating notes

    class Config:                      # Line 12: Pydantic Config class for extra settings
        json_schema_extra = {          # Line 13: Adds an example to the auto-generated API docs (Swagger UI)
            "example": {               # Line 14: The example shown in docs
                "content": "Patient reports improved blood pressure. Medication compliance good.",  # Line 15: Example note content
                "timestamp": "2025-03-01T10:30:00Z",  # Line 16: Example ISO 8601 timestamp
            }
        }


class NoteOut(BaseModel):             # Line 21: Schema for note API responses — defines what fields are returned to the client
    id: UUID                           # Line 22: The note's unique ID
    patient_id: UUID                   # Line 23: Which patient this note belongs to
    content: str                       # Line 24: The note text
    timestamp: datetime                # Line 25: When the observation was made
    created_at: datetime               # Line 26: When the database record was created

    model_config = {"from_attributes": True}  # Line 28: Allows Pydantic to read from SQLAlchemy ORM objects directly
```

---

### `backend/app/schemas/lab.py` — Lab Validation Schemas

```python
from datetime import datetime          # Line 1: Imports datetime for date fields
from typing import Optional            # Line 2: Imports Optional for nullable fields
from uuid import UUID                  # Line 3: Imports UUID for ID fields

from pydantic import BaseModel, field_validator  # Line 5: Imports BaseModel and field_validator for custom validation

LAB_STATUSES = {"ordered", "in_progress", "completed"}  # Line 7: Set of valid lab statuses — used by validators to reject invalid values


class LabCreate(BaseModel):            # Line 10: Schema for ordering a new lab test
    test_name: str                     # Line 11: Name of the test (e.g., "Complete Blood Count") — required
    ordered_date: Optional[datetime] = None  # Line 12: When the test was ordered — defaults to current time if not provided
    status: str = "ordered"            # Line 13: Initial status — defaults to "ordered" (just placed)
    result: Optional[str] = None       # Line 14: Test results — usually None when first ordered
    result_date: Optional[datetime] = None  # Line 15: When results came in — usually None initially
    notes: Optional[str] = None        # Line 16: Additional notes about the order — optional

    @field_validator("test_name")      # Line 18: Validates the test name
    @classmethod
    def validate_test_name(cls, v: str) -> str:
        v = v.strip()                  # Line 21: Removes whitespace from both ends
        if not v:                      # Line 22: If empty after trimming...
            raise ValueError("Test name cannot be empty")  # Line 23: ...reject it
        return v                       # Line 24: Return the trimmed name

    @field_validator("status")         # Line 26: Validates the status field
    @classmethod
    def validate_status(cls, v: str) -> str:
        if v not in LAB_STATUSES:      # Line 29: If status isn't ordered/in_progress/completed...
            raise ValueError(f"status must be one of {sorted(LAB_STATUSES)}")  # Line 30: ...reject it
        return v                       # Line 31: Return valid status


class LabUpdate(BaseModel):            # Line 34: Schema for updating an existing lab — all fields optional for partial updates
    test_name: Optional[str] = None    # Line 35: Optionally update the test name
    status: Optional[str] = None       # Line 36: Optionally update the status (e.g., from "ordered" to "completed")
    result: Optional[str] = None       # Line 37: Optionally add/update the test results
    result_date: Optional[datetime] = None  # Line 38: Optionally set when results came back
    notes: Optional[str] = None        # Line 39: Optionally add/update notes

    @field_validator("status")         # Line 41: Same status validation for updates
    @classmethod
    def validate_status(cls, v: Optional[str]) -> Optional[str]:
        if v and v not in LAB_STATUSES:
            raise ValueError(f"status must be one of {sorted(LAB_STATUSES)}")
        return v


class LabOut(BaseModel):              # Line 49: Schema for lab API responses
    id: UUID                           # Line 50: Lab record's unique ID
    patient_id: UUID                   # Line 51: Which patient this lab belongs to
    test_name: str                     # Line 52: Name of the test
    ordered_date: datetime             # Line 53: When the test was ordered
    status: str                        # Line 54: Current status (ordered/in_progress/completed)
    result: Optional[str]              # Line 55: Test results — None if not yet completed
    result_date: Optional[datetime]    # Line 56: When results came in — None if not yet completed
    notes: Optional[str]               # Line 57: Additional notes
    created_at: datetime               # Line 58: When this record was created

    model_config = {"from_attributes": True}  # Line 60: Allows reading from SQLAlchemy ORM objects
```

---

### `backend/app/routers/health.py` — Health Check Endpoint

```python
from fastapi import APIRouter          # Line 1: Imports APIRouter — a way to group related endpoints into a module

router = APIRouter()                   # Line 3: Creates a router instance — endpoints defined on this router are mounted on the main app in main.py


@router.get("/health")                 # Line 6: Defines a GET endpoint at /health — used by Docker healthchecks and monitoring to verify the API is running
def health_check():                    # Line 7: The handler function — no parameters needed
    return {"status": "ok"}            # Line 8: Returns a simple JSON response. If this endpoint responds, the API is alive
```

---

### `backend/app/routers/patients.py` — Patient CRUD Endpoints

```python
from uuid import UUID                  # Line 1: Imports UUID to type-hint patient IDs in URL paths

from fastapi import APIRouter, Depends, HTTPException, status  # Line 3: Imports APIRouter (groups endpoints), Depends (dependency injection), HTTPException (for error responses), status (HTTP status code constants)
from sqlalchemy.orm import Session     # Line 4: Imports Session type for the database dependency

from app.dependencies import PaginationParams, get_db  # Line 6: Imports get_db (provides a database session) and PaginationParams (parses pagination query params)
from app.schemas.common import PaginatedResponse  # Line 7: Imports the generic paginated response schema
from app.schemas.patient import PatientCreate, PatientOut, PatientUpdate  # Line 8: Imports patient schemas for request validation and response serialization
from app.services.patient_service import PatientService  # Line 9: Imports the service class that contains the business logic

router = APIRouter()                   # Line 11: Creates a new router — mounted at /api/v1/patients in main.py


@router.get("", response_model=PaginatedResponse[PatientOut])  # Line 14: GET /api/v1/patients — lists patients with pagination. response_model tells FastAPI to serialize the response using PaginatedResponse containing PatientOut objects
def list_patients(                     # Line 15: Handler function
    params: PaginationParams = Depends(),  # Line 16: FastAPI auto-creates PaginationParams from query string (?page=1&search=john&status=active). Depends() tells FastAPI to inject this dependency
    db: Session = Depends(get_db),     # Line 17: Injects a database session using the get_db dependency
):
    return PatientService(db).list_patients(params)  # Line 19: Creates a PatientService with the database session and calls list_patients with the pagination parameters. Returns the paginated result


@router.get("/{patient_id}", response_model=PatientOut)  # Line 22: GET /api/v1/patients/{patient_id} — gets a single patient by ID. {patient_id} is a URL path parameter
def get_patient(patient_id: UUID, db: Session = Depends(get_db)):  # Line 23: FastAPI automatically parses the UUID from the URL path and injects the database session
    patient = PatientService(db).get_patient(patient_id)  # Line 24: Looks up the patient by ID in the database
    if not patient:                    # Line 25: If no patient was found with that ID...
        raise HTTPException(status_code=404, detail="Patient not found")  # Line 26: ...return a 404 Not Found error with a message
    return patient                     # Line 27: Return the patient object — FastAPI serializes it using PatientOut


@router.post("", response_model=PatientOut, status_code=status.HTTP_201_CREATED)  # Line 30: POST /api/v1/patients — creates a new patient. Returns 201 Created on success
def create_patient(data: PatientCreate, db: Session = Depends(get_db)):  # Line 31: FastAPI automatically parses and validates the JSON request body using PatientCreate schema
    return PatientService(db).create_patient(data)  # Line 32: Creates the patient in the database and returns it


@router.put("/{patient_id}", response_model=PatientOut)  # Line 35: PUT /api/v1/patients/{id} — updates an existing patient
def update_patient(patient_id: UUID, data: PatientUpdate, db: Session = Depends(get_db)):  # Line 36: Receives patient ID from URL, update data from request body
    patient = PatientService(db).update_patient(patient_id, data)  # Line 37: Applies the partial update
    if not patient:                    # Line 38: If the patient wasn't found...
        raise HTTPException(status_code=404, detail="Patient not found")  # Line 39: ...return 404
    return patient                     # Line 40: Return the updated patient


@router.delete("/{patient_id}", status_code=status.HTTP_204_NO_CONTENT)  # Line 43: DELETE /api/v1/patients/{id} — deletes a patient. Returns 204 No Content (empty response body) on success
def delete_patient(patient_id: UUID, db: Session = Depends(get_db)):  # Line 44: Receives patient ID from URL
    success = PatientService(db).delete_patient(patient_id)  # Line 45: Attempts to delete the patient (and cascade-deletes their notes and labs)
    if not success:                    # Line 46: If the patient wasn't found...
        raise HTTPException(status_code=404, detail="Patient not found")  # Line 47: ...return 404
```

---

### `backend/app/routers/notes.py` — Notes & AI Summary Endpoints

```python
import logging                         # Line 1: Imports logging for error logging
from datetime import datetime, timezone  # Line 2: Imports datetime and timezone for generating ISO timestamps
from uuid import UUID                  # Line 3: Imports UUID for type hints

from fastapi import APIRouter, Depends, HTTPException, status  # Line 5: FastAPI utilities
from pydantic import BaseModel         # Line 6: For defining the SummaryResponse schema inline
from sqlalchemy.orm import Session     # Line 7: Database session type

from app.dependencies import get_db    # Line 9: Database session dependency
from app.schemas.note import NoteCreate, NoteOut  # Line 10: Note validation schemas
from app.services.gemini_service import GeminiService  # Line 11: AI summary service
from app.services.note_service import NoteService  # Line 12: Note business logic
from app.services.patient_service import PatientService  # Line 13: Patient lookup (to verify patient exists)

logger = logging.getLogger(__name__)   # Line 15: Creates a logger tagged with this module's name for error messages


class SummaryResponse(BaseModel):      # Line 18: Pydantic schema for the AI summary response
    summary: str                       # Line 19: The generated summary text
    patient_id: str                    # Line 20: Which patient the summary is for
    generated_at: str                  # Line 21: ISO timestamp of when the summary was generated

router = APIRouter()                   # Line 23: Creates the router — mounted at /api/v1/patients in main.py


@router.get("/{patient_id}/notes", response_model=list[NoteOut])  # Line 26: GET /api/v1/patients/{id}/notes — returns all notes for a patient as a list
def get_notes(patient_id: UUID, db: Session = Depends(get_db)):  # Line 27: Receives patient ID from URL
    patient = PatientService(db).get_patient(patient_id)  # Line 28: Verifies the patient exists
    if not patient:                    # Line 29: If not found...
        raise HTTPException(status_code=404, detail="Patient not found")  # Line 30: ...return 404
    return NoteService(db).get_notes(patient_id)  # Line 31: Returns all notes for the patient, ordered newest-first


@router.post("/{patient_id}/notes", response_model=NoteOut, status_code=status.HTTP_201_CREATED)  # Line 34: POST /api/v1/patients/{id}/notes — adds a new note
def add_note(patient_id: UUID, data: NoteCreate, db: Session = Depends(get_db)):  # Line 35: Receives patient ID and note data
    patient = PatientService(db).get_patient(patient_id)  # Line 36: Verifies patient exists
    if not patient:                    # Line 37: If not found...
        raise HTTPException(status_code=404, detail="Patient not found")  # Line 38: ...404
    if not data.content.strip():       # Line 39: If the note content is empty or only whitespace...
        raise HTTPException(status_code=400, detail="Note content cannot be empty")  # Line 40: ...return 400 Bad Request
    return NoteService(db).add_note(patient_id, data)  # Line 41: Creates the note in the database and returns it


@router.delete("/{patient_id}/notes/{note_id}", status_code=status.HTTP_204_NO_CONTENT)  # Line 44: DELETE /api/v1/patients/{pid}/notes/{nid} — deletes a specific note
def delete_note(patient_id: UUID, note_id: UUID, db: Session = Depends(get_db)):  # Line 45: Receives both patient ID and note ID
    success = NoteService(db).delete_note(patient_id, note_id)  # Line 46: Attempts to delete — checks both IDs to ensure the note belongs to the patient
    if not success:                    # Line 47: If note not found or doesn't belong to patient...
        raise HTTPException(status_code=404, detail="Note not found")  # Line 48: ...404


@router.get("/{patient_id}/summary", response_model=SummaryResponse)  # Line 51: GET /api/v1/patients/{id}/summary — generates an AI clinical summary
def get_summary(patient_id: UUID, db: Session = Depends(get_db)):  # Line 52: Receives patient ID
    patient = PatientService(db).get_patient(patient_id)  # Line 53: Fetches the patient record
    if not patient:                    # Line 54: If not found...
        raise HTTPException(status_code=404, detail="Patient not found")  # Line 55: ...404
    notes = NoteService(db).get_notes(patient_id)  # Line 56: Fetches all clinical notes for the patient — these are sent to the AI as context
    try:                               # Line 57: Try block catches any AI service errors
        summary = GeminiService().generate_summary(patient, notes)  # Line 58: Creates a GeminiService and generates a clinical summary from the patient data and notes
        return SummaryResponse(        # Line 59: Returns the summary response
            summary=summary,           # Line 60: The generated summary text
            patient_id=str(patient_id),  # Line 61: The patient ID as a string
            generated_at=datetime.now(timezone.utc).isoformat(),  # Line 62: Current UTC time in ISO format (e.g., "2025-03-14T10:30:00+00:00")
        )
    except Exception as e:            # Line 64: If anything goes wrong with the AI service...
        logger.error("Summary generation failed for patient %s: %s", patient_id, e)  # Line 65: Log the error with patient ID and error details
        raise HTTPException(           # Line 66: Return a 503 Service Unavailable error
            status_code=503,           # Line 67: 503 indicates a temporary server-side issue
            detail="Unable to generate summary. Please try again later.",  # Line 68: User-friendly error message
        )
```

---

### `backend/app/routers/labs.py` — Lab CRUD Endpoints

```python
from uuid import UUID                  # Line 1: UUID type for path parameters

from fastapi import APIRouter, Depends, HTTPException, status  # Line 3: FastAPI utilities
from sqlalchemy.orm import Session     # Line 4: Database session type

from app.dependencies import get_db    # Line 6: Database dependency
from app.schemas.lab import LabCreate, LabOut, LabUpdate  # Line 7: Lab validation schemas
from app.services.lab_service import LabService  # Line 8: Lab business logic
from app.services.patient_service import PatientService  # Line 9: For verifying patients exist

router = APIRouter()                   # Line 11: Creates the router


@router.get("/{patient_id}/labs", response_model=list[LabOut])  # Line 14: GET /api/v1/patients/{id}/labs — list all labs for a patient
def get_labs(patient_id: UUID, db: Session = Depends(get_db)):  # Line 15: Receives patient ID
    patient = PatientService(db).get_patient(patient_id)  # Line 16: Verify patient exists
    if not patient:                    # Line 17: If not found...
        raise HTTPException(status_code=404, detail="Patient not found")  # Line 18: ...404
    return LabService(db).get_labs(patient_id)  # Line 19: Return all labs ordered newest-first


@router.post(                          # Line 22: POST /api/v1/patients/{id}/labs — order a new lab test
    "/{patient_id}/labs",
    response_model=LabOut,
    status_code=status.HTTP_201_CREATED,  # Line 25: Returns 201 Created
)
def add_lab(patient_id: UUID, data: LabCreate, db: Session = Depends(get_db)):  # Line 27: Receives patient ID and lab order data
    patient = PatientService(db).get_patient(patient_id)  # Line 28: Verify patient exists
    if not patient:                    # Line 29: If not found...
        raise HTTPException(status_code=404, detail="Patient not found")  # Line 30: ...404
    return LabService(db).add_lab(patient_id, data)  # Line 31: Creates the lab record and returns it


@router.put("/{patient_id}/labs/{lab_id}", response_model=LabOut)  # Line 34: PUT /api/v1/patients/{pid}/labs/{lid} — update a lab (e.g., add results, change status)
def update_lab(                        # Line 35: Handler
    patient_id: UUID, lab_id: UUID, data: LabUpdate, db: Session = Depends(get_db)  # Line 36: Receives patient ID, lab ID, and update data
):
    lab = LabService(db).update_lab(patient_id, lab_id, data)  # Line 38: Applies the update
    if not lab:                        # Line 39: If lab not found or doesn't belong to patient...
        raise HTTPException(status_code=404, detail="Lab not found")  # Line 40: ...404
    return lab                         # Line 41: Return updated lab


@router.delete(                        # Line 44: DELETE /api/v1/patients/{pid}/labs/{lid} — delete a lab
    "/{patient_id}/labs/{lab_id}", status_code=status.HTTP_204_NO_CONTENT  # Line 45: Returns 204 No Content
)
def delete_lab(patient_id: UUID, lab_id: UUID, db: Session = Depends(get_db)):  # Line 47: Receives both IDs
    success = LabService(db).delete_lab(patient_id, lab_id)  # Line 48: Attempts deletion
    if not success:                    # Line 49: If not found...
        raise HTTPException(status_code=404, detail="Lab not found")  # Line 50: ...404
```

---

### `backend/app/services/patient_service.py` — Patient Business Logic

```python
import math                            # Line 1: Imports math.ceil for calculating total pages
from uuid import UUID                  # Line 2: UUID type for patient IDs

from sqlalchemy import asc, desc, or_  # Line 4: Imports asc (ascending sort), desc (descending sort), or_ (SQL OR for combining search conditions)
from sqlalchemy.orm import Session     # Line 5: Database session type

from app.dependencies import PaginationParams  # Line 7: Pagination parameter class
from app.models.patient import Patient  # Line 8: The Patient ORM model
from app.schemas.patient import SORTABLE_FIELDS, PatientCreate, PatientUpdate  # Line 9: SORTABLE_FIELDS (whitelist of allowed sort columns), and the create/update schemas


class PatientService:                  # Line 12: Service class encapsulating all patient-related database operations
    def __init__(self, db: Session):   # Line 13: Constructor — receives a database session
        self.db = db                   # Line 14: Stores the session for use in all methods

    def list_patients(self, params: PaginationParams) -> dict:  # Line 16: Lists patients with pagination, search, sort, and filter
        query = self.db.query(Patient)  # Line 17: Starts a query that selects all patients

        if params.search:              # Line 20: If a search term was provided...
            term = f"%{params.search}%"  # Line 21: Wraps the search term in % wildcards for SQL LIKE matching (e.g., "%john%" matches "Johnson", "John", "johnny")
            query = query.filter(      # Line 22: Adds a WHERE clause to filter results
                or_(                   # Line 23: SQL OR — matches if ANY of these conditions is true
                    Patient.first_name.ilike(term),  # Line 24: Case-insensitive match on first name (ilike = case-Insensitive LIKE)
                    Patient.last_name.ilike(term),  # Line 25: OR case-insensitive match on last name
                    Patient.email.ilike(term),  # Line 26: OR case-insensitive match on email
                )
            )

        if params.status:              # Line 31: If a status filter was provided (e.g., "active", "critical")...
            query = query.filter(Patient.status == params.status)  # Line 32: Add a WHERE clause for exact status match

        sort_field = params.sort_by if params.sort_by in SORTABLE_FIELDS else "last_name"  # Line 35: Security check — only allows sorting by whitelisted column names. If someone passes sort_by="DROP TABLE patients", it falls back to "last_name" instead of executing the injection
        col = getattr(Patient, sort_field, Patient.last_name)  # Line 36: Gets the actual SQLAlchemy column object from the Patient model using the field name. Falls back to last_name if the attribute doesn't exist
        query = query.order_by(asc(col) if params.sort_order == "asc" else desc(col))  # Line 37: Applies ascending or descending sort based on the sort_order parameter

        total = query.count()          # Line 39: Counts the total number of matching patients (before pagination) — used to calculate total pages
        offset = (params.page - 1) * params.page_size  # Line 40: Calculates how many rows to skip. Page 1 skips 0, page 2 skips page_size, page 3 skips 2*page_size, etc.
        items = query.offset(offset).limit(params.page_size).all()  # Line 41: Skips `offset` rows, then takes `page_size` rows — this is the current page of results

        return {                       # Line 43: Returns a dictionary matching the PaginatedResponse schema
            "items": items,            # Line 44: The list of Patient objects for this page
            "total": total,            # Line 45: Total matching patients across all pages
            "page": params.page,       # Line 46: Current page number
            "page_size": params.page_size,  # Line 47: Items per page
            "total_pages": math.ceil(total / params.page_size) if total > 0 else 1,  # Line 48: Calculates total pages by dividing total items by page size and rounding up. If zero items, returns 1 page
        }

    def get_patient(self, patient_id: UUID) -> Patient | None:  # Line 51: Fetches a single patient by ID
        return self.db.query(Patient).filter(Patient.id == patient_id).first()  # Line 52: Queries for a patient with matching ID, returns the first result or None if not found

    def create_patient(self, data: PatientCreate) -> Patient:  # Line 54: Creates a new patient record
        patient = Patient(**data.model_dump())  # Line 55: Converts the Pydantic schema to a dictionary using model_dump(), then unpacks it as keyword arguments to create a Patient ORM object
        self.db.add(patient)           # Line 56: Adds the new patient to the database session (stages it for insertion)
        self.db.commit()               # Line 57: Commits the transaction — actually writes the patient to the database
        self.db.refresh(patient)       # Line 58: Refreshes the object from the database to get server-generated values (id, created_at, updated_at)
        return patient                 # Line 59: Returns the newly created patient with all fields populated

    def update_patient(self, patient_id: UUID, data: PatientUpdate) -> Patient | None:  # Line 61: Updates an existing patient with partial data
        patient = self.get_patient(patient_id)  # Line 62: Fetches the existing patient
        if not patient:                # Line 63: If not found...
            return None                # Line 64: ...return None (the router will convert this to a 404)
        for field, value in data.model_dump(exclude_unset=True).items():  # Line 65: model_dump(exclude_unset=True) only returns fields the client actually sent — if they didn't send "phone", it won't be in the dictionary, so phone won't be changed. Loops through each provided field-value pair
            setattr(patient, field, value)  # Line 66: Sets each field on the Patient ORM object (e.g., patient.first_name = "Jane")
        self.db.commit()               # Line 67: Commits the changes to the database
        self.db.refresh(patient)       # Line 68: Refreshes to get the updated updated_at timestamp
        return patient                 # Line 69: Returns the updated patient

    def delete_patient(self, patient_id: UUID) -> bool:  # Line 71: Deletes a patient and all their notes/labs (via cascade)
        patient = self.get_patient(patient_id)  # Line 72: Fetches the patient
        if not patient:                # Line 73: If not found...
            return False               # Line 74: ...return False (router converts to 404)
        self.db.delete(patient)        # Line 75: Marks the patient for deletion — the CASCADE on notes and labs means they'll be auto-deleted too
        self.db.commit()               # Line 76: Commits the deletion
        return True                    # Line 77: Returns True to indicate success
```

---

### `backend/app/services/note_service.py` — Note Business Logic

```python
from datetime import datetime, timezone  # Line 1: Imports datetime and UTC timezone for default timestamps
from uuid import UUID                  # Line 2: UUID type for IDs

from sqlalchemy.orm import Session     # Line 4: Database session type

from app.models.note import Note       # Line 6: Note ORM model
from app.schemas.note import NoteCreate  # Line 7: Note creation schema


class NoteService:                     # Line 10: Service class for note operations
    def __init__(self, db: Session):   # Line 11: Constructor
        self.db = db                   # Line 12: Stores the database session

    def get_notes(self, patient_id: UUID) -> list[Note]:  # Line 14: Fetches all notes for a patient
        return (
            self.db.query(Note)        # Line 16: Start a query on the notes table
            .filter(Note.patient_id == patient_id)  # Line 17: Only get notes belonging to this patient
            .order_by(Note.timestamp.desc())  # Line 18: Order by timestamp descending (newest first)
            .all()                     # Line 19: Execute the query and return all matching rows as a list
        )

    def add_note(self, patient_id: UUID, data: NoteCreate) -> Note:  # Line 22: Creates a new note
        note = Note(                   # Line 23: Creates a Note ORM object
            patient_id=patient_id,     # Line 24: Links the note to the patient
            content=data.content,      # Line 25: Sets the note text from the request data
            timestamp=data.timestamp or datetime.now(timezone.utc),  # Line 26: Uses the client-provided timestamp if given, otherwise defaults to current UTC time
        )
        self.db.add(note)              # Line 28: Stages the note for insertion
        self.db.commit()               # Line 29: Writes to the database
        self.db.refresh(note)          # Line 30: Refreshes to get the auto-generated id and created_at
        return note                    # Line 31: Returns the new note

    def delete_note(self, patient_id: UUID, note_id: UUID) -> bool:  # Line 33: Deletes a specific note
        note = (
            self.db.query(Note)        # Line 35: Query the notes table
            .filter(Note.id == note_id, Note.patient_id == patient_id)  # Line 36: Match BOTH the note ID AND the patient ID — this prevents deleting a note that belongs to a different patient
            .first()                   # Line 37: Get the first (and only) matching note, or None
        )
        if not note:                   # Line 39: If no matching note found...
            return False               # Line 40: ...return False
        self.db.delete(note)           # Line 41: Mark the note for deletion
        self.db.commit()               # Line 42: Commit the deletion
        return True                    # Line 43: Return True for success
```

---

### `backend/app/services/lab_service.py` — Lab Business Logic

```python
from datetime import datetime, timezone  # Line 1: For default timestamps
from uuid import UUID                  # Line 2: UUID type

from sqlalchemy.orm import Session     # Line 4: Database session type

from app.models.lab import Lab         # Line 6: Lab ORM model
from app.schemas.lab import LabCreate, LabUpdate  # Line 7: Lab schemas


class LabService:                      # Line 10: Service class for lab operations
    def __init__(self, db: Session):   # Line 11: Constructor
        self.db = db                   # Line 12: Stores the database session

    def get_labs(self, patient_id: UUID) -> list[Lab]:  # Line 14: Fetches all labs for a patient
        return (
            self.db.query(Lab)         # Line 16: Query the labs table
            .filter(Lab.patient_id == patient_id)  # Line 17: Filter by patient
            .order_by(Lab.ordered_date.desc())  # Line 18: Most recently ordered first
            .all()                     # Line 19: Return all matching rows
        )

    def add_lab(self, patient_id: UUID, data: LabCreate) -> Lab:  # Line 22: Creates a new lab order
        lab = Lab(                     # Line 23: Creates a Lab ORM object
            patient_id=patient_id,     # Line 24: Links to the patient
            test_name=data.test_name,  # Line 25: Sets the test name (e.g., "CBC")
            ordered_date=data.ordered_date or datetime.now(timezone.utc),  # Line 26: Uses provided date or defaults to now
            status=data.status,        # Line 27: Sets the initial status (usually "ordered")
            result=data.result,        # Line 28: Sets results (usually None for new orders)
            result_date=data.result_date,  # Line 29: Sets result date (usually None)
            notes=data.notes,          # Line 30: Sets any additional notes
        )
        self.db.add(lab)               # Line 32: Stages for insertion
        self.db.commit()               # Line 33: Writes to database
        self.db.refresh(lab)           # Line 34: Gets auto-generated fields
        return lab                     # Line 35: Returns the new lab

    def update_lab(self, patient_id: UUID, lab_id: UUID, data: LabUpdate) -> Lab | None:  # Line 37: Updates an existing lab
        lab = (
            self.db.query(Lab)         # Line 39: Query labs
            .filter(Lab.id == lab_id, Lab.patient_id == patient_id)  # Line 40: Match both IDs for security
            .first()                   # Line 41: Get the lab or None
        )
        if not lab:                    # Line 43: If not found...
            return None                # Line 44: ...return None
        for field, value in data.model_dump(exclude_unset=True).items():  # Line 45: Loop through only the fields the client sent
            setattr(lab, field, value)  # Line 46: Update each field on the Lab object
        self.db.commit()               # Line 47: Save changes
        self.db.refresh(lab)           # Line 48: Refresh from database
        return lab                     # Line 49: Return updated lab

    def delete_lab(self, patient_id: UUID, lab_id: UUID) -> bool:  # Line 51: Deletes a lab
        lab = (
            self.db.query(Lab)         # Line 53: Query labs
            .filter(Lab.id == lab_id, Lab.patient_id == patient_id)  # Line 54: Match both IDs
            .first()                   # Line 55: Get the lab or None
        )
        if not lab:                    # Line 57: If not found...
            return False               # Line 58: ...return False
        self.db.delete(lab)            # Line 59: Mark for deletion
        self.db.commit()               # Line 60: Commit
        return True                    # Line 61: Success
```

---

### `backend/app/services/gemini_service.py` — AI Summary Service

This service generates clinical summaries using Google Gemini AI, with a template fallback when no API key is configured.

```python
import logging                         # Line 1: For logging warnings when the API fails
from typing import TYPE_CHECKING       # Line 2: TYPE_CHECKING is True only during type checking (not at runtime) — used to avoid circular imports

import google.generativeai as genai    # Line 4: Imports the Google Generative AI SDK for calling Gemini models

from app.config import settings        # Line 6: Imports settings to get the GEMINI_API_KEY

if TYPE_CHECKING:                      # Line 8: This block only runs during type checking (e.g., in your IDE), NOT at runtime. Prevents circular import issues
    from app.models.note import Note   # Line 9: Import Note type for type hints only
    from app.models.patient import Patient  # Line 10: Import Patient type for type hints only

logger = logging.getLogger(__name__)   # Line 12: Creates a logger for this module


class GeminiService:                   # Line 15: Service class for AI summary generation
    def __init__(self) -> None:        # Line 16: Constructor
        genai.configure(api_key=settings.GEMINI_API_KEY)  # Line 17: Configures the Google AI SDK with the API key from settings
        self.model = genai.GenerativeModel("gemini-2.5-flash")  # Line 18: Creates a Gemini 2.5 Flash model instance — Flash is the faster, cheaper model variant

    def generate_summary(self, patient: "Patient", notes: list["Note"]) -> str:  # Line 20: Main method — takes a patient and their notes, returns a summary string
        if not settings.GEMINI_API_KEY:  # Line 21: If no API key is configured...
            return self._template_summary(patient, notes)  # Line 22: ...fall back to the template-based summary (no AI needed)

        try:                           # Line 24: Try to call the AI API
            notes_text = "\n".join(    # Line 25: Joins all notes into a single string with newlines
                [
                    f"[{n.timestamp.strftime('%Y-%m-%d %H:%M')}] {n.content}"  # Line 27: Formats each note as "[2025-03-01 10:30] Note content here"
                    for n in sorted(notes, key=lambda n: n.timestamp)  # Line 28: Sorts notes chronologically (oldest first) so the AI sees them in order
                ]
            )
            from datetime import date  # Line 31: Local import of date (imported here to avoid top-level circular imports)
            age = (                    # Line 32: Calculates the patient's age
                date.today().year      # Line 33: Current year
                - patient.date_of_birth.year  # Line 34: Minus birth year
                - (                    # Line 35: Minus 1 if birthday hasn't occurred yet this year
                    (date.today().month, date.today().day)  # Line 36: Current (month, day) tuple
                    < (patient.date_of_birth.month, patient.date_of_birth.day)  # Line 37: Compared to birth (month, day) — True (1) means birthday is later this year
                )
            )

            prompt = f"""You are a clinical documentation assistant..."""  # Lines 41-60: Constructs the prompt sent to Gemini — includes patient demographics, conditions, allergies, status, and all clinical notes. Asks for a 2-3 paragraph professional summary

            response = self.model.generate_content(prompt)  # Line 62: Sends the prompt to the Gemini API and waits for the response
            return response.text       # Line 63: Returns the generated text from the AI

        except Exception as e:         # Line 65: If the API call fails for any reason (network error, rate limit, invalid key, etc.)...
            logger.warning(f"Gemini API error: {e}. Falling back to template summary.")  # Line 66: Log a warning with the error details
            return self._template_summary(patient, notes)  # Line 67: Fall back to the template-based summary

    def _template_summary(self, patient: "Patient", notes: list["Note"]) -> str:  # Line 69: Fallback method — generates a structured summary without AI
        from datetime import date      # Line 70: Local import of date
        age = (...)                    # Lines 71-77: Calculates age (same logic as above)
        conditions = ", ".join(patient.conditions) if patient.conditions else "none documented"  # Line 79: Joins conditions into a comma-separated string, or "none documented" if empty
        allergies = ", ".join(patient.allergies) if patient.allergies else "none documented"  # Line 80: Same for allergies
        note_count = len(notes)        # Line 81: Counts how many notes the patient has
        latest_note = notes[0].content if notes else "No notes available."  # Line 82: Gets the most recent note's content, or a fallback message

        return (                       # Lines 84-92: Returns a formatted template string with patient info, conditions, allergies, note count, latest note, and last visit date
            f"{patient.first_name} {patient.last_name} is a {age}-year-old patient "
            f"(Blood Type: {patient.blood_type or 'Unknown'}) with a current status of {patient.status}. "
            f"Known conditions include {conditions}. Known allergies: {allergies}.\n\n"
            f"This patient has {note_count} clinical note(s) on record. "
            f"Most recent entry: \"{latest_note}\"\n\n"
            f"Last visit recorded: {patient.last_visit or 'Not on record'}. "
            f"Please review full notes for complete clinical history."
        )
```

---

## Frontend Files

---

### `frontend/src/main.tsx` — React Entry Point

This is the very first file that runs when the browser loads the app. It mounts the React application to the DOM.

```tsx
import React from "react";             // Line 1: Imports the React library — needed for JSX and StrictMode
import ReactDOM from "react-dom/client";  // Line 2: Imports ReactDOM's createRoot — the modern React 18 way to mount an app to the DOM
import "@fontsource/inter/400.css";    // Line 3: Imports the Inter font at weight 400 (regular) — self-hosted via the @fontsource package instead of Google Fonts CDN
import "@fontsource/inter/500.css";    // Line 4: Inter weight 500 (medium) — used for slightly bolder body text
import "@fontsource/inter/600.css";    // Line 5: Inter weight 600 (semi-bold) — used for headings
import "@fontsource/inter/700.css";    // Line 6: Inter weight 700 (bold) — used for emphasis
import "@fontsource/playfair-display/400.css";  // Line 7: Imports Playfair Display serif font weight 400 — used for the "font-display" class on page titles
import "@fontsource/playfair-display/600.css";  // Line 8: Playfair Display weight 600
import "@fontsource/playfair-display/700.css";  // Line 9: Playfair Display weight 700
import App from "./App";              // Line 10: Imports the root App component that contains routing, providers, and all pages
import "./index.css";                 // Line 11: Imports global CSS — Tailwind CSS directives, CSS variables for colors, and custom styles

ReactDOM.createRoot(document.getElementById("root")!)  // Line 13: Finds the HTML element with id="root" (in index.html) and creates a React root. The ! (non-null assertion) tells TypeScript we're sure this element exists
  .render(                            // Calls render to mount the React component tree
    <React.StrictMode>                // Line 14: Wraps the app in StrictMode — in development, this runs components twice to help catch bugs, and warns about deprecated React patterns. Has no effect in production
      <App />                         // Line 15: Renders the App component — this is the entire application
    </React.StrictMode>
  );
```

---

### `frontend/src/App.tsx` — Application Root

This file sets up all the providers (React Query, Router, Error Boundary) and defines the route map with lazy-loaded page components.

```tsx
import { lazy, Suspense } from "react";  // Line 1: lazy() enables code splitting — components are loaded only when needed. Suspense shows a fallback UI while lazy components load
import { BrowserRouter, Routes, Route } from "react-router-dom";  // Line 2: BrowserRouter provides client-side routing using the browser's history API. Routes/Route define URL-to-component mappings
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";  // Line 3: QueryClient manages the cache for all API queries. QueryClientProvider makes it available to all components
import { AppShell } from "@/components/layout/AppShell";  // Line 4: The main layout wrapper (sidebar + header + content area)
import { ErrorBoundary } from "@/components/common/ErrorBoundary";  // Line 5: Catches JavaScript errors in child components and shows a fallback UI instead of crashing the whole app
import { Toaster } from "@/components/ui/toast";  // Line 6: Renders toast notifications (success/error popups) at the bottom of the screen
import { Skeleton } from "@/components/ui/skeleton";  // Line 7: Animated placeholder rectangles shown while content loads

const DashboardPage = lazy(() =>       // Line 10: Lazily loads DashboardPage — the JavaScript for this component is in a separate bundle that only downloads when you visit "/"
  import("@/pages/DashboardPage").then((m) => ({ default: m.DashboardPage }))  // Line 11: Dynamic import returns a module, .then extracts the named export DashboardPage and wraps it as the default export (required by React.lazy)
);
const PatientsPage = lazy(() =>        // Line 13: Same pattern for PatientsPage — loaded when you visit /patients
  import("@/pages/PatientsPage").then((m) => ({ default: m.PatientsPage }))
);
const PatientDetailPage = lazy(() =>   // Line 16: Loaded when you visit /patients/:id
  import("@/pages/PatientDetailPage").then((m) => ({ default: m.PatientDetailPage }))
);
const PatientCreatePage = lazy(() =>   // Line 19: Loaded when you visit /patients/new
  import("@/pages/PatientCreatePage").then((m) => ({ default: m.PatientCreatePage }))
);
const PatientEditPage = lazy(() =>     // Line 22: Loaded when you visit /patients/:id/edit
  import("@/pages/PatientEditPage").then((m) => ({ default: m.PatientEditPage }))
);
const SettingsPage = lazy(() =>        // Line 25: Loaded when you visit /settings
  import("@/pages/SettingsPage").then((m) => ({ default: m.SettingsPage }))
);
const NotFoundPage = lazy(() =>        // Line 28: Loaded when you visit any unrecognized URL
  import("@/pages/NotFoundPage").then((m) => ({ default: m.NotFoundPage }))
);

function PageLoader() {                // Line 32: A loading skeleton shown while lazy-loaded pages are downloading. Mimics the shape of a typical page to prevent layout shift
  return (
    <div className="p-6 space-y-4">   // Padding and vertical spacing
      <Skeleton className="h-8 w-48" />  // Placeholder for page title
      <Skeleton className="h-4 w-72" />  // Placeholder for subtitle
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">  // Grid mimicking stat cards
        <Skeleton className="h-24 rounded-xl" />  // 4 card-sized skeletons
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
      </div>
      <Skeleton className="h-64 rounded-xl mt-4" />  // Large content area skeleton
    </div>
  );
}

const queryClient = new QueryClient({  // Line 48: Creates the React Query client — manages caching, deduplication, and refetching of all API data
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30,           // Line 51: Data is considered fresh for 30 seconds. During this time, navigating away and back won't trigger a refetch. After 30s, data is "stale" and will refetch in the background on next access
      retry: 1,                        // Line 52: If a query fails, retry it once before showing an error
    },
  },
});

export default function App() {        // Line 57: The root App component — default export so main.tsx can import it
  return (
    <QueryClientProvider client={queryClient}>  // Line 59: Provides the query client to all child components — any component can now use useQuery/useMutation hooks
      <ErrorBoundary>                  // Line 60: Wraps the app in an error boundary — if any component throws an error during rendering, this catches it and shows a friendly error message instead of a white screen
      <BrowserRouter>                  // Line 61: Enables client-side routing — URL changes don't reload the page
        <Routes>                       // Line 62: Container for all route definitions
          <Route element={<AppShell />}>  // Line 63: Layout route — AppShell wraps all child routes with the sidebar and header. Child route content renders inside AppShell's <Outlet />
            <Route path="/" element={<Suspense fallback={<PageLoader />}><DashboardPage /></Suspense>} />  // Line 64: Root URL shows the dashboard. Suspense shows PageLoader skeleton while DashboardPage's JS bundle downloads
            <Route path="/patients" element={<Suspense fallback={<PageLoader />}><PatientsPage /></Suspense>} />  // Line 65: /patients shows the patient list page
            <Route path="/patients/new" element={<Suspense fallback={<PageLoader />}><PatientCreatePage /></Suspense>} />  // Line 66: /patients/new shows the create patient form
            <Route path="/patients/:id" element={<Suspense fallback={<PageLoader />}><PatientDetailPage /></Suspense>} />  // Line 67: /patients/:id shows a specific patient's details. :id is a URL parameter
            <Route path="/patients/:id/edit" element={<Suspense fallback={<PageLoader />}><PatientEditPage /></Suspense>} />  // Line 68: /patients/:id/edit shows the edit form for a patient
            <Route path="/settings" element={<Suspense fallback={<PageLoader />}><SettingsPage /></Suspense>} />  // Line 69: /settings shows user preferences
            <Route path="*" element={<Suspense fallback={<PageLoader />}><NotFoundPage /></Suspense>} />  // Line 70: * matches any URL that didn't match above — shows a 404 page
          </Route>
        </Routes>
      </BrowserRouter>
      </ErrorBoundary>
      <Toaster />                      // Line 124: Renders the toast notification container — toasts appear here when triggered by mutations (create/update/delete)
    </QueryClientProvider>
  );
}
```

---

### `frontend/src/lib/api.ts` — Axios API Client

Configures the HTTP client used for all API calls with a base URL and error handling.

```tsx
import axios from "axios";            // Line 1: Imports the axios HTTP library — used instead of fetch() for cleaner syntax and interceptors

export const api = axios.create({      // Line 3: Creates a pre-configured axios instance. All API calls use this instance instead of raw axios
  baseURL: "/api/v1",                  // Line 4: All requests are prefixed with /api/v1 — so api.get("/patients") becomes GET /api/v1/patients. Vite's dev server proxies this to the backend at localhost:8000
  headers: { "Content-Type": "application/json" },  // Line 5: Sets the default Content-Type header — tells the server we're sending JSON
});

api.interceptors.response.use(         // Line 8: Registers a response interceptor — runs on every API response before it reaches the calling code
  (res) => res,                        // Line 9: Success handler — if the response is 2xx, pass it through unchanged
  (error) => {                         // Line 10: Error handler — runs when the server returns a 4xx or 5xx error
    const detail = error.response?.data?.detail;  // Line 11: Extracts the "detail" field from the error response body — FastAPI puts error messages here
    const message =
      typeof detail === "string"       // Line 13: If detail is a simple string (e.g., "Patient not found")...
        ? detail                       // Line 14: ...use it directly
        : Array.isArray(detail)        // Line 15: If detail is an array (Pydantic validation errors return an array of error objects)...
          ? detail.map((e: { msg: string }) => e.msg).join(", ")  // Line 16: ...extract each error's "msg" field and join them with commas (e.g., "Name cannot be empty, Invalid email")
          : "An unexpected error occurred";  // Line 17: If detail is neither string nor array, use a generic message
    return Promise.reject(new Error(message));  // Line 18: Rejects the promise with a clean Error object — the calling code gets a simple error.message string instead of raw axios error objects
  }
);
```

---

### `frontend/src/lib/queryKeys.ts` — TanStack Query Key Factory

Centralizes all cache keys used by React Query. This ensures consistent cache invalidation.

```tsx
export const queryKeys = {             // Line 1: Exports a single object containing all query key factories — prevents typos and ensures the same key format everywhere
  patients: {
    all: ["patients"] as const,        // Line 3: Base key for all patient-related queries — used to invalidate ALL patient caches at once (list + details). `as const` makes it a readonly tuple for type safety
    list: (params: object) => ["patients", "list", params] as const,  // Line 4: Key for patient list queries — includes the params object so different filters/pages have different cache entries
    detail: (id: string) => ["patients", "detail", id] as const,  // Line 5: Key for individual patient queries — each patient ID gets its own cache entry
  },
  notes: {
    list: (patientId: string) => ["notes", patientId] as const,  // Line 8: Key for a patient's notes — each patient's notes are cached separately
  },
  labs: {
    list: (patientId: string) => ["labs", patientId] as const,  // Line 11: Key for a patient's labs
  },
  summary: {
    get: (patientId: string) => ["summary", patientId] as const,  // Line 14: Key for a patient's AI summary
  },
};
```

---

### `frontend/src/lib/utils.ts` — Utility Functions

```tsx
import { clsx, type ClassValue } from "clsx";  // Line 1: Imports clsx — a utility for conditionally joining CSS class names. ClassValue is its TypeScript type
import { twMerge } from "tailwind-merge";  // Line 2: Imports twMerge — intelligently merges Tailwind CSS classes, resolving conflicts (e.g., "p-2 p-4" becomes "p-4")

export function cn(...inputs: ClassValue[]) {  // Line 4: The cn() function — used everywhere in the codebase to combine CSS classes. Accepts any number of class values (strings, arrays, objects, conditionals)
  return twMerge(clsx(inputs));        // Line 5: First, clsx joins all inputs into a single class string (handling conditionals). Then twMerge resolves Tailwind conflicts
}

export function formatDate(dateStr: string | null | undefined): string {  // Line 8: Formats a date string (e.g., "2025-03-14") into a readable format (e.g., "Mar 14, 2025")
  if (!dateStr) return "—";           // Line 9: If the date is null or undefined, return an em dash as a placeholder
  return new Date(dateStr).toLocaleDateString("en-US", {  // Line 10: Creates a Date object and formats it using US English locale
    year: "numeric",                   // Line 11: Show the full year (2025)
    month: "short",                    // Line 12: Show abbreviated month (Mar)
    day: "numeric",                    // Line 13: Show the day number (14)
  });
}

export function formatDateTime(dateStr: string | null | undefined): string {  // Line 17: Formats a datetime string with both date AND time
  if (!dateStr) return "—";           // Line 18: Return dash if null
  return new Date(dateStr).toLocaleString("en-US", {  // Line 19: toLocaleString includes time (unlike toLocaleDateString)
    year: "numeric",                   // Line 20: Full year
    month: "short",                    // Line 21: Abbreviated month
    day: "numeric",                    // Line 22: Day number
    hour: "2-digit",                   // Line 23: Hour with leading zero (01, 02, ... 12)
    minute: "2-digit",                 // Line 24: Minutes with leading zero (00, 01, ... 59)
  });
}
```

---

### `frontend/src/types/patient.ts` — Patient TypeScript Types

```tsx
export type PatientStatus = "active" | "inactive" | "critical";  // Line 1: Union type — a patient's status can only be one of these three exact strings
export type BloodType = "A+" | "A-" | "B+" | "B-" | "O+" | "O-" | "AB+" | "AB-";  // Line 2: Union type for all valid blood types

export interface Patient {             // Line 4: The main Patient interface — describes the shape of a patient object returned by the API
  id: string;                          // Line 5: UUID as a string — the patient's unique identifier
  first_name: string;                  // Line 6: Patient's first name
  last_name: string;                   // Line 7: Patient's last name
  full_name: string;                   // Line 8: Computed by the backend — "first_name last_name"
  date_of_birth: string;              // Line 9: ISO date string (e.g., "1990-05-15")
  age: number;                         // Line 10: Computed by the backend from date_of_birth
  email: string;                       // Line 11: Patient's email address
  phone: string | null;                // Line 12: Phone number or null if not provided
  address: string | null;              // Line 13: Address or null
  blood_type: BloodType | null;        // Line 14: Blood type or null if unknown
  allergies: string[];                 // Line 15: Array of allergy strings (e.g., ["Penicillin", "Latex"])
  conditions: string[];                // Line 16: Array of condition strings (e.g., ["Hypertension", "Diabetes"])
  status: PatientStatus;               // Line 17: Current status — "active", "inactive", or "critical"
  last_visit: string | null;           // Line 18: ISO date of last visit or null
  insurance_provider: string | null;   // Line 19: Insurance company name or null
  insurance_policy_number: string | null;  // Line 20: Policy number or null
  insurance_group_number: string | null;  // Line 21: Group number or null
  medical_history: string | null;      // Line 22: Free-text medical history or null
  family_history: string[];            // Line 23: Array of family condition strings
  consent_forms: string[];             // Line 24: Array of signed consent form names
  created_at: string;                  // Line 25: ISO datetime when the record was created
  updated_at: string;                  // Line 26: ISO datetime when the record was last updated
}

export interface PatientCreate {       // Line 29: Interface for creating a patient — sent as the POST request body
  first_name: string;                  // Line 30: Required
  last_name: string;                   // Line 31: Required
  date_of_birth: string;              // Line 32: Required
  email: string;                       // Line 33: Required
  phone?: string | null;               // Line 34: Optional (? means the field doesn't need to be included)
  address?: string | null;             // Line 35-46: All other fields are optional with sensible defaults on the backend
  blood_type?: BloodType | null;
  allergies?: string[];
  conditions?: string[];
  status?: PatientStatus;
  last_visit?: string | null;
  insurance_provider?: string | null;
  insurance_policy_number?: string | null;
  insurance_group_number?: string | null;
  medical_history?: string | null;
  family_history?: string[];
  consent_forms?: string[];
}

export type PatientUpdate = Partial<PatientCreate>;  // Line 49: PatientUpdate makes ALL fields of PatientCreate optional — used for partial updates where you only send the changed fields

export interface PaginatedResponse<T> {  // Line 51: Generic paginated response — T is the item type (Patient, Note, etc.)
  items: T[];                          // Line 52: Array of items for the current page
  total: number;                       // Line 53: Total number of items across all pages
  page: number;                        // Line 54: Current page number
  page_size: number;                   // Line 55: Number of items per page
  total_pages: number;                 // Line 56: Total number of pages
}
```

---

### `frontend/src/hooks/usePatients.ts` — Patient List Query Hook

```tsx
import { useQuery } from "@tanstack/react-query";  // Line 1: Imports useQuery — the main hook for fetching and caching data
import { api } from "@/lib/api";       // Line 2: The configured axios instance
import { queryKeys } from "@/lib/queryKeys";  // Line 3: Cache key factory
import type { PaginatedResponse, Patient } from "@/types/patient";  // Line 4: TypeScript types

interface PatientListParams {          // Line 6: Defines the parameters this hook accepts
  page?: number;
  page_size?: number;
  search?: string;
  sort_by?: string;
  sort_order?: string;
  status?: string;
}

export function usePatients(params: PatientListParams) {  // Line 15: Custom hook that fetches a paginated list of patients
  return useQuery({                    // Line 16: Calls React Query's useQuery hook — it handles caching, loading states, refetching, and deduplication
    queryKey: queryKeys.patients.list(params),  // Line 17: The cache key — includes params so different filters/pages are cached separately. Changing any param triggers a new fetch
    queryFn: async () => {             // Line 18: The function that actually fetches the data — called by React Query when data is needed
      const { data } = await api.get<PaginatedResponse<Patient>>("/patients", {  // Line 19: Makes GET /api/v1/patients with query parameters. Destructures the response to get just the data
        params: {
          ...params,                   // Line 21: Spreads all params as URL query params (?page=1&page_size=10&sort_by=last_name...)
          status: params.status || undefined,  // Line 22: If status is an empty string, convert it to undefined so it's omitted from the URL (empty string would filter incorrectly)
        },
      });
      return data;                     // Line 25: Returns the paginated response data
    },
    placeholderData: (prev) => prev,   // Line 27: While fetching new data (e.g., when changing pages), keep showing the previous page's data to avoid a blank flash. This creates a smooth transition between pages
  });
}
```

---

### `frontend/src/hooks/useDebounce.ts` — Debounce Hook

```tsx
import { useEffect, useState } from "react";  // Line 1: React hooks

export function useDebounce<T>(value: T, delay = 300): T {  // Line 3: Generic debounce hook — delays updating the returned value until the input has stopped changing for `delay` milliseconds. Used for search input to avoid sending an API request on every keystroke
  const [debounced, setDebounced] = useState(value);  // Line 4: State that holds the debounced value — initially matches the input
  useEffect(() => {                    // Line 5: Runs whenever value or delay changes
    const timer = setTimeout(() => setDebounced(value), delay);  // Line 6: Sets a timer to update the debounced value after the delay
    return () => clearTimeout(timer);  // Line 7: Cleanup — if value changes again before the timer fires, cancel the previous timer. This is the core debounce mechanism
  }, [value, delay]);                  // Line 8: Dependencies — re-run the effect when value or delay changes
  return debounced;                    // Line 9: Returns the debounced value — only updates after the user stops typing for 300ms
}
```

---

### `frontend/src/store/patientStore.ts` — Patient Filter Store (Zustand)

```tsx
import { create } from "zustand";     // Line 1: Imports Zustand's create function — creates a global state store

interface PatientFilters {             // Line 3: TypeScript interface defining the store's shape
  search: string;                      // Line 4: Current search term
  status: string;                      // Line 5: Current status filter ("", "active", "inactive", "critical")
  sortBy: string;                      // Line 6: Current sort column
  sortOrder: "asc" | "desc";          // Line 7: Current sort direction
  page: number;                        // Line 8: Current page number
  setSearch: (search: string) => void;  // Line 10: Action to update search
  setStatus: (status: string) => void;  // Line 11: Action to update status filter
  setSortBy: (field: string) => void;  // Line 12: Action to update sort column
  setSortOrder: (order: "asc" | "desc") => void;  // Line 13: Action to update sort direction
  setPage: (page: number) => void;     // Line 14: Action to change page
  resetFilters: () => void;            // Line 15: Action to reset all filters to defaults
}

export const usePatientStore = create<PatientFilters>((set) => ({  // Line 18: Creates the Zustand store — set() is used to update state
  search: "",                          // Line 19: Default: no search filter
  status: "",                          // Line 20: Default: show all statuses
  sortBy: "last_name",                 // Line 21: Default: sort by last name
  sortOrder: "asc",                    // Line 22: Default: ascending order
  page: 1,                             // Line 23: Default: first page
  setSearch: (search) => set({ search, page: 1 }),  // Line 24: When search changes, also reset to page 1 (search results might have fewer pages)
  setStatus: (status) => set({ status, page: 1 }),  // Line 25: Same — reset to page 1 when filter changes
  setSortBy: (sortBy) => set({ sortBy }),  // Line 26: Just update the sort column
  setSortOrder: (sortOrder) => set({ sortOrder }),  // Line 27: Just update the sort direction
  setPage: (page) => set({ page }),    // Line 28: Update the current page
  resetFilters: () =>                  // Line 29: Resets everything back to defaults
    set({ search: "", status: "", sortBy: "last_name", sortOrder: "asc", page: 1 }),
}));
```

---

### `frontend/src/store/settingsStore.ts` — Settings Store (Zustand with Persistence)

```tsx
import { create } from "zustand";     // Line 1: Zustand's create function
import { persist } from "zustand/middleware";  // Line 2: persist middleware — automatically saves/loads state to localStorage

export const useSettingsStore = create<SettingsState>()(  // Line 24: Creates the settings store with persistence
  persist(                             // Line 25: Wraps the store creator with the persist middleware
    (set) => ({
      displayName: "Daniel Goetz",     // Line 27: Default display name
      email: "d.goetz@pulse.health",   // Line 28: Default email
      role: "Administrator",           // Line 29: Default role
      emailNotifications: true,        // Line 31: Email notifications on by default
      smsNotifications: false,         // Line 32: SMS off by default
      pushNotifications: true,         // Line 33: Push notifications on by default
      criticalAlerts: true,            // Line 34: Critical alerts always on by default
      compactMode: false,              // Line 36: Compact mode off by default
      // Lines 38-43: Setter functions — each updates a single setting
      setDisplayName: (displayName) => set({ displayName }),
      setEmailNotifications: (emailNotifications) => set({ emailNotifications }),
      setSmsNotifications: (smsNotifications) => set({ smsNotifications }),
      setPushNotifications: (pushNotifications) => set({ pushNotifications }),
      setCriticalAlerts: (criticalAlerts) => set({ criticalAlerts }),
      setCompactMode: (compactMode) => set({ compactMode }),
    }),
    { name: "pulse-settings" }         // Line 47: The localStorage key — settings are saved as JSON under "pulse-settings" so they survive page refreshes and browser restarts
  )
);
```

---

### `frontend/src/store/uiStore.ts` — UI State Store

```tsx
import { create } from "zustand";     // Line 1: Zustand

export const useUIStore = create<UIState>((set) => ({  // Line 9: Creates a store for UI state
  sidebarOpen: true,                   // Line 10: Sidebar is open by default on desktop
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),  // Line 11: Toggles the sidebar open/closed — reads current state and flips the boolean
  setSidebarOpen: (open) => set({ sidebarOpen: open }),  // Line 12: Explicitly sets sidebar state (used by mobile backdrop click)
}));
```

---

### `frontend/src/components/layout/AppShell.tsx` — Main Layout

```tsx
import { Outlet } from "react-router-dom";  // Line 1: Outlet renders the child route's component — whatever page matches the current URL
import { Sidebar } from "./Sidebar";   // Line 2: The navigation sidebar component
import { Header } from "./Header";     // Line 3: The top header bar

export function AppShell() {           // Line 5: The main layout wrapper used by all pages
  return (
    <div className="flex h-screen bg-background overflow-hidden">  // Line 7: Full-height flexbox container — sidebar and content sit side by side. overflow-hidden prevents double scrollbars
      <Sidebar />                      // Line 8: Renders the navigation sidebar on the left
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">  // Line 9: The right side — takes up remaining space (flex-1). min-w-0 prevents flex children from overflowing. flex-col stacks header on top of content
        <Header />                     // Line 10: Renders the top header bar
        <main className="flex-1 overflow-y-auto">  // Line 11: The content area — takes remaining vertical space (flex-1), scrolls vertically if content overflows
          <Outlet />                   // Line 12: React Router renders the matched page component here — DashboardPage, PatientsPage, etc.
        </main>
      </div>
    </div>
  );
}
```

---

### `frontend/src/hooks/usePatientMutations.ts` — Patient Create/Update/Delete Hooks

```tsx
export function useCreatePatient() {   // Line 8: Hook for creating a new patient
  const queryClient = useQueryClient();  // Line 9: Gets the React Query client — used to invalidate caches after mutation
  const { toast } = useToast();        // Line 10: Gets the toast function for showing notifications
  const navigate = useNavigate();      // Line 11: Gets the navigation function for redirecting after success

  return useMutation({                 // Line 13: Creates a mutation hook — unlike useQuery (for reading), useMutation is for write operations
    mutationFn: (data: PatientCreate) => api.post("/patients", data).then((r) => r.data),  // Line 14: The function that runs when mutate() is called — POSTs to /patients and returns the created patient
    onSuccess: (patient) => {          // Line 15: Runs after successful creation
      queryClient.invalidateQueries({ queryKey: queryKeys.patients.all });  // Line 16: Invalidates all patient caches — the patient list will refetch to include the new patient
      toast({ title: "Patient created", description: `${patient.full_name} has been added.` });  // Line 17: Shows a success toast notification
      navigate(`/patients/${patient.id}`);  // Line 18: Redirects to the new patient's detail page
    },
    onError: (err: Error) =>           // Line 20: Runs if the API call fails
      toast({ title: "Error", description: err.message, variant: "destructive" }),  // Line 21: Shows a red error toast with the error message
  });
}

export function useUpdatePatient(id: string) {  // Line 25: Hook for updating a patient — takes the patient ID
  // Same pattern: useMutation + invalidate caches + toast + navigate
  // Invalidates both the patient list AND the specific patient detail cache
}

export function useDeletePatient() {   // Line 43: Hook for deleting a patient
  // Same pattern: useMutation + invalidate caches + toast + navigate to /patients
}
```

---

### `frontend/src/components/common/ErrorBoundary.tsx` — Error Boundary

```tsx
export class ErrorBoundary extends Component<Props, State> {  // Line 7: A class component (required for error boundaries — React doesn't support error boundary hooks yet)
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };  // Line 10: Initial state — no error
  }

  static getDerivedStateFromError(error: Error): State {  // Line 13: React lifecycle method — called when a child component throws during rendering
    return { hasError: true, error };  // Line 14: Updates state to indicate an error occurred
  }

  componentDidCatch(error: Error, info: ErrorInfo) {  // Line 17: Called after an error is caught — used for logging
    console.error("Uncaught error:", error, info);  // Line 18: Logs the error and component stack to the console
  }

  render() {
    if (this.state.hasError) {         // Line 22: If an error was caught...
      return (                         // Line 23: ...show a friendly error UI instead of the broken component tree
        <div>
          <h2>Something went wrong</h2>
          <p>{this.state.error?.message}</p>
          <Button onClick={() => this.setState({ hasError: false })}>Try again</Button>  // Line 27: "Try again" resets the error state, causing React to re-render the children
        </div>
      );
    }
    return this.props.children;        // Line 31: If no error, render children normally
  }
}
```

---

## Infrastructure Files

---

### `docker-compose.yml` — Docker Orchestration

```yaml
services:
  db:                                  # The PostgreSQL database service
    image: postgres:15-alpine          # Uses PostgreSQL 15 on Alpine Linux (small image)
    restart: unless-stopped            # Auto-restart unless manually stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-postgres}    # Username — reads from .env, defaults to "postgres"
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-password}  # Password — reads from .env, defaults to "password"
      POSTGRES_DB: ${POSTGRES_DB:-pulse}  # Database name — defaults to "pulse"
    volumes:
      - postgres_data:/var/lib/postgresql/data  # Named volume — persists database data between container restarts
    ports:
      - "5432:5432"                    # Exposes PostgreSQL on host port 5432
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-postgres}"]  # Checks if PostgreSQL is ready to accept connections
      interval: 5s                     # Check every 5 seconds
      timeout: 5s                      # Fail if check takes more than 5 seconds
      retries: 10                      # Try 10 times before marking as unhealthy

  backend:                             # The FastAPI backend service
    build:
      context: ./backend               # Build the Docker image from the ./backend directory
      dockerfile: Dockerfile           # Using the Dockerfile in that directory
    restart: unless-stopped
    env_file:
      - .env                           # Load environment variables from .env file
    environment:
      DATABASE_URL: postgresql://${POSTGRES_USER:-postgres}:${POSTGRES_PASSWORD:-password}@db:5432/${POSTGRES_DB:-pulse}  # Overrides DATABASE_URL to point to the "db" service hostname (Docker networking)
    volumes:
      - ./backend:/app                 # Mounts local backend code into the container — enables hot reload (code changes take effect immediately without rebuilding)
      - /app/__pycache__               # Anonymous volume — prevents Python cache files from leaking between host and container
    ports:
      - "8000:8000"                    # Exposes the API on host port 8000
    depends_on:
      db:
        condition: service_healthy     # Wait for PostgreSQL to be healthy before starting the backend

  frontend:                            # The React/Vite frontend service
    build:
      context: ./frontend
      dockerfile: Dockerfile
    restart: unless-stopped
    volumes:
      - ./frontend:/app                # Mounts local frontend code for hot reload
      - /app/node_modules              # Anonymous volume — preserves container's node_modules (which may have Linux-specific binaries) instead of using the host's
    ports:
      - "5173:5173"                    # Exposes Vite dev server on host port 5173
    depends_on:
      - backend                        # Start after the backend is running

volumes:
  postgres_data:                       # Declares the named volume for PostgreSQL data persistence
```

---

### `backend/start.sh` — Container Startup Script

```bash
#!/bin/bash                            # Line 1: Shebang — tells the OS to run this with bash
set -e                                 # Line 2: Exit immediately if any command fails — prevents the server from starting if migrations or seeding fail

echo "Running database migrations..."  # Line 4: Log message
alembic upgrade head                   # Line 5: Runs all pending Alembic migrations to bring the database schema up to the latest version

echo "Seeding database (if empty)..."  # Line 7: Log message
python scripts/seed.py                 # Line 8: Runs the seed script — only inserts sample data if the database is empty (idempotent)

echo "Starting API server..."          # Line 10: Log message
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload  # Line 11: Starts the FastAPI server. exec replaces the shell process with uvicorn (so signals like SIGTERM reach uvicorn directly). --host 0.0.0.0 listens on all interfaces (required in Docker). --reload watches for file changes and auto-restarts
```

---

### `backend/alembic/versions/0001_initial_tables.py` — First Migration

Creates the initial `patients` and `notes` tables.

```python
def upgrade() -> None:                 # Called when migrating forward
    op.create_table(                   # Creates the "patients" table
        "patients",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),  # UUID primary key
        sa.Column("first_name", sa.String(100), nullable=False),  # Required first name
        sa.Column("last_name", sa.String(100), nullable=False),  # Required last name
        sa.Column("date_of_birth", sa.Date(), nullable=False),  # Required DOB
        sa.Column("email", sa.String(255), nullable=False),  # Required email
        sa.Column("phone", sa.String(30), nullable=True),  # Optional phone
        sa.Column("address", sa.String(500), nullable=True),  # Optional address
        sa.Column("blood_type", sa.String(5), nullable=True),  # Optional blood type
        sa.Column("allergies", postgresql.ARRAY(sa.String()), server_default="{}"),  # String array, empty by default
        sa.Column("conditions", postgresql.ARRAY(sa.String()), server_default="{}"),  # String array
        sa.Column("status", sa.String(20), nullable=False, server_default="active"),  # Required, defaults to "active"
        sa.Column("last_visit", sa.Date(), nullable=True),  # Optional last visit date
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),  # Auto-set timestamp
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),  # Auto-set timestamp
        sa.PrimaryKeyConstraint("id"),  # Sets id as the primary key
        sa.UniqueConstraint("email"),  # Ensures no two patients have the same email
    )
    op.create_index("ix_patients_email", "patients", ["email"])  # Creates an index on email for fast lookups

    op.create_table(                   # Creates the "notes" table
        "notes",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),  # UUID primary key
        sa.Column("patient_id", postgresql.UUID(as_uuid=True), nullable=False),  # Foreign key to patients
        sa.Column("content", sa.Text(), nullable=False),  # Required note text
        sa.Column("timestamp", sa.DateTime(timezone=True), server_default=sa.func.now()),  # When the note was made
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),  # Record creation time
        sa.ForeignKeyConstraint(["patient_id"], ["patients.id"], ondelete="CASCADE"),  # CASCADE: deleting a patient deletes their notes
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_notes_patient_id", "notes", ["patient_id"])  # Index for fast note lookups by patient

def downgrade() -> None:              # Called when rolling back this migration
    op.drop_index("ix_notes_patient_id", table_name="notes")
    op.drop_table("notes")            # Drop notes first (has FK to patients)
    op.drop_index("ix_patients_email", table_name="patients")
    op.drop_table("patients")         # Then drop patients
```

---

### `backend/alembic/versions/0002_clinical_fields.py` — Second Migration

Adds insurance, history, consent fields to patients and creates the `labs` table.

```python
def upgrade() -> None:
    # Adds insurance columns to existing patients table
    op.add_column("patients", sa.Column("insurance_provider", sa.String(255), nullable=True))
    op.add_column("patients", sa.Column("insurance_policy_number", sa.String(100), nullable=True))
    op.add_column("patients", sa.Column("insurance_group_number", sa.String(100), nullable=True))

    # Adds medical history columns
    op.add_column("patients", sa.Column("medical_history", sa.Text(), nullable=True))
    op.add_column("patients", sa.Column("family_history", postgresql.ARRAY(sa.String()), server_default="{}"))

    # Adds consent forms column
    op.add_column("patients", sa.Column("consent_forms", postgresql.ARRAY(sa.String()), server_default="{}"))

    # Creates the labs table (same pattern as notes — FK to patients with CASCADE)
    op.create_table("labs", ...)
    op.create_index("ix_labs_patient_id", "labs", ["patient_id"])

def downgrade() -> None:              # Reverses everything — drops labs table and removes added columns
    op.drop_index("ix_labs_patient_id", table_name="labs")
    op.drop_table("labs")
    op.drop_column("patients", "consent_forms")
    op.drop_column("patients", "family_history")
    op.drop_column("patients", "medical_history")
    op.drop_column("patients", "insurance_group_number")
    op.drop_column("patients", "insurance_policy_number")
    op.drop_column("patients", "insurance_provider")
```
