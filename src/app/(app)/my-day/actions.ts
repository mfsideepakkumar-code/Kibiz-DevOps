"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type ActionResult = { ok: true } | { ok: false; error: string };

const MANAGER_ROLES = ["manager", "admin"];
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date");

function refresh() {
  revalidatePath("/my-day");
  revalidatePath("/team-day");
}

async function plannedMinutesForTask(
  supabase: Awaited<ReturnType<typeof createClient>>,
  taskId: string,
): Promise<number | null> {
  const { data } = await supabase
    .from("tasks")
    .select("estimated_hours")
    .eq("id", taskId)
    .single();
  return data?.estimated_hours != null ? Math.round(data.estimated_hours * 60) : null;
}

export async function addGoalItem(input: unknown): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Not signed in." };
  const parsed = z
    .object({ task_id: z.string().uuid(), date: dateSchema })
    .safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const supabase = await createClient();
  const planned = await plannedMinutesForTask(supabase, parsed.data.task_id);

  const { error } = await supabase.from("goal_items").insert({
    user_id: user.id,
    date: parsed.data.date,
    task_id: parsed.data.task_id,
    planned_minutes: planned,
    status: "planned",
    added_by: user.id,
  });
  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "That task is already on this day's plan." };
    }
    return { ok: false, error: error.message };
  }
  refresh();
  return { ok: true };
}

export async function setPlannedMinutes(
  id: string,
  minutes: number,
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Not signed in." };
  const m = Math.max(0, Math.round(minutes));
  const supabase = await createClient();
  const { error } = await supabase
    .from("goal_items")
    .update({ planned_minutes: m })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  refresh();
  return { ok: true };
}

export async function setGoalStatus(
  id: string,
  status: "planned" | "in_progress" | "done",
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Not signed in." };
  if (!["planned", "in_progress", "done"].includes(status)) {
    return { ok: false, error: "Invalid status." };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("goal_items")
    .update({ status })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  refresh();
  return { ok: true };
}

export async function carryGoalItem(
  id: string,
  toDate: unknown,
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Not signed in." };
  const parsedDate = dateSchema.safeParse(toDate);
  if (!parsedDate.success) return { ok: false, error: "Pick a valid date." };

  const supabase = await createClient();
  const { data: item, error: readError } = await supabase
    .from("goal_items")
    .select("task_id, date, planned_minutes")
    .eq("id", id)
    .single();
  if (readError || !item) return { ok: false, error: "Plan item not found." };

  // Recreate on the target day (skip if it's already planned there), then mark
  // the original carried so the carry-over chain is preserved.
  const { error: insertError } = await supabase.from("goal_items").insert({
    user_id: user.id,
    date: parsedDate.data,
    task_id: item.task_id,
    planned_minutes: item.planned_minutes,
    status: "planned",
    carried_from_date: item.date,
    added_by: user.id,
  });
  if (insertError && insertError.code !== "23505") {
    return { ok: false, error: insertError.message };
  }
  const { error: updateError } = await supabase
    .from("goal_items")
    .update({ status: "carried" })
    .eq("id", id);
  if (updateError) return { ok: false, error: updateError.message };
  refresh();
  return { ok: true };
}

export async function dropGoalItem(
  id: string,
  reason?: string,
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const supabase = await createClient();
  const { data: item, error: readError } = await supabase
    .from("goal_items")
    .select("added_by, user_id")
    .eq("id", id)
    .single();
  if (readError || !item) return { ok: false, error: "Plan item not found." };

  // Removing a manager-pushed item requires a reason.
  const managerPushed = item.added_by !== item.user_id;
  if (managerPushed && !reason?.trim()) {
    return { ok: false, error: "A reason is required to drop a pushed item." };
  }

  const { error } = await supabase
    .from("goal_items")
    .update({ status: "dropped", removal_reason: reason?.trim() ?? null })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  refresh();
  return { ok: true };
}

// Manager push-planning: add an approved task to a developer's day.
export async function pushPlanItem(input: unknown): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Not signed in." };
  if (!MANAGER_ROLES.includes(user.role)) {
    return { ok: false, error: "Manager access required." };
  }
  const parsed = z
    .object({
      user_id: z.string().uuid(),
      task_id: z.string().uuid(),
      date: dateSchema,
    })
    .safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const supabase = await createClient();
  const planned = await plannedMinutesForTask(supabase, parsed.data.task_id);

  const { error } = await supabase.from("goal_items").insert({
    user_id: parsed.data.user_id,
    date: parsed.data.date,
    task_id: parsed.data.task_id,
    planned_minutes: planned,
    status: "planned",
    added_by: user.id,
  });
  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "That task is already on the developer's plan." };
    }
    return { ok: false, error: error.message };
  }
  refresh();
  return { ok: true };
}
