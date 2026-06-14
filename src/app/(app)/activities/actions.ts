"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth";
import type { Json } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/server";
import { activityValidationError, isOwnerEditable } from "@/lib/activity-rules";

export type ActionResult = { ok: true } | { ok: false; error: string };

function refresh() {
  revalidatePath("/activities");
}

const createSchema = z.object({
  // Either a task (preferred) or a project (project-level entry).
  task_id: z
    .union([z.string().uuid(), z.literal("")])
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional(),
  project_id: z
    .union([z.string().uuid(), z.literal("")])
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional(),
  work_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date"),
  duration_minutes: z
    .union([z.number(), z.string()])
    .transform((v) => Math.round(Number(v))),
  billable: z.boolean(),
  description: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional(),
});

export async function createActivity(input: unknown): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const parsed = createSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const v = parsed.data;
  const supabase = await createClient();

  let projectId = v.project_id ?? null;
  let ticketId: string | null = null;
  let activityType: string | null = null;

  if (v.task_id) {
    // Derive denormalized project_id / ticket_id from the task's ticket.
    const { data: task, error } = await supabase
      .from("tasks")
      .select("ticket_id, activity_type, tickets(project_id)")
      .eq("id", v.task_id)
      .single();
    if (error || !task) return { ok: false, error: "Task not found." };
    const ticket = task.tickets as { project_id: string } | null;
    if (!ticket) return { ok: false, error: "Task's ticket not found." };
    projectId = ticket.project_id;
    ticketId = task.ticket_id;
    activityType = task.activity_type;
  }

  if (!projectId) {
    return { ok: false, error: "Select a task or a project." };
  }

  const ruleError = activityValidationError({
    durationMinutes: v.duration_minutes,
    billable: v.billable,
    description: v.description,
    hasTask: !!v.task_id,
  });
  if (ruleError) return { ok: false, error: ruleError };

  const { error } = await supabase.from("time_entries").insert({
    task_id: v.task_id,
    project_id: projectId,
    ticket_id: ticketId,
    user_id: user.id,
    work_date: v.work_date,
    duration_minutes: v.duration_minutes,
    billable: v.billable,
    description: v.description,
    activity_type: activityType,
    state: "draft",
  });
  if (error) return { ok: false, error: error.message };
  refresh();
  return { ok: true };
}

const updateSchema = z.object({
  id: z.string().uuid(),
  work_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date"),
  duration_minutes: z
    .union([z.number(), z.string()])
    .transform((v) => Math.round(Number(v))),
  billable: z.boolean(),
  description: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional(),
});

const TRACKED = ["work_date", "duration_minutes", "billable", "description"] as const;

export async function updateActivity(input: unknown): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const v = parsed.data;
  const supabase = await createClient();

  const { data: existing, error: readError } = await supabase
    .from("time_entries")
    .select("*")
    .eq("id", v.id)
    .single();
  if (readError || !existing) return { ok: false, error: "Activity not found." };
  if (!isOwnerEditable(existing.state)) {
    return {
      ok: false,
      error: `This activity is ${existing.state} and can no longer be edited.`,
    };
  }

  const ruleError = activityValidationError({
    durationMinutes: v.duration_minutes,
    billable: v.billable,
    description: v.description,
    hasTask: existing.task_id != null,
  });
  if (ruleError) return { ok: false, error: ruleError };

  const next = {
    work_date: v.work_date,
    duration_minutes: v.duration_minutes,
    billable: v.billable,
    description: v.description ?? null,
  };

  // Append a per-field edit_history record (append-only — trigger guards it).
  const now = new Date().toISOString();
  const newHistory: Json[] = [...((existing.edit_history as Json[]) ?? [])];
  for (const field of TRACKED) {
    const oldValue = (existing[field] ?? null) as string | number | boolean | null;
    const newValue = (next[field] ?? null) as string | number | boolean | null;
    if (oldValue !== newValue) {
      newHistory.push({
        field,
        old_value: oldValue,
        new_value: newValue,
        edited_by: user.id,
        edited_at: now,
      } as Json);
    }
  }

  const { error } = await supabase
    .from("time_entries")
    .update({ ...next, edit_history: newHistory })
    .eq("id", v.id);
  if (error) return { ok: false, error: error.message };
  refresh();
  return { ok: true };
}

export async function deleteActivity(id: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const supabase = await createClient();
  // RLS allows deleting only the caller's own draft entries.
  const { data, error } = await supabase
    .from("time_entries")
    .delete()
    .eq("id", id)
    .select("id");
  if (error) return { ok: false, error: error.message };
  if (!data || data.length === 0) {
    return { ok: false, error: "Only your own draft activities can be deleted." };
  }
  refresh();
  return { ok: true };
}
