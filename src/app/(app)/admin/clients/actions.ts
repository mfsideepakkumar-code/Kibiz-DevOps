"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ENGAGEMENT_MODELS, PROJECT_STATUSES } from "@/lib/admin-enums";

export type ActionResult =
  | { ok: true; id?: string }
  | { ok: false; error: string };

// Drop a key from a shallow copy (used to keep an immutable parent FK out of
// update payloads without leaving an unused destructured binding).
function omit<T extends object, K extends keyof T>(obj: T, key: K): Omit<T, K> {
  const copy = { ...obj };
  delete copy[key];
  return copy;
}

// Server-side admin gate for every mutation (security.md: role check before
// any data access). RLS is the backstop; this is the primary guard.
async function assertAdmin(): Promise<ActionResult | null> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Not signed in." };
  if (user.role !== "admin") return { ok: false, error: "Admin access required." };
  return null;
}

// Normalize optional text inputs: empty string → null.
const optionalText = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : v))
  .nullable()
  .optional();

const clientSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1, "Name is required"),
  industry: optionalText,
  engagement_model: z
    .enum(ENGAGEMENT_MODELS)
    .nullable()
    .optional()
    .or(z.literal("").transform(() => null)),
  fm_client_id: optionalText,
  is_active: z.boolean().default(true),
});

export async function saveClient(input: unknown): Promise<ActionResult> {
  const denied = await assertAdmin();
  if (denied) return denied;

  const parsed = clientSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const { id, ...values } = parsed.data;
  const supabase = await createClient();

  if (id) {
    const { error } = await supabase.from("clients").update(values).eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/clients");
    return { ok: true, id };
  }

  const { data, error } = await supabase
    .from("clients")
    .insert(values)
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/clients");
  return { ok: true, id: data.id };
}

const numericOptional = z
  .union([z.number(), z.string()])
  .transform((v) => (v === "" || v === null || v === undefined ? null : Number(v)))
  .refine((v) => v === null || !Number.isNaN(v), "Must be a number")
  .nullable()
  .optional();

const projectSchema = z.object({
  id: z.string().uuid().optional(),
  client_id: z.string().uuid(),
  name: z.string().trim().min(1, "Name is required"),
  status: z.enum(PROJECT_STATUSES).default("active"),
  sow_hours: numericOptional,
  default_rate_per_hour: numericOptional,
  is_internal: z.boolean().default(false),
});

export async function saveProject(input: unknown): Promise<ActionResult> {
  const denied = await assertAdmin();
  if (denied) return denied;

  const parsed = projectSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const { id, ...values } = parsed.data;
  const supabase = await createClient();

  if (id) {
    const { error } = await supabase
      .from("projects")
      .update(omit(values, "client_id"))
      .eq("id", id);
    if (error) return { ok: false, error: error.message };
  } else {
    const { error } = await supabase.from("projects").insert(values);
    if (error) return { ok: false, error: error.message };
  }
  revalidatePath("/admin/clients");
  return { ok: true };
}

// C-11 hard block: sub_projects fields are limited to schema.md exactly.
const subProjectSchema = z.object({
  id: z.string().uuid().optional(),
  project_id: z.string().uuid(),
  name: z.string().trim().min(1, "Name is required"),
  status: z.enum(PROJECT_STATUSES).default("active"),
  sow_hours: numericOptional,
  start_date: optionalText,
  end_date: optionalText,
  notes: optionalText,
});

export async function saveSubProject(input: unknown): Promise<ActionResult> {
  const denied = await assertAdmin();
  if (denied) return denied;

  const parsed = subProjectSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const { id, ...values } = parsed.data;
  const supabase = await createClient();

  if (id) {
    const { error } = await supabase
      .from("sub_projects")
      .update(omit(values, "project_id"))
      .eq("id", id);
    if (error) return { ok: false, error: error.message };
  } else {
    const { error } = await supabase.from("sub_projects").insert(values);
    if (error) return { ok: false, error: error.message };
  }
  revalidatePath("/admin/clients");
  return { ok: true };
}

const contactSchema = z.object({
  id: z.string().uuid().optional(),
  client_id: z.string().uuid(),
  name: z.string().trim().min(1, "Name is required"),
  email: z
    .union([z.string().trim().email("Invalid email"), z.literal("")])
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional(),
  phone: optionalText,
  is_primary: z.boolean().default(false),
  receives_invoices: z.boolean().default(false),
  receives_reports: z.boolean().default(false),
  // has_portal_access intentionally omitted — inert until C-1 resolved.
});

export async function saveContact(input: unknown): Promise<ActionResult> {
  const denied = await assertAdmin();
  if (denied) return denied;

  const parsed = contactSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const { id, ...values } = parsed.data;
  const supabase = await createClient();

  if (id) {
    const { error } = await supabase
      .from("client_contacts")
      .update(omit(values, "client_id"))
      .eq("id", id);
    if (error) return { ok: false, error: error.message };
  } else {
    const { error } = await supabase.from("client_contacts").insert(values);
    if (error) return { ok: false, error: error.message };
  }
  revalidatePath("/admin/clients");
  return { ok: true };
}
