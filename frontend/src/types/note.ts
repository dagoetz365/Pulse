/**
 * TypeScript interfaces for clinical note data.
 *
 * - {@link Note} — Full note record as returned by the API.
 * - {@link NoteCreate} — Payload for adding a new note. The `timestamp`
 *   field is optional and defaults to the current server time if omitted.
 */

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
