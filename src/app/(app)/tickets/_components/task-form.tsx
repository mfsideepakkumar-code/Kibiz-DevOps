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

import { createTask } from "../actions";
import type { Option } from "./ticket-form";

const NONE = "none";

const schema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  description: z.string().trim(),
  assignee_id: z.string(),
  priority: z.string(),
  estimated_hours: z.string().trim(),
});

type FormValues = z.infer<typeof schema>;
const PRIORITIES = ["p0", "p1", "p2", "p3"];

export function TaskForm({
  ticketId,
  users,
  autoApproved,
  trigger,
}: {
  ticketId: string;
  users: Option[];
  autoApproved: boolean;
  trigger: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      description: "",
      assignee_id: NONE,
      priority: NONE,
      estimated_hours: "",
    },
  });

  async function onSubmit(values: FormValues) {
    const res = await createTask({
      ticket_id: ticketId,
      title: values.title,
      description: values.description,
      assignee_id: values.assignee_id === NONE ? "" : values.assignee_id,
      priority: values.priority === NONE ? null : values.priority,
      estimated_hours: values.estimated_hours,
    });
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success(autoApproved ? "Task added" : "Task submitted for approval");
    setOpen(false);
    form.reset();
    router.refresh();
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>New task</SheetTitle>
          <SheetDescription>
            {autoApproved
              ? "Tasks under an approved ticket are ready to work immediately (ADR-014)."
              : "This task follows the ticket through approval (Gate 1)."}
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 px-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="assignee_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assignee</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={NONE}>Unassigned</SelectItem>
                      {users.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={NONE}>Not set</SelectItem>
                        {PRIORITIES.map((p) => (
                          <SelectItem key={p} value={p}>
                            {p.toUpperCase()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="estimated_hours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estimated hours</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.25" min="0" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            <SheetFooter className="px-0">
              <SubmitButton isSubmitting={form.formState.isSubmitting}>
                Add task
              </SubmitButton>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
