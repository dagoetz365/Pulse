from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.lab import Lab
from app.schemas.lab import LabCreate, LabUpdate


class LabService:
    def __init__(self, db: Session):
        self.db = db

    def get_labs(self, patient_id: UUID) -> list[Lab]:
        return (
            self.db.query(Lab)
            .filter(Lab.patient_id == patient_id)
            .order_by(Lab.ordered_date.desc())
            .all()
        )

    def add_lab(self, patient_id: UUID, data: LabCreate) -> Lab:
        lab = Lab(
            patient_id=patient_id,
            test_name=data.test_name,
            ordered_date=data.ordered_date or datetime.now(timezone.utc),
            status=data.status,
            result=data.result,
            result_date=data.result_date,
            notes=data.notes,
        )
        self.db.add(lab)
        self.db.commit()
        self.db.refresh(lab)
        return lab

    def update_lab(self, patient_id: UUID, lab_id: UUID, data: LabUpdate) -> Lab | None:
        lab = (
            self.db.query(Lab)
            .filter(Lab.id == lab_id, Lab.patient_id == patient_id)
            .first()
        )
        if not lab:
            return None
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(lab, field, value)
        self.db.commit()
        self.db.refresh(lab)
        return lab

    def delete_lab(self, patient_id: UUID, lab_id: UUID) -> bool:
        lab = (
            self.db.query(Lab)
            .filter(Lab.id == lab_id, Lab.patient_id == patient_id)
            .first()
        )
        if not lab:
            return False
        self.db.delete(lab)
        self.db.commit()
        return True
