/**
 * Lab results list for a patient.
 *
 * Renders the `AddLabForm` at the top followed by a list of `LabCard`
 * components. Shows skeleton loaders while fetching and an `EmptyState`
 * when the patient has no lab orders.
 */

import { FlaskConical } from "lucide-react";
import { LabCard } from "./LabCard";
import { AddLabForm } from "./AddLabForm";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { useLabs } from "@/hooks/useLabs";

interface LabListProps {
  patientId: string;
}

export function LabList({ patientId }: LabListProps) {
  const { data: labs, isLoading } = useLabs(patientId);

  return (
    <div className="space-y-4">
      <AddLabForm patientId={patientId} />

      <div className="mt-2">
        {isLoading ? (
          <div className="space-y-3 py-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="border border-border rounded-lg p-4 space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-12 w-full" />
              </div>
            ))}
          </div>
        ) : labs && labs.length > 0 ? (
          <div className="space-y-3">
            {labs.map((lab) => (
              <LabCard key={lab.id} lab={lab} patientId={patientId} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<FlaskConical className="h-5 w-5" />}
            title="No labs ordered"
            description="Order a lab test above to get started."
          />
        )}
      </div>
    </div>
  );
}
