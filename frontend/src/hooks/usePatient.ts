/**
 * TanStack Query hook for fetching a single patient by UUID.
 *
 * The query is disabled when `id` is falsy, preventing unnecessary
 * API calls before a patient ID is available (e.g. during route transitions).
 */

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import type { Patient } from "@/types/patient";

export function usePatient(id: string) {
  return useQuery({
    queryKey: queryKeys.patients.detail(id),
    queryFn: async () => {
      const { data } = await api.get<Patient>(`/patients/${id}`);
      return data;
    },
    enabled: !!id,
  });
}
