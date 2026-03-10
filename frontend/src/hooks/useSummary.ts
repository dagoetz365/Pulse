import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";

export function useSummary(patientId: string) {
  return useQuery({
    queryKey: queryKeys.summary.get(patientId),
    queryFn: async () => {
      const { data } = await api.get<{ summary: string }>(`/patients/${patientId}/summary`);
      return data.summary;
    },
    enabled: false,           // Only fires on manual refetch()
    staleTime: 1000 * 60 * 10, // Cache for 10 minutes
    retry: false,
  });
}
