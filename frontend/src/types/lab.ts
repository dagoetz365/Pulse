export type LabStatus = "ordered" | "in_progress" | "completed";

export interface Lab {
  id: string;
  patient_id: string;
  test_name: string;
  ordered_date: string;
  status: LabStatus;
  result: string | null;
  result_date: string | null;
  notes: string | null;
  created_at: string;
}

export interface LabCreate {
  test_name: string;
  ordered_date?: string;
  status?: LabStatus;
  result?: string | null;
  result_date?: string | null;
  notes?: string | null;
}

export interface LabUpdate {
  test_name?: string;
  status?: LabStatus;
  result?: string | null;
  result_date?: string | null;
  notes?: string | null;
}
