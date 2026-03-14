/**
 * TanStack Query mutation hooks for clinical note create and delete.
 *
 * - `useAddNote(patientId)` — Creates a new note and invalidates the notes list cache.
 * - `useDeleteNote(patientId)` — Deletes a note by ID and invalidates the notes list cache.
 *
 * Both hooks show toast notifications on success and error.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import type { NoteCreate } from "@/types/note";
import { useToast } from "@/components/ui/use-toast";

export function useAddNote(patientId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: NoteCreate) =>
      api.post(`/patients/${patientId}/notes`, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notes.list(patientId) });
      toast({ title: "Note added" });
    },
    onError: (err: Error) =>
      toast({ title: "Error", description: err.message, variant: "destructive" }),
  });
}

export function useDeleteNote(patientId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (noteId: string) => api.delete(`/patients/${patientId}/notes/${noteId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notes.list(patientId) });
      toast({ title: "Note deleted" });
    },
    onError: (err: Error) =>
      toast({ title: "Error", description: err.message, variant: "destructive" }),
  });
}
