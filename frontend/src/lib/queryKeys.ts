/**
 * TanStack Query key factory.
 *
 * Centralises all cache keys used by TanStack Query (React Query) so that
 * mutations can precisely invalidate related queries after data changes.
 * Each domain (patients, notes, labs, summary) exposes typed key builders
 * that produce `readonly` tuple keys for cache identity.
 */
export const queryKeys = {
  patients: {
    all: ["patients"] as const,
    list: (params: object) => ["patients", "list", params] as const,
    detail: (id: string) => ["patients", "detail", id] as const,
  },
  notes: {
    list: (patientId: string) => ["notes", patientId] as const,
  },
  labs: {
    list: (patientId: string) => ["labs", patientId] as const,
  },
  summary: {
    get: (patientId: string) => ["summary", patientId] as const,
  },
};
