import { formatDateTime } from "@/lib/utils";
import { DeleteNoteButton } from "./DeleteNoteButton";
import type { Note } from "@/types/note";

interface NoteCardProps {
  note: Note;
  patientId: string;
}

export function NoteCard({ note, patientId }: NoteCardProps) {
  return (
    <div className="group relative flex gap-3 py-4 border-b border-border last:border-0">
      {/* Timeline dot */}
      <div className="mt-1 shrink-0 w-2 h-2 rounded-full bg-primary/50 ring-4 ring-primary/10" />

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <time className="text-xs text-muted-foreground font-medium">
            {formatDateTime(note.timestamp)}
          </time>
          <DeleteNoteButton patientId={patientId} noteId={note.id} />
        </div>
        <p className="mt-1.5 text-sm text-foreground leading-relaxed whitespace-pre-wrap">
          {note.content}
        </p>
      </div>
    </div>
  );
}
