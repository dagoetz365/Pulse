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
}

export type PatientUpdate = Partial<PatientCreate>;

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}
