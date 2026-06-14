"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { BILLING_CYCLES } from "@/lib/admin-enums";

import {
  AUDITED_FIELDS,
  parseHistory,
  type AuditedField,
  type PriceHistoryEntry,
} from "./pricing-shared";

export type ActionResult = { ok: true } | { ok: false; error: string };

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) return { error: "Not signed in." as const, user: null };
  if (user.role !== "admin")
    return { error: "Admin access required." as const, user: null };
  return { error: null, user };
}

const nullableNumber = z
  .union([z.number(), z.string()])
  .transform((v) =>
    v === "" || v === null || v === undefined ? null : Number(v),
  )
  .refine((v) => v === null || !Number.isNaN(v), "Must be a number")
  .nullable()
  .optional();

const nullableCycle = z
  .union([z.enum(BILLING_CYCLES), z.literal("")])
  .transform((v) => (v === "" ? null : v))
  .nullable()
  .optional();

const pricingSchema = z.object({
  client_id: z.string().uuid(),
  hourly_rate: nullableNumber,
  hosting_price: nullableNumber,
  hosting_cycle: nullableCycle,
  filemaker_license_price: nullableNumber,
  filemaker_license_cycle: nullableCycle,
  billing_increment: z.enum(["exact", "6min", "15min"]),
  notes: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional(),
});

// Treat undefined as null so a cleared field reads as "unset" in diffs.
function norm(v: unknown): string | number | null {
  if (v === undefined || v === "") return null;
  return v as string | number | null;
}

export async function saveClientPricing(input: unknown): Promise<ActionResult> {
  const { error: authError, user } = await requireAdmin();
  if (authError) return { ok: false, error: authError };

  const parsed = pricingSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }
  const values = parsed.data;
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("client_pricing")
    .select("*")
    .eq("client_id", values.client_id)
    .maybeSingle();

  const now = new Date().toISOString();

  // Build append-only history entries for every audited field that changed.
  const newEntries: PriceHistoryEntry[] = [];
  for (const field of AUDITED_FIELDS as readonly AuditedField[]) {
    const oldValue = norm(existing?.[field]);
    const newValue = norm(values[field]);
    if (oldValue !== newValue) {
      newEntries.push({
        field,
        old_value: oldValue,
        new_value: newValue,
        updated_at: now,
        updated_by: user!.id,
      });
    }
  }

  const rowValues = {
    hourly_rate: values.hourly_rate ?? null,
    hosting_price: values.hosting_price ?? null,
    hosting_cycle: values.hosting_cycle ?? null,
    filemaker_license_price: values.filemaker_license_price ?? null,
    filemaker_license_cycle: values.filemaker_license_cycle ?? null,
    billing_increment: values.billing_increment,
    notes: values.notes ?? null,
    updated_at: now,
    updated_by: user!.id,
  };

  if (existing) {
    // price_history is append-only: keep all existing entries in order, append new.
    const history = [...parseHistory(existing.price_history), ...newEntries];
    const { error } = await supabase
      .from("client_pricing")
      .update({ ...rowValues, price_history: history })
      .eq("client_id", values.client_id);
    if (error) return { ok: false, error: error.message };
  } else {
    const { error } = await supabase.from("client_pricing").insert({
      client_id: values.client_id,
      ...rowValues,
      price_history: newEntries,
    });
    if (error) return { ok: false, error: error.message };
  }

  revalidatePath("/admin/pricing");
  return { ok: true };
}

// Stale-clearing review (N11): bump updated_at without changing values or
// appending history — confirms pricing was checked and is still correct.
export async function markPricingReviewed(
  clientId: string,
): Promise<ActionResult> {
  const { error: authError, user } = await requireAdmin();
  if (authError) return { ok: false, error: authError };

  const supabase = await createClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("client_pricing")
    .update({ updated_at: now, updated_by: user!.id })
    .eq("client_id", clientId)
    .select("client_id");
  if (error) return { ok: false, error: error.message };
  if (!data || data.length === 0) {
    return { ok: false, error: "No pricing to review — set pricing first." };
  }
  revalidatePath("/admin/pricing");
  return { ok: true };
}
