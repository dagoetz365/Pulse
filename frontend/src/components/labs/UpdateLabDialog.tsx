import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ClipboardEdit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUpdateLab } from "@/hooks/useLabMutations";
import type { Lab } from "@/types/lab";

const updateSchema = z.object({
  status: z.enum(["ordered", "in_progress", "completed"]),
  result: z.string().optional(),
  result_date: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof updateSchema>;

interface UpdateLabDialogProps {
  lab: Lab;
  patientId: string;
}

export function UpdateLabDialog({ lab, patientId }: UpdateLabDialogProps) {
  const [open, setOpen] = useState(false);
  const { mutate: updateLab, isPending } = useUpdateLab(patientId);

  const form = useForm<FormValues>({
    resolver: zodResolver(updateSchema),
    defaultValues: {
      status: lab.status as "ordered" | "in_progress" | "completed",
      result: lab.result ?? "",
      result_date: "",
      notes: lab.notes ?? "",
    },
  });

  function onSubmit(values: FormValues) {
    const data: Record<string, unknown> = { status: values.status };
    if (values.result) data.result = values.result;
    if (values.result_date) data.result_date = new Date(values.result_date).toISOString();
    if (values.notes) data.notes = values.notes;

    updateLab(
      { labId: lab.id, data },
      { onSuccess: () => setOpen(false) },
    );
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-muted-foreground hover:text-primary"
        onClick={() => setOpen(true)}
        aria-label="Update lab"
      >
        <ClipboardEdit className="h-3.5 w-3.5" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update: {lab.test_name}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ordered">Ordered</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="result"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Result</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter lab results…"
                        className="min-h-[80px] resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="result_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Result Date</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Additional notes…"
                        className="min-h-[60px] resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Saving…" : "Save"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
