/**
 * TanStack Query mutation hooks for lab result create, update, and delete.
 *
 * - `useAddLab(patientId)` — Orders a new lab test.
 * - `useUpdateLab(patientId)` — Updates lab status/results (e.g. marking completed).
 * - `useDeleteLab(patientId)` — Deletes a lab result.
 *
 * All hooks invalidate the labs list cache on success and show toast notifications.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import type { LabCreate, LabUpdate } from "@/types/lab";
import { useToast } from "@/components/ui/use-toast";

export function useAddLab(patientId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: LabCreate) =>
      api.post(`/patients/${patientId}/labs`, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.labs.list(patientId) });
      toast({ title: "Lab ordered" });
    },
    onError: (err: Error) =>
      toast({ title: "Error", description: err.message, variant: "destructive" }),
  });
}

export function useUpdateLab(patientId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ labId, data }: { labId: string; data: LabUpdate }) =>
      api.put(`/patients/${patientId}/labs/${labId}`, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.labs.list(patientId) });
      toast({ title: "Lab updated" });
    },
    onError: (err: Error) =>
      toast({ title: "Error", description: err.message, variant: "destructive" }),
  });
}

export function useDeleteLab(patientId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (labId: string) =>
      api.delete(`/patients/${patientId}/labs/${labId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.labs.list(patientId) });
      toast({ title: "Lab deleted" });
    },
    onError: (err: Error) =>
      toast({ title: "Error", description: err.message, variant: "destructive" }),
  });
}
