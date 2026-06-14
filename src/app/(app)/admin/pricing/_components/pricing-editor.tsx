"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/kit/submit-button";
import {
  BILLING_CYCLES,
  BILLING_INCREMENT_LABELS,
} from "@/lib/admin-enums";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

import { markPricingReviewed, saveClientPricing } from "../actions";
import { PriceHistory } from "./price-history";
import {
  isStale,
  parseHistory,
  STALE_DAYS,
  type AuditedField,
  type PricingRow,
} from "../pricing-shared";

const NONE = "none";

const schema = z.object({
  hourly_rate: z.string().trim(),
  hosting_price: z.string().trim(),
  hosting_cycle: z.string(),
  filemaker_license_price: z.string().trim(),
  filemaker_license_cycle: z.string(),
  billing_increment: z.enum(["exact", "6min", "15min"]),
  notes: z.string().trim(),
});

type FormValues = z.infer<typeof schema>;

// Latest history entry per field → "last changed" caption under each input.
function lastChangedMap(
  pricing: PricingRow | null,
  userMap: Record<string, string>,
): Partial<Record<AuditedField, string>> {
  const out: Partial<Record<AuditedField, string>> = {};
  if (!pricing) return out;
  for (const e of parseHistory(pricing.price_history)) {
    const by = e.updated_by ? (userMap[e.updated_by] ?? "Unknown") : "—";
    out[e.field as AuditedField] = `Changed ${formatDateTime(e.updated_at)} by ${by}`;
  }
  return out;
}

export function PricingEditor({
  clientId,
  clientName,
  pricing,
  userMap,
}: {
  clientId: string;
  clientName: string;
  pricing: PricingRow | null;
  userMap: Record<string, string>;
}) {
  const router = useRouter();
  const [reviewing, startReview] = useTransition();
  const [stale, setStale] = useState(isStale(pricing?.updated_at));
  const changed = lastChangedMap(pricing, userMap);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      hourly_rate: pricing?.hourly_rate?.toString() ?? "",
      hosting_price: pricing?.hosting_price?.toString() ?? "",
      hosting_cycle: pricing?.hosting_cycle ?? NONE,
      filemaker_license_price: pricing?.filemaker_license_price?.toString() ?? "",
      filemaker_license_cycle: pricing?.filemaker_license_cycle ?? NONE,
      billing_increment:
        (pricing?.billing_increment as FormValues["billing_increment"]) ??
        "exact",
      notes: pricing?.notes ?? "",
    },
  });

  async function onSubmit(values: FormValues) {
    const res = await saveClientPricing({
      client_id: clientId,
      hourly_rate: values.hourly_rate,
      hosting_price: values.hosting_price,
      hosting_cycle: values.hosting_cycle === NONE ? "" : values.hosting_cycle,
      filemaker_license_price: values.filemaker_license_price,
      filemaker_license_cycle:
        values.filemaker_license_cycle === NONE
          ? ""
          : values.filemaker_license_cycle,
      billing_increment: values.billing_increment,
      notes: values.notes,
    });
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success("Pricing saved");
    setStale(false);
    form.reset(values);
    router.refresh();
  }

  function onMarkReviewed() {
    startReview(async () => {
      const res = await markPricingReviewed(clientId);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Marked as reviewed");
      setStale(false);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {stale ? (
        <div className="flex items-center justify-between gap-4 rounded-lg border border-warning/30 bg-warning/10 px-4 py-3">
          <p className="text-sm text-warning">
            {pricing
              ? `Pricing for ${clientName} hasn't been reviewed in over ${STALE_DAYS} days.`
              : `No pricing has been set for ${clientName} yet.`}
          </p>
          {pricing ? (
            <Button
              variant="outline"
              size="sm"
              onClick={onMarkReviewed}
              disabled={reviewing}
            >
              {reviewing ? "Marking…" : "Mark reviewed"}
            </Button>
          ) : null}
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>{clientName} — pricing</CardTitle>
          {pricing ? (
            <p className="text-xs text-muted-foreground">
              Last updated {formatDateTime(pricing.updated_at)}
              {pricing.updated_by
                ? ` by ${userMap[pricing.updated_by] ?? "Unknown"}`
                : ""}
            </p>
          ) : null}
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-5"
            >
              <MoneyField
                form={form}
                name="hourly_rate"
                label="Hourly rate"
                caption={changed.hourly_rate}
              />

              <div className="grid grid-cols-2 gap-3">
                <MoneyField
                  form={form}
                  name="hosting_price"
                  label="Hosting price"
                  caption={changed.hosting_price}
                />
                <CycleField
                  form={form}
                  name="hosting_cycle"
                  label="Hosting cycle"
                  caption={changed.hosting_cycle}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <MoneyField
                  form={form}
                  name="filemaker_license_price"
                  label="FileMaker license price"
                  caption={changed.filemaker_license_price}
                />
                <CycleField
                  form={form}
                  name="filemaker_license_cycle"
                  label="FileMaker license cycle"
                  caption={changed.filemaker_license_cycle}
                />
              </div>

              <FormField
                control={form.control}
                name="billing_increment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Billing increment</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(BILLING_INCREMENT_LABELS).map(
                          ([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                    <Caption text={changed.billing_increment} />
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
                      <Textarea rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end">
                <SubmitButton isSubmitting={form.formState.isSubmitting}>
                  Save pricing
                </SubmitButton>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <PriceHistory
        history={parseHistory(pricing?.price_history)}
        userMap={userMap}
      />
    </div>
  );
}

function Caption({ text }: { text?: string }) {
  if (!text) return null;
  return <p className="text-xs text-muted-foreground">{text}</p>;
}

function MoneyField({
  form,
  name,
  label,
  caption,
}: {
  form: ReturnType<typeof useForm<FormValues>>;
  name: keyof FormValues;
  label: string;
  caption?: string;
}) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input
              type="number"
              step="0.01"
              min="0"
              inputMode="decimal"
              className={cn("tabular-nums")}
              {...field}
            />
          </FormControl>
          <Caption text={caption} />
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function CycleField({
  form,
  name,
  label,
  caption,
}: {
  form: ReturnType<typeof useForm<FormValues>>;
  name: keyof FormValues;
  label: string;
  caption?: string;
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
                <SelectValue />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem value={NONE}>Not set</SelectItem>
              {BILLING_CYCLES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c.charAt(0).toUpperCase() + c.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Caption text={caption} />
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
