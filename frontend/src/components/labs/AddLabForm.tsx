import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { useAddLab } from "@/hooks/useLabMutations";

const labSchema = z.object({
  test_name: z.string().min(1, "Test name is required"),
});

type FormValues = z.infer<typeof labSchema>;

interface AddLabFormProps {
  patientId: string;
}

export function AddLabForm({ patientId }: AddLabFormProps) {
  const { mutate: addLab, isPending } = useAddLab(patientId);

  const form = useForm<FormValues>({
    resolver: zodResolver(labSchema),
    defaultValues: { test_name: "" },
  });

  function onSubmit(values: FormValues) {
    addLab(
      { test_name: values.test_name },
      { onSuccess: () => form.reset() },
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex gap-2">
        <FormField
          control={form.control}
          name="test_name"
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormControl>
                <Input placeholder="Order a lab test (e.g., CBC, Lipid Panel)…" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Ordering…" : "Order"}
        </Button>
      </form>
    </Form>
  );
}
