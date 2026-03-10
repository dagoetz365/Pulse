from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://postgres:password@db:5432/cura"
    GEMINI_API_KEY: str = ""
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://frontend:5173",
        "http://localhost:3000",
    ]

    class Config:
        env_file = ".env"


settings = Settings()
