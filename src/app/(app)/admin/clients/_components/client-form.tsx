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
import {
  ENGAGEMENT_MODELS,
  ENGAGEMENT_MODEL_LABELS,
} from "@/lib/admin-enums";

import { saveClient } from "../actions";
import type { ClientRow } from "../types";

const NONE = "none";

const schema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  industry: z.string().trim(),
  engagement_model: z.string(),
  fm_client_id: z.string().trim(),
  is_active: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

export function ClientForm({
  client,
  trigger,
}: {
  client?: ClientRow;
  trigger: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const isEdit = !!client;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: client?.name ?? "",
      industry: client?.industry ?? "",
      engagement_model: client?.engagement_model ?? NONE,
      fm_client_id: client?.fm_client_id ?? "",
      is_active: client?.is_active ?? true,
    },
  });

  async function onSubmit(values: FormValues) {
    const res = await saveClient({
      id: client?.id,
      name: values.name,
      industry: values.industry,
      engagement_model:
        values.engagement_model === NONE ? null : values.engagement_model,
      fm_client_id: values.fm_client_id,
      is_active: values.is_active,
    });
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success(isEdit ? "Client updated" : "Client created");
    setOpen(false);
    form.reset(values);
    router.refresh();
    if (!isEdit && res.id) router.push(`/admin/clients?client=${res.id}`);
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEdit ? "Edit client" : "New client"}</SheetTitle>
          <SheetDescription>
            {isEdit
              ? "Update client details and engagement model."
              : "Add a client to the platform."}
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
              name="engagement_model"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Engagement model</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={NONE}>Not set</SelectItem>
                      {ENGAGEMENT_MODELS.map((m) => (
                        <SelectItem key={m} value={m}>
                          {ENGAGEMENT_MODEL_LABELS[m]}
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
              name="industry"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Industry</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="fm_client_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>FileMaker client ID</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="KiClient ID (WF-009)" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="font-normal">Active</FormLabel>
                </FormItem>
              )}
            />
            <SheetFooter className="px-0">
              <SubmitButton isSubmitting={form.formState.isSubmitting}>
                {isEdit ? "Save changes" : "Create client"}
              </SubmitButton>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
