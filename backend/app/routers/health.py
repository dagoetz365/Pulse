"""
Health check endpoint.

Provides a simple ``GET /health`` endpoint that returns ``{"status": "ok"}``.
Used by Docker health checks and monitoring systems to verify the API is running.
"""

from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
def health_check():
    """Return a simple health status to confirm the API is responsive."""
    return {"status": "ok"}
