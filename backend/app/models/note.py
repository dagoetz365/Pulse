"""
SQLAlchemy ORM model for the ``notes`` table.

Clinical notes are free-text entries attached to a patient, used by
clinicians to document visits, observations, and care plans.

Each note belongs to exactly one patient via ``patient_id`` and is
automatically deleted when the parent patient is removed (CASCADE).
Notes are ordered by ``timestamp`` descending in the patient relationship.
"""

import uuid

from sqlalchemy import Column, DateTime, ForeignKey, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class Note(Base):
    __tablename__ = "notes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id = Column(
        UUID(as_uuid=True),
        ForeignKey("patients.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    content = Column(Text, nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    patient = relationship("Patient", back_populates="notes")
