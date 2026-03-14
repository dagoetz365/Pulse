/**
 * TanStack Query hook for fetching an AI-generated clinical summary.
 *
 * The query is **disabled by default** (`enabled: false`) so it only fires
 * when the user explicitly clicks "Generate Summary" (via `refetch()`).
 * Results are cached for 10 minutes to avoid redundant API calls.
 * Retries are disabled since summary generation failures are typically
 * non-transient (e.g. missing API key).
 */

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";

interface SummaryResponse {
  summary: string;
  patient_id: string;
  generated_at: string;
}

export function useSummary(patientId: string) {
  return useQuery({
    queryKey: queryKeys.summary.get(patientId),
    queryFn: async () => {
      const { data } = await api.get<SummaryResponse>(`/patients/${patientId}/summary`);
      return data;
    },
    enabled: false,           // Only fires on manual refetch()
    staleTime: 1000 * 60 * 10, // Cache for 10 minutes
    retry: false,
  });
}
