/**
 * TanStack Query mutation hooks for patient create, update, and delete.
 *
 * Each hook handles:
 * - Calling the appropriate API endpoint
 * - Invalidating related query caches so lists and detail views refresh
 * - Showing success/error toast notifications
 * - Navigating to the appropriate page after success (detail page for
 *   create/update, patient list for delete)
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import type { PatientCreate, PatientUpdate } from "@/types/patient";
import { useToast } from "@/components/ui/use-toast";

export function useCreatePatient() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (data: PatientCreate) => api.post("/patients", data).then((r) => r.data),
    onSuccess: (patient) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.patients.all });
      toast({ title: "Patient created", description: `${patient.full_name} has been added.` });
      navigate(`/patients/${patient.id}`);
    },
    onError: (err: Error) =>
      toast({ title: "Error", description: err.message, variant: "destructive" }),
  });
}

export function useUpdatePatient(id: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (data: PatientUpdate) => api.put(`/patients/${id}`, data).then((r) => r.data),
    onSuccess: (patient) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.patients.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.patients.detail(id) });
      toast({ title: "Patient updated", description: `${patient.full_name} has been updated.` });
      navigate(`/patients/${id}`);
    },
    onError: (err: Error) =>
      toast({ title: "Error", description: err.message, variant: "destructive" }),
  });
}

export function useDeletePatient() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (id: string) => api.delete(`/patients/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.patients.all });
      toast({ title: "Patient deleted" });
      navigate("/patients");
    },
    onError: (err: Error) =>
      toast({ title: "Error", description: err.message, variant: "destructive" }),
  });
}
