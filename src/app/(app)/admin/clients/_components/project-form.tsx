"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Checkbox } from "@/components/ui/checkbox";
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
import { SubmitButton } from "@/components/kit/submit-button";
import { statusLabel } from "@/components/kit/status-variant";
import { PROJECT_STATUSES } from "@/lib/admin-enums";

import { saveProject } from "../actions";
import type { ProjectRow } from "../types";

const schema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  status: z.enum(PROJECT_STATUSES),
  sow_hours: z.string().trim(),
  default_rate_per_hour: z.string().trim(),
  is_internal: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

export function ProjectForm({
  clientId,
  project,
  trigger,
}: {
  clientId: string;
  project?: ProjectRow;
  trigger: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const isEdit = !!project;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: project?.name ?? "",
      status: (project?.status as FormValues["status"]) ?? "active",
      sow_hours: project?.sow_hours?.toString() ?? "",
      default_rate_per_hour: project?.default_rate_per_hour?.toString() ?? "",
      is_internal: project?.is_internal ?? false,
    },
  });

  async function onSubmit(values: FormValues) {
    const res = await saveProject({
      id: project?.id,
      client_id: clientId,
      name: values.name,
      status: values.status,
      sow_hours: values.sow_hours,
      default_rate_per_hour: values.default_rate_per_hour,
      is_internal: values.is_internal,
    });
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success(isEdit ? "Project updated" : "Project created");
    setOpen(false);
    form.reset(values);
    router.refresh();
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEdit ? "Edit project" : "New project"}</SheetTitle>
          <SheetDescription>
            Projects belong to this client.
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
            <FormField
              control={form.control}
              name="default_rate_per_hour"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Default rate / hour</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" min="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="is_internal"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="font-normal">
                    Internal project
                  </FormLabel>
                </FormItem>
              )}
            />
            <SheetFooter className="px-0">
              <SubmitButton isSubmitting={form.formState.isSubmitting}>
                {isEdit ? "Save changes" : "Create project"}
              </SubmitButton>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
