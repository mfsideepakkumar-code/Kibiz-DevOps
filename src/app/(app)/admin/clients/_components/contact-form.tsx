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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SubmitButton } from "@/components/kit/submit-button";

import { saveContact } from "../actions";
import type { ContactRow } from "../types";

const schema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.union([z.string().trim().email("Invalid email"), z.literal("")]),
  phone: z.string().trim(),
  is_primary: z.boolean(),
  receives_invoices: z.boolean(),
  receives_reports: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

const CHECKS: { name: keyof FormValues; label: string }[] = [
  { name: "is_primary", label: "Primary contact" },
  { name: "receives_invoices", label: "Receives invoices" },
  { name: "receives_reports", label: "Receives reports" },
];

export function ContactForm({
  clientId,
  contact,
  trigger,
}: {
  clientId: string;
  contact?: ContactRow;
  trigger: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const isEdit = !!contact;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: contact?.name ?? "",
      email: contact?.email ?? "",
      phone: contact?.phone ?? "",
      is_primary: contact?.is_primary ?? false,
      receives_invoices: contact?.receives_invoices ?? false,
      receives_reports: contact?.receives_reports ?? false,
    },
  });

  async function onSubmit(values: FormValues) {
    const res = await saveContact({ id: contact?.id, client_id: clientId, ...values });
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success(isEdit ? "Contact updated" : "Contact created");
    setOpen(false);
    form.reset(values);
    router.refresh();
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEdit ? "Edit contact" : "New contact"}</SheetTitle>
          <SheetDescription>
            Contacts receive invoices and reports per the flags below.
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
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="space-y-3">
              {CHECKS.map((c) => (
                <FormField
                  key={c.name}
                  control={form.control}
                  name={c.name}
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center gap-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value as boolean}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="font-normal">{c.label}</FormLabel>
                    </FormItem>
                  )}
                />
              ))}
            </div>
            <SheetFooter className="px-0">
              <SubmitButton isSubmitting={form.formState.isSubmitting}>
                {isEdit ? "Save changes" : "Create contact"}
              </SubmitButton>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
