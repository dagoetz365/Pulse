"""
Seed script — called automatically from start.sh on container startup.
Only seeds if the patients table is empty (idempotent).
"""
import os
import sys
from datetime import date, datetime, timedelta, timezone
import random

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app.database import SessionLocal
from app.models.note import Note
from app.models.patient import Patient

PATIENTS = [
    {
        "first_name": "James", "last_name": "Miller",
        "date_of_birth": date(1958, 3, 14), "email": "james.miller@gmail.com",
        "phone": "555-0101", "address": "142 Oak Street, Boston, MA 02108",
        "blood_type": "O+", "allergies": ["Penicillin"],
        "conditions": ["Hypertension", "Type 2 Diabetes"], "status": "active",
        "last_visit": date(2025, 2, 10),
    },
    {
        "first_name": "Sarah", "last_name": "Chen",
        "date_of_birth": date(1985, 8, 22), "email": "sarah.chen@yahoo.com",
        "phone": "555-0102", "address": "89 Maple Ave, Cambridge, MA 02139",
        "blood_type": "A+", "allergies": [],
        "conditions": ["Asthma"], "status": "active",
        "last_visit": date(2025, 1, 28),
    },
    {
        "first_name": "Robert", "last_name": "Johnson",
        "date_of_birth": date(1942, 11, 5), "email": "r.johnson@outlook.com",
        "phone": "555-0103", "address": "301 Pine Road, Brookline, MA 02445",
        "blood_type": "B-", "allergies": ["Sulfa", "Aspirin"],
        "conditions": ["COPD", "Heart Failure", "Atrial Fibrillation"], "status": "critical",
        "last_visit": date(2025, 3, 1),
    },
    {
        "first_name": "Maria", "last_name": "Garcia",
        "date_of_birth": date(1973, 6, 17), "email": "maria.garcia@gmail.com",
        "phone": "555-0104", "address": "55 Elm Street, Somerville, MA 02143",
        "blood_type": "AB+", "allergies": ["Latex"],
        "conditions": ["Rheumatoid Arthritis"], "status": "active",
        "last_visit": date(2025, 2, 20),
    },
    {
        "first_name": "David", "last_name": "Kim",
        "date_of_birth": date(1990, 4, 3), "email": "david.kim@icloud.com",
        "phone": "555-0105", "address": "17 Cedar Lane, Newton, MA 02458",
        "blood_type": "O-", "allergies": [],
        "conditions": [], "status": "active",
        "last_visit": date(2025, 1, 15),
    },
    {
        "first_name": "Patricia", "last_name": "Williams",
        "date_of_birth": date(1965, 9, 30), "email": "p.williams@yahoo.com",
        "phone": "555-0106", "address": "228 Birch Blvd, Waltham, MA 02451",
        "blood_type": "A-", "allergies": ["Codeine", "NSAIDs"],
        "conditions": ["Fibromyalgia", "Depression"], "status": "inactive",
        "last_visit": date(2024, 11, 5),
    },
    {
        "first_name": "Michael", "last_name": "Thompson",
        "date_of_birth": date(1978, 12, 8), "email": "m.thompson@gmail.com",
        "phone": "555-0107", "address": "400 Willow Way, Medford, MA 02155",
        "blood_type": "B+", "allergies": [],
        "conditions": ["Hypertension", "Hyperlipidemia"], "status": "active",
        "last_visit": date(2025, 2, 14),
    },
    {
        "first_name": "Linda", "last_name": "Martinez",
        "date_of_birth": date(1955, 7, 21), "email": "linda.martinez@outlook.com",
        "phone": "555-0108", "address": "75 Spruce Street, Arlington, MA 02476",
        "blood_type": "O+", "allergies": ["Penicillin", "Erythromycin"],
        "conditions": ["Osteoporosis", "Type 2 Diabetes", "Hypothyroidism"], "status": "active",
        "last_visit": date(2025, 2, 28),
    },
    {
        "first_name": "Christopher", "last_name": "Davis",
        "date_of_birth": date(1996, 2, 14), "email": "c.davis@gmail.com",
        "phone": "555-0109", "address": "12 Ash Court, Malden, MA 02148",
        "blood_type": "A+", "allergies": [],
        "conditions": ["Anxiety Disorder"], "status": "active",
        "last_visit": date(2025, 1, 20),
    },
    {
        "first_name": "Barbara", "last_name": "Anderson",
        "date_of_birth": date(1948, 5, 10), "email": "b.anderson@yahoo.com",
        "phone": "555-0110", "address": "190 Chestnut Drive, Quincy, MA 02169",
        "blood_type": "AB-", "allergies": ["Morphine"],
        "conditions": ["Chronic Kidney Disease", "Hypertension", "Anemia"], "status": "critical",
        "last_visit": date(2025, 3, 5),
    },
    {
        "first_name": "Kevin", "last_name": "Wilson",
        "date_of_birth": date(1982, 10, 27), "email": "k.wilson@icloud.com",
        "phone": "555-0111", "address": "33 Hickory Hill, Lexington, MA 02420",
        "blood_type": "O+", "allergies": [],
        "conditions": ["Crohn's Disease"], "status": "active",
        "last_visit": date(2025, 2, 7),
    },
    {
        "first_name": "Jennifer", "last_name": "Taylor",
        "date_of_birth": date(1969, 1, 19), "email": "j.taylor@gmail.com",
        "phone": "555-0112", "address": "61 Walnut Street, Belmont, MA 02478",
        "blood_type": "B+", "allergies": ["Sulfonamides"],
        "conditions": ["Lupus", "Raynaud's Phenomenon"], "status": "inactive",
        "last_visit": date(2024, 10, 12),
    },
    {
        "first_name": "Daniel", "last_name": "Brown",
        "date_of_birth": date(2001, 8, 6), "email": "d.brown@outlook.com",
        "phone": "555-0113", "address": "847 Poplar Drive, Watertown, MA 02472",
        "blood_type": "A-", "allergies": ["Tree nuts"],
        "conditions": ["Epilepsy"], "status": "active",
        "last_visit": date(2025, 2, 3),
    },
    {
        "first_name": "Nancy", "last_name": "Jones",
        "date_of_birth": date(1961, 4, 25), "email": "n.jones@yahoo.com",
        "phone": "555-0114", "address": "9 Sycamore Lane, Needham, MA 02492",
        "blood_type": "O-", "allergies": ["Ibuprofen"],
        "conditions": ["Migraine", "Hypertension"], "status": "active",
        "last_visit": date(2025, 1, 30),
    },
    {
        "first_name": "Thomas", "last_name": "White",
        "date_of_birth": date(1975, 3, 18), "email": "t.white@gmail.com",
        "phone": "555-0115", "address": "256 Magnolia Ave, Framingham, MA 01701",
        "blood_type": "AB+", "allergies": [],
        "conditions": ["Sleep Apnea", "Obesity"], "status": "active",
        "last_visit": date(2025, 2, 18),
    },
    {
        "first_name": "Sandra", "last_name": "Harris",
        "date_of_birth": date(1940, 12, 3), "email": "s.harris@icloud.com",
        "phone": "555-0116", "address": "18 Magnolia Court, Dedham, MA 02026",
        "blood_type": "A+", "allergies": ["Penicillin", "Tetracycline"],
        "conditions": ["Alzheimer's Disease", "Hypertension", "Osteoarthritis"], "status": "critical",
        "last_visit": date(2025, 3, 8),
    },
    {
        "first_name": "Ryan", "last_name": "Clark",
        "date_of_birth": date(1993, 7, 12), "email": "r.clark@outlook.com",
        "phone": "555-0117", "address": "103 Fir Street, Natick, MA 01760",
        "blood_type": "B-", "allergies": [],
        "conditions": [], "status": "inactive",
        "last_visit": date(2024, 9, 22),
    },
    {
        "first_name": "Emily", "last_name": "Lewis",
        "date_of_birth": date(1988, 11, 29), "email": "e.lewis@gmail.com",
        "phone": "555-0118", "address": "74 Redwood Road, Norwood, MA 02062",
        "blood_type": "O+", "allergies": ["Shellfish"],
        "conditions": ["PCOS", "Thyroid Nodules"], "status": "active",
        "last_visit": date(2025, 2, 25),
    },
]

NOTE_TEMPLATES = [
    "Patient reports improved symptoms since last visit. Medication compliance appears good.",
    "Follow-up visit completed. Reviewed lab results and adjusted medication dosage.",
    "Patient experiencing mild side effects from current medication. Monitoring closely.",
    "Blood pressure readings within target range. Continue current treatment plan.",
    "HbA1c levels improved from last quarter. Praised patient for dietary changes.",
    "Referred to specialist for further evaluation. Appointment scheduled next month.",
    "Patient reports increased fatigue. Ordered additional bloodwork for review.",
    "Reviewed imaging results with patient. No significant changes from baseline.",
    "Physical therapy referral initiated. Patient educated on home exercise program.",
    "Discussed smoking cessation resources. Patient expressed willingness to try.",
    "Medication reconciliation completed. Removed duplicate prescription.",
    "Patient reports chest discomfort on exertion. EKG ordered, results pending.",
    "Nutritional counseling provided. Dietary plan updated to reduce sodium intake.",
    "Flu vaccination administered. No adverse reactions observed.",
    "Patient anxious about upcoming procedure. Discussed risks and benefits thoroughly.",
]


def seed_if_empty():
    db = SessionLocal()
    try:
        count = db.query(Patient).count()
        if count > 0:
            print(f"Database already has {count} patients. Skipping seed.")
            return

        print("Seeding database with sample patients and notes...")
        for p_data in PATIENTS:
            patient = Patient(**p_data)
            db.add(patient)
            db.flush()  # get patient.id

            for _ in range(random.randint(2, 5)):
                days_ago = random.randint(1, 365)
                note = Note(
                    patient_id=patient.id,
                    content=random.choice(NOTE_TEMPLATES),
                    timestamp=datetime.now(timezone.utc) - timedelta(days=days_ago),
                )
                db.add(note)

        db.commit()
        print(f"✅ Seeded {len(PATIENTS)} patients with clinical notes.")
    except Exception as e:
        db.rollback()
        print(f"❌ Seed failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_if_empty()
