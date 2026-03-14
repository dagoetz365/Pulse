/**
 * TypeScript interfaces for lab result data.
 *
 * - {@link Lab} — Full lab record as returned by the API.
 * - {@link LabCreate} — Payload for ordering a new lab test.
 * - {@link LabUpdate} — Partial payload for updating lab status/results.
 * - {@link LabStatus} — Union type of valid lab statuses:
 *   `"ordered"` | `"in_progress"` | `"completed"`.
 */

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
