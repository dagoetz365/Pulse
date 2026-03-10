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
import { useDeleteNote } from "@/hooks/useNoteMutations";

interface DeleteNoteButtonProps {
  patientId: string;
  noteId: string;
}

export function DeleteNoteButton({ patientId, noteId }: DeleteNoteButtonProps) {
  const [open, setOpen] = useState(false);
  const { mutate: deleteNote, isPending } = useDeleteNote(patientId);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={() => setOpen(true)}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete note</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this note? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteNote(noteId, { onSuccess: () => setOpen(false) })}
              disabled={isPending}
            >
              {isPending ? "Deleting…" : "Delete note"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
