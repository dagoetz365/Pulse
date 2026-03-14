/**
 * Confirmation dialog for deleting a patient.
 *
 * Warns the user that deletion will also remove all associated notes and
 * labs and cannot be undone. Accepts an optional custom `trigger` element;
 * defaults to a trash icon button. Uses `useDeletePatient` mutation which
 * navigates to the patients list on success.
 */

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useDeletePatient } from "@/hooks/usePatientMutations";
import type { Patient } from "@/types/patient";

interface DeletePatientDialogProps {
  patient: Patient;
  trigger?: React.ReactNode;
}

export function DeletePatientDialog({ patient, trigger }: DeletePatientDialogProps) {
  const [open, setOpen] = useState(false);
  const { mutate: deletePatient, isPending } = useDeletePatient();

  function handleDelete() {
    deletePatient(patient.id, { onSuccess: () => setOpen(false) });
  }

  return (
    <>
      {trigger ? (
        <button type="button" onClick={() => setOpen(true)} className="cursor-pointer">
          {trigger}
        </button>
      ) : (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive"
          onClick={() => setOpen(true)}
          aria-label={`Delete ${patient.full_name}`}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete patient</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete{" "}
            <span className="font-medium text-foreground">{patient.full_name}</span>? This will
            also delete all their notes. This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
              {isPending ? "Deleting…" : "Delete patient"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
