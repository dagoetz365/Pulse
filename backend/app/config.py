"""
Application configuration loaded from environment variables.

Uses Pydantic Settings to read values from environment variables and an
optional ``.env`` file. Key settings include:

- **DATABASE_URL**: PostgreSQL connection string (default targets Docker service).
- **GEMINI_API_KEY**: Google Gemini API key for AI-powered clinical summaries.
  When empty, the summary service falls back to a structured template.
- **CORS_ORIGINS**: Allowed origins for cross-origin requests from the frontend.

The singleton ``settings`` instance is imported throughout the backend.
"""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Central configuration loaded from environment variables and .env file."""

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
