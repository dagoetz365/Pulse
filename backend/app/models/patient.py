"""
SQLAlchemy ORM model for the ``patients`` table.

The Patient model is the central entity in the system and contains:
- **Personal info**: name, date of birth, email (unique), phone, address
- **Medical data**: blood type, allergies, conditions, status, last visit
- **Insurance**: provider, policy number, group number
- **History**: free-text medical history, family history list
- **Consent**: list of signed consent form identifiers

Relationships:
    notes: One-to-many with :class:`Note` (cascade delete, ordered by timestamp desc)
    labs: One-to-many with :class:`Lab` (cascade delete, ordered by ordered_date desc)
"""

import uuid
from datetime import datetime

from sqlalchemy import ARRAY, Column, Date, DateTime, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class Patient(Base):
    __tablename__ = "patients"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    date_of_birth = Column(Date, nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    phone = Column(String(30))
    address = Column(String(500))

    # Medical
    blood_type = Column(String(5))  # A+, B-, O+, AB-, etc.
    allergies = Column(ARRAY(String), server_default="{}")
    conditions = Column(ARRAY(String), server_default="{}")
    status = Column(String(20), nullable=False, default="active")  # active/inactive/critical
    last_visit = Column(Date)

    # Insurance
    insurance_provider = Column(String(255))
    insurance_policy_number = Column(String(100))
    insurance_group_number = Column(String(100))

    # History
    medical_history = Column(Text)
    family_history = Column(ARRAY(String), server_default="{}")

    # Consent
    consent_forms = Column(ARRAY(String), server_default="{}")

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    notes = relationship("Note", back_populates="patient", cascade="all, delete-orphan", order_by="Note.timestamp.desc()")
    labs = relationship("Lab", back_populates="patient", cascade="all, delete-orphan", order_by="Lab.ordered_date.desc()")
