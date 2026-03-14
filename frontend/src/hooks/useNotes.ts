import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import type { Note } from "@/types/note";

export function useNotes(patientId: string) {
  return useQuery({
    queryKey: queryKeys.notes.list(patientId),
    queryFn: async () => {
      const { data } = await api.get<Note[]>(`/patients/${patientId}/notes`);
      return data;
    },
    enabled: !!patientId,
  });
}
