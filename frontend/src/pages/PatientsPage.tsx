/**
 * Patients list page with search, filtering, sorting, and pagination.
 *
 * Reads filter state from the `usePatientStore` Zustand store and passes
 * it to `usePatients` for server-side filtering. Renders a `PatientTable`
 * with sortable columns and a `Pagination` component. Shows an `EmptyState`
 * when no patients match the current filters.
 */

import { useNavigate } from "react-router-dom";
import { Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { Pagination } from "@/components/common/Pagination";
import { PatientTable } from "@/components/patients/PatientTable";
import { PatientFilters } from "@/components/patients/PatientFilters";
import { usePatients } from "@/hooks/usePatients";
import { usePatientStore } from "@/store/patientStore";

export function PatientsPage() {
  const navigate = useNavigate();
  const { search, status, sortBy, sortOrder, page, setPage } = usePatientStore();

  const { data, isLoading, isPlaceholderData } = usePatients({
    page,
    page_size: 10,
    search: search || undefined,
    status: status || undefined,
    sort_by: sortBy,
    sort_order: sortOrder,
  });

  const patients = data?.items ?? [];
  const totalPages = data ? Math.ceil(data.total / data.page_size) : 1;

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Patients"
        subtitle={data ? `${data.total} patient${data.total !== 1 ? "s" : ""} total` : undefined}
        actions={
          <Button onClick={() => navigate("/patients/new")} className="gap-2">
            <Plus className="h-4 w-4" />
            New Patient
          </Button>
        }
      />

      <PatientFilters />

      {!isLoading && patients.length === 0 ? (
        <EmptyState
          icon={<Users className="h-5 w-5" />}
          title="No patients found"
          description={
            search || status
              ? "Try adjusting your search or filter."
              : "Get started by adding your first patient."
          }
          action={
            !search && !status ? (
              <Button onClick={() => navigate("/patients/new")} className="gap-2">
                <Plus className="h-4 w-4" />
                Add patient
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className={`space-y-4 transition-opacity ${isPlaceholderData ? "opacity-60" : ""}`}>
          <PatientTable patients={patients} isLoading={isLoading} />
          <Pagination
            page={page}
            totalPages={totalPages}
            totalItems={data?.total ?? 0}
            pageSize={data?.page_size ?? 10}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
}
