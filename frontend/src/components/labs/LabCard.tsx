/**
 * Individual lab result card with status badge, results, and actions.
 *
 * Displays test name, color-coded status badge (ordered/in progress/completed),
 * ordered and result dates, result text, and optional notes. Hover reveals
 * action buttons: update (if not completed) and delete with confirmation.
 */

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { formatDate, formatDateTime } from "@/lib/utils";
import { useDeleteLab } from "@/hooks/useLabMutations";
import { UpdateLabDialog } from "./UpdateLabDialog";
import type { Lab } from "@/types/lab";

const STATUS_STYLES: Record<string, string> = {
  ordered: "bg-blue-100 text-blue-700 border-blue-200",
  in_progress: "bg-amber-100 text-amber-700 border-amber-200",
  completed: "bg-green-100 text-green-700 border-green-200",
};

const STATUS_LABELS: Record<string, string> = {
  ordered: "Ordered",
  in_progress: "In Progress",
  completed: "Completed",
};

interface LabCardProps {
  lab: Lab;
  patientId: string;
}

export function LabCard({ lab, patientId }: LabCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { mutate: deleteLab, isPending } = useDeleteLab(patientId);

  return (
    <div className="group relative border border-border rounded-lg p-4 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm">{lab.test_name}</span>
            <Badge
              variant="outline"
              className={`text-[10px] px-1.5 py-0 ${STATUS_STYLES[lab.status] ?? ""}`}
            >
              {STATUS_LABELS[lab.status] ?? lab.status}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Ordered {formatDate(lab.ordered_date)}
            {lab.result_date && ` · Resulted ${formatDate(lab.result_date)}`}
          </p>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {lab.status !== "completed" && (
            <UpdateLabDialog lab={lab} patientId={patientId} />
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
            onClick={() => setConfirmDelete(true)}
            aria-label="Delete lab"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {lab.result && (
        <div className="bg-muted/50 rounded-md p-2.5">
          <p className="text-xs font-medium text-muted-foreground mb-1">Result</p>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{lab.result}</p>
        </div>
      )}

      {lab.notes && (
        <p className="text-xs text-muted-foreground italic">{lab.notes}</p>
      )}

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete lab</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this lab order? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteLab(lab.id, { onSuccess: () => setConfirmDelete(false) })}
              disabled={isPending}
            >
              {isPending ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
