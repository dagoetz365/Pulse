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
