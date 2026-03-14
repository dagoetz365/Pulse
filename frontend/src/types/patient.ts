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
