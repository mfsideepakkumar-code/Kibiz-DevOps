"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/kit/submit-button";
import { statusLabel } from "@/components/kit/status-variant";
import { PROJECT_STATUSES } from "@/lib/admin-enums";

import { saveSubProject } from "../actions";
import type { SubProjectRow } from "../types";

// C-11 hard block: only the fields in schema.md. Do not add relations/fields.
const schema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  status: z.enum(PROJECT_STATUSES),
  sow_hours: z.string().trim(),
  start_date: z.string().trim(),
  end_date: z.string().trim(),
  notes: z.string().trim(),
});

type FormValues = z.infer<typeof schema>;

export function SubProjectForm({
  projectId,
  subProject,
  trigger,
}: {
  projectId: string;
  subProject?: SubProjectRow;
  trigger: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const isEdit = !!subProject;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: subProject?.name ?? "",
      status: (subProject?.status as FormValues["status"]) ?? "active",
      sow_hours: subProject?.sow_hours?.toString() ?? "",
      start_date: subProject?.start_date ?? "",
      end_date: subProject?.end_date ?? "",
      notes: subProject?.notes ?? "",
    },
  });

  async function onSubmit(values: FormValues) {
    const res = await saveSubProject({
      id: subProject?.id,
      project_id: projectId,
      name: values.name,
      status: values.status,
      sow_hours: values.sow_hours,
      start_date: values.start_date,
      end_date: values.end_date,
      notes: values.notes,
    });
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success(isEdit ? "Sub-project updated" : "Sub-project created");
    setOpen(false);
    form.reset(values);
    router.refresh();
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {isEdit ? "Edit sub-project" : "New sub-project"}
          </SheetTitle>
          <SheetDescription>
            Optional SOW level under the project (ADR-017).
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 px-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PROJECT_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {statusLabel(s)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="sow_hours"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>SOW hours</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" min="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="end_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <SheetFooter className="px-0">
              <SubmitButton isSubmitting={form.formState.isSubmitting}>
                {isEdit ? "Save changes" : "Create sub-project"}
              </SubmitButton>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
