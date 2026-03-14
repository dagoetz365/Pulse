"""
SQLAlchemy ORM model for the ``labs`` table.

Lab results track ordered medical tests for a patient through a
status lifecycle: ``ordered`` → ``in_progress`` → ``completed``.

Fields include the test name, ordered date, current status, optional
result text, result date, and free-text notes. Each lab belongs to
one patient and is cascade-deleted when the patient is removed.
"""

import uuid

from sqlalchemy import Column, DateTime, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class Lab(Base):
    __tablename__ = "labs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id = Column(
        UUID(as_uuid=True),
        ForeignKey("patients.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    test_name = Column(String(255), nullable=False)
    ordered_date = Column(DateTime(timezone=True), server_default=func.now())
    status = Column(String(20), nullable=False, default="ordered")
    result = Column(Text)
    result_date = Column(DateTime(timezone=True))
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    patient = relationship("Patient", back_populates="labs")
