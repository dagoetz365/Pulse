import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useAddNote } from "@/hooks/useNoteMutations";

const noteSchema = z.object({
  content: z.string().min(1, "Note content is required"),
  timestamp: z.string().optional(),
});

type FormValues = z.infer<typeof noteSchema>;

interface AddNoteFormProps {
  patientId: string;
}

export function AddNoteForm({ patientId }: AddNoteFormProps) {
  const [showTimestamp, setShowTimestamp] = useState(false);
  const { mutate: addNote, isPending } = useAddNote(patientId);

  const form = useForm<FormValues>({
    resolver: zodResolver(noteSchema),
    defaultValues: { content: "", timestamp: "" },
  });

  function onSubmit(values: FormValues) {
    const payload: { content: string; timestamp?: string } = { content: values.content };
    if (values.timestamp) payload.timestamp = new Date(values.timestamp).toISOString();
    addNote(payload, {
      onSuccess: () => {
        form.reset();
        setShowTimestamp(false);
      },
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <div>
                  <Textarea
                    placeholder="Add a clinical note…"
                    className="min-h-[80px] resize-none"
                    {...field}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {showTimestamp && (
          <FormField
            control={form.control}
            name="timestamp"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Note timestamp (optional)</FormLabel>
                <FormControl>
                  <div><Input type="datetime-local" {...field} /></div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="flex items-center justify-between">
          <button
            type="button"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setShowTimestamp((v) => !v)}
          >
            {showTimestamp ? "Hide timestamp" : "Set custom timestamp"}
          </button>
          <Button type="submit" size="sm" disabled={isPending}>
            {isPending ? "Adding…" : "Add note"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
