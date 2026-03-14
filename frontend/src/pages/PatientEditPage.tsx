/**
 * Patient edit page.
 *
 * Fetches the existing patient via `usePatient` and pre-fills the shared
 * `PatientForm` component with current values. On submission, calls
 * `useUpdatePatient` which PUTs to the API, shows a success toast,
 * and navigates back to the patient's detail page.
 *
 * Shows a skeleton loader while the patient data is being fetched.
 */

import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PatientForm } from "@/components/patients/PatientForm";
import { usePatient } from "@/hooks/usePatient";
import { useUpdatePatient } from "@/hooks/usePatientMutations";
import type { PatientCreate } from "@/types/patient";

export function PatientEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: patient, isLoading } = usePatient(id!);
  const { mutate: updatePatient, isPending } = useUpdatePatient(id!);

  function handleSubmit(data: PatientCreate) {
    updatePatient(data);
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/patients/${id}`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          {isLoading ? (
            <Skeleton className="h-6 w-40" />
          ) : (
            <>
              <h1 className="font-display text-xl font-semibold text-foreground">
                Edit {patient?.full_name}
              </h1>
              <p className="text-sm text-muted-foreground">Update patient information</p>
            </>
          )}
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Patient Details</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <Skeleton className="h-3.5 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
          ) : patient ? (
            <PatientForm
              defaultValues={patient}
              onSubmit={handleSubmit}
              isSubmitting={isPending}
              submitLabel="Save changes"
            />
          ) : (
            <p className="text-sm text-muted-foreground">Patient not found.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
