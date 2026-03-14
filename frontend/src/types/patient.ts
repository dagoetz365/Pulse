/**
 * TypeScript interfaces for patient data.
 *
 * These types mirror the backend Pydantic schemas and are used throughout
 * the frontend for type-safe patient operations:
 * - {@link Patient} — Full patient record as returned by the API (includes
 *   computed `age` and `full_name` fields).
 * - {@link PatientCreate} — Payload for creating a new patient (required +
 *   optional fields).
 * - {@link PatientUpdate} — Partial payload for updating an existing patient.
 * - {@link PaginatedResponse} — Generic wrapper for paginated list endpoints.
 */

export type PatientStatus = "active" | "inactive" | "critical";
export type BloodType = "A+" | "A-" | "B+" | "B-" | "O+" | "O-" | "AB+" | "AB-";

export interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  date_of_birth: string;
  age: number;
  email: string;
  phone: string | null;
  address: string | null;
  blood_type: BloodType | null;
  allergies: string[];
  conditions: string[];
  status: PatientStatus;
  last_visit: string | null;
  insurance_provider: string | null;
  insurance_policy_number: string | null;
  insurance_group_number: string | null;
  medical_history: string | null;
  family_history: string[];
  consent_forms: string[];
  created_at: string;
  updated_at: string;
}

export interface PatientCreate {
  first_name: string;
  last_name: string;
  date_of_birth: string;
  email: string;
  phone?: string | null;
  address?: string | null;
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

export type PatientUpdate = Partial<PatientCreate>;

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}
