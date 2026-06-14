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
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/kit/submit-button";
import { splitMinutes, toMinutes } from "@/lib/activity-rules";

import { createActivity, updateActivity } from "../actions";

export type TaskOption = { id: string; label: string; billing_type: string | null };
export type ProjectOption = { id: string; name: string };
export type EditActivity = {
  id: string;
  work_date: string;
  duration_minutes: number;
  billable: boolean;
  description: string | null;
  context_label: string;
  has_task: boolean;
};

const PROJECT_LEVEL = "__project";

const schema = z.object({
  task_id: z.string(),
  project_id: z.string(),
  work_date: z.string().min(1, "Pick a date"),
  hours: z.string(),
  minutes: z.string(),
  billable: z.boolean(),
  description: z.string(),
});

type FormValues = z.infer<typeof schema>;

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function ActivityForm({
  tasks,
  projects,
  activity,
  trigger,
}: {
  tasks: TaskOption[];
  projects: ProjectOption[];
  activity?: EditActivity;
  trigger: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const isEdit = !!activity;
  const initial = activity
    ? splitMinutes(activity.duration_minutes)
    : { hours: 0, minutes: 0 };

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      task_id: "",
      project_id: "",
      work_date: activity?.work_date ?? today(),
      hours: String(initial.hours),
      minutes: String(initial.minutes),
      billable: activity?.billable ?? false,
      description: activity?.description ?? "",
    },
  });

  // eslint-disable-next-line react-hooks/incompatible-library -- watch() is the documented RHF API for dependent fields
  const taskId = form.watch("task_id");
  const isProjectLevel = taskId === PROJECT_LEVEL;

  function onTaskChange(value: string) {
    form.setValue("task_id", value);
    // Prefill billable from the task's ticket billing type (overridable).
    const task = tasks.find((t) => t.id === value);
    if (task) form.setValue("billable", task.billing_type === "billable");
  }

  async function onSubmit(values: FormValues) {
    const duration = toMinutes(Number(values.hours), Number(values.minutes));

    const res = isEdit
      ? await updateActivity({
          id: activity!.id,
          work_date: values.work_date,
          duration_minutes: duration,
          billable: values.billable,
          description: values.description,
        })
      : await createActivity({
          task_id: isProjectLevel ? "" : values.task_id,
          project_id: isProjectLevel ? values.project_id : "",
          work_date: values.work_date,
          duration_minutes: duration,
          billable: values.billable,
          description: values.description,
        });

    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success(isEdit ? "Activity updated" : "Time logged");
    setOpen(false);
    if (!isEdit) form.reset({ ...form.getValues(), hours: "0", minutes: "0", description: "" });
    router.refresh();
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEdit ? "Edit activity" : "Log time"}</SheetTitle>
          <SheetDescription>
            Duration-first. Minimum 1 minute. Rounding happens only at invoice
            time.
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 px-4">
            {isEdit ? (
              <div className="space-y-0.5">
                <p className="text-xs text-muted-foreground">Logged against</p>
                <p className="text-sm">{activity!.context_label}</p>
              </div>
            ) : (
              <>
                <FormField
                  control={form.control}
                  name="task_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Task</FormLabel>
                      <Select value={field.value} onValueChange={onTaskChange}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select a task…" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={PROJECT_LEVEL}>
                            Log to a project (no task)
                          </SelectItem>
                          {tasks.map((t) => (
                            <SelectItem key={t.id} value={t.id}>
                              {t.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {isProjectLevel ? (
                  <FormField
                    control={form.control}
                    name="project_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select a project…" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {projects.map((p) => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : null}
              </>
            )}

            <FormField
              control={form.control}
              name="work_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="hours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hours</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" step="1" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="minutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minutes</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" max="59" step="1" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="billable"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="font-normal">Billable</FormLabel>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Description{" "}
                    <span className="text-muted-foreground">
                      (required when billable)
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Textarea rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <SheetFooter className="px-0">
              <SubmitButton isSubmitting={form.formState.isSubmitting}>
                {isEdit ? "Save changes" : "Log time"}
              </SubmitButton>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
