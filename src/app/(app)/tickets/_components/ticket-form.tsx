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

import { createTicket } from "../actions";

export type Option = { id: string; name: string };
export type SubOption = { id: string; name: string; project_id: string };

const NONE = "none";

const schema = z.object({
  project_id: z.string().uuid("Select a project"),
  sub_project_id: z.string(),
  title: z.string().trim().min(1, "Title is required"),
  description: z.string().trim(),
  category_id: z.string().uuid("Select a category"),
  profit_center_id: z.string(),
  priority: z.string(),
  billing_type: z.string(),
});

type FormValues = z.infer<typeof schema>;

const PRIORITIES = ["p0", "p1", "p2", "p3"];

export function TicketForm({
  projects,
  subProjects,
  categories,
  profitCenters,
  isManager,
  trigger,
}: {
  projects: Option[];
  subProjects: SubOption[];
  categories: Option[];
  profitCenters: Option[];
  isManager: boolean;
  trigger: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      project_id: "",
      sub_project_id: NONE,
      title: "",
      description: "",
      category_id: "",
      profit_center_id: NONE,
      priority: NONE,
      billing_type: NONE,
    },
  });

  // eslint-disable-next-line react-hooks/incompatible-library -- watch() is the documented RHF API for dependent fields
  const projectId = form.watch("project_id");
  const projectSubs = subProjects.filter((s) => s.project_id === projectId);

  async function onSubmit(values: FormValues) {
    const res = await createTicket({
      project_id: values.project_id,
      sub_project_id: values.sub_project_id === NONE ? "" : values.sub_project_id,
      title: values.title,
      description: values.description,
      category_id: values.category_id,
      profit_center_id:
        values.profit_center_id === NONE ? "" : values.profit_center_id,
      priority: values.priority === NONE ? null : values.priority,
      billing_type: values.billing_type === NONE ? null : values.billing_type,
    });
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success(
      isManager ? "Ticket created (approved)" : "Ticket submitted for approval",
    );
    setOpen(false);
    form.reset();
    router.refresh();
    if (res.id) router.push(`/tickets/${res.id}`);
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>New ticket</SheetTitle>
          <SheetDescription>
            {isManager
              ? "Manager-created tickets are auto-approved."
              : "Your ticket goes to the manager approval queue (Gate 1)."}
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 px-4">
            <SelectField
              form={form}
              name="project_id"
              label="Project"
              options={projects}
            />
            {projectSubs.length > 0 ? (
              <SelectField
                form={form}
                name="sub_project_id"
                label="Sub-project (optional)"
                options={projectSubs}
                noneLabel="None"
              />
            ) : null}
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
            <SelectField
              form={form}
              name="category_id"
              label="Category"
              options={categories}
            />
            <SelectField
              form={form}
              name="profit_center_id"
              label="Profit centre (optional)"
              options={profitCenters}
              noneLabel="Use project default"
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
                name="billing_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Billing</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={NONE}>Not set</SelectItem>
                        <SelectItem value="billable">Billable</SelectItem>
                        <SelectItem value="non_billable">Non-Billable</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>
            <SheetFooter className="px-0">
              <SubmitButton isSubmitting={form.formState.isSubmitting}>
                {isManager ? "Create ticket" : "Submit for approval"}
              </SubmitButton>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}

function SelectField({
  form,
  name,
  label,
  options,
  noneLabel,
}: {
  form: ReturnType<typeof useForm<FormValues>>;
  name: keyof FormValues;
  label: string;
  options: Option[];
  noneLabel?: string;
}) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <Select value={field.value} onValueChange={field.onChange}>
            <FormControl>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select…" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {noneLabel ? <SelectItem value={NONE}>{noneLabel}</SelectItem> : null}
              {options.map((o) => (
                <SelectItem key={o.id} value={o.id}>
                  {o.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
