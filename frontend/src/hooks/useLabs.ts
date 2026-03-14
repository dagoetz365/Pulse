import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import type { Lab } from "@/types/lab";

export function useLabs(patientId: string) {
  return useQuery({
    queryKey: queryKeys.labs.list(patientId),
    queryFn: async () => {
      const { data } = await api.get<Lab[]>(`/patients/${patientId}/labs`);
      return data;
    },
    enabled: !!patientId,
  });
}
