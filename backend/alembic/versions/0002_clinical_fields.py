"""add clinical fields to patients and labs table

Revision ID: 0002
Revises: 0001
Create Date: 2026-03-11
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0002"
down_revision: Union[str, None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Insurance fields
    op.add_column("patients", sa.Column("insurance_provider", sa.String(255), nullable=True))
    op.add_column("patients", sa.Column("insurance_policy_number", sa.String(100), nullable=True))
    op.add_column("patients", sa.Column("insurance_group_number", sa.String(100), nullable=True))

    # Medical / family history
    op.add_column("patients", sa.Column("medical_history", sa.Text(), nullable=True))
    op.add_column(
        "patients",
        sa.Column("family_history", postgresql.ARRAY(sa.String()), server_default="{}"),
    )

    # Consent forms
    op.add_column(
        "patients",
        sa.Column("consent_forms", postgresql.ARRAY(sa.String()), server_default="{}"),
    )

    # Labs table
    op.create_table(
        "labs",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("patient_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("test_name", sa.String(255), nullable=False),
        sa.Column(
            "ordered_date",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
        ),
        sa.Column("status", sa.String(20), nullable=False, server_default="ordered"),
        sa.Column("result", sa.Text(), nullable=True),
        sa.Column("result_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
        ),
        sa.ForeignKeyConstraint(["patient_id"], ["patients.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_labs_patient_id", "labs", ["patient_id"])


def downgrade() -> None:
    op.drop_index("ix_labs_patient_id", table_name="labs")
    op.drop_table("labs")
    op.drop_column("patients", "consent_forms")
    op.drop_column("patients", "family_history")
    op.drop_column("patients", "medical_history")
    op.drop_column("patients", "insurance_group_number")
    op.drop_column("patients", "insurance_policy_number")
    op.drop_column("patients", "insurance_provider")
