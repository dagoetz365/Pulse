import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import type { PaginatedResponse, Patient } from "@/types/patient";

interface PatientListParams {
  page?: number;
  page_size?: number;
  search?: string;
  sort_by?: string;
  sort_order?: string;
  status?: string;
}

export function usePatients(params: PatientListParams) {
  return useQuery({
    queryKey: queryKeys.patients.list(params),
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Patient>>("/patients", {
        params: {
          ...params,
          status: params.status || undefined, // omit empty string
        },
      });
      return data;
    },
    placeholderData: (prev) => prev, // keep previous data while fetching next page
  });
}
