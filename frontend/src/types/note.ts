export interface Note {
  id: string;
  patient_id: string;
  content: string;
  timestamp: string;
  created_at: string;
}

export interface NoteCreate {
  content: string;
  timestamp?: string;
}
