import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PatientForm } from "@/components/patients/PatientForm";
import { useCreatePatient } from "@/hooks/usePatientMutations";
import type { PatientCreate } from "@/types/patient";

export function PatientCreatePage() {
  const navigate = useNavigate();
  const { mutate: createPatient, isPending } = useCreatePatient();

  function handleSubmit(data: PatientCreate) {
    createPatient(data);
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/patients")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="font-display text-xl font-semibold text-foreground">New Patient</h1>
          <p className="text-sm text-muted-foreground">Add a new patient to the system</p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Patient Details</CardTitle>
        </CardHeader>
        <CardContent>
          <PatientForm
            onSubmit={handleSubmit}
            isSubmitting={isPending}
            submitLabel="Create patient"
          />
        </CardContent>
      </Card>
    </div>
  );
}
