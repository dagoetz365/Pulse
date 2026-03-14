/**
 * Clinical notes list for a patient.
 *
 * Renders the `AddNoteForm` at the top followed by a chronological list
 * of `NoteCard` components. Shows skeleton loaders while fetching and an
 * `EmptyState` when the patient has no notes.
 */

import { FileText } from "lucide-react";
import { NoteCard } from "./NoteCard";
import { AddNoteForm } from "./AddNoteForm";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { useNotes } from "@/hooks/useNotes";

interface NoteListProps {
  patientId: string;
}

export function NoteList({ patientId }: NoteListProps) {
  const { data: notes, isLoading } = useNotes(patientId);

  return (
    <div className="space-y-4">
      <AddNoteForm patientId={patientId} />

      <div className="mt-2">
        {isLoading ? (
          <div className="space-y-4 py-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-3 py-3 border-b border-border">
                <Skeleton className="mt-1 h-2 w-2 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : notes && notes.length > 0 ? (
          <div>
            {notes.map((note) => (
              <NoteCard key={note.id} note={note} patientId={patientId} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<FileText className="h-5 w-5" />}
            title="No notes yet"
            description="Add a clinical note above to get started."
          />
        )}
      </div>
    </div>
  );
}
