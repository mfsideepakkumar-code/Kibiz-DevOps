"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { computeTimerSegments } from "@/lib/timer";

export type ActionResult = { ok: true; message?: string } | { ok: false; error: string };

function refresh() {
  revalidatePath("/", "layout"); // header timer widget lives in the app layout
  revalidatePath("/activities");
}

export async function startTimer(taskId: unknown): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Not signed in." };
  const parsed = z.string().uuid().safeParse(taskId);
  if (!parsed.success) return { ok: false, error: "Invalid task." };

  const supabase = await createClient();

  // One running timer per user — must stop the current one first (stopping a
  // billable timer needs a description, so we never silently auto-switch).
  const { data: existing } = await supabase
    .from("timer_state")
    .select("started_at")
    .eq("user_id", user.id)
    .maybeSingle();
  if (existing?.started_at) {
    return { ok: false, error: "A timer is already running. Stop it first." };
  }

  const { error } = await supabase.from("timer_state").upsert({
    user_id: user.id,
    task_id: parsed.data,
    started_at: new Date().toISOString(),
    accumulated_seconds: 0,
  });
  if (error) return { ok: false, error: error.message };
  refresh();
  return { ok: true };
}

const stopSchema = z.object({
  description: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional(),
});

export async function stopTimer(input: unknown): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Not signed in." };
  const parsed = stopSchema.safeParse(input ?? {});
  if (!parsed.success) return { ok: false, error: "Invalid input." };
  const description = parsed.data.description ?? null;

  const supabase = await createClient();
  const { data: timer } = await supabase
    .from("timer_state")
    .select("task_id, started_at")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!timer?.started_at || !timer.task_id) {
    return { ok: false, error: "No timer is running." };
  }

  // Resolve the task's ticket for denormalized fields + billable.
  const { data: task, error: taskError } = await supabase
    .from("tasks")
    .select("ticket_id, activity_type, tickets(project_id, billing_type)")
    .eq("id", timer.task_id)
    .single();
  if (taskError || !task) return { ok: false, error: "Timer's task not found." };
  const ticket = task.tickets as { project_id: string; billing_type: string | null } | null;
  if (!ticket) return { ok: false, error: "Task's ticket not found." };

  const billable = ticket.billing_type === "billable";
  if (billable && !description) {
    // Don't clear the timer — let the user add a description and retry.
    return { ok: false, error: "A description is required to stop a billable timer." };
  }

  const start = new Date(timer.started_at);
  const now = new Date();
  const { segments, autoStopped } = computeTimerSegments(start, now);

  // Under one minute → discard silently, just clear the timer.
  if (segments.length === 0) {
    await supabase.from("timer_state").delete().eq("user_id", user.id);
    refresh();
    return { ok: true, message: "Under a minute — discarded." };
  }

  const rows = segments.map((s) => ({
    task_id: timer.task_id,
    project_id: ticket.project_id,
    ticket_id: task.ticket_id,
    user_id: user.id,
    work_date: s.workDate,
    duration_minutes: s.minutes,
    start_time: s.startIso,
    end_time: s.endIso,
    billable,
    description,
    activity_type: task.activity_type,
    state: "draft" as const,
  }));

  const { error: insertError } = await supabase.from("time_entries").insert(rows);
  if (insertError) return { ok: false, error: insertError.message };

  await supabase.from("timer_state").delete().eq("user_id", user.id);

  // 12h auto-stop: notify managers (notifications are insert-restricted to the
  // service role, so use the admin client server-side after the insert).
  if (autoStopped) {
    try {
      const admin = createAdminClient();
      const { data: managers } = await admin
        .from("users")
        .select("id")
        .in("role", ["manager", "admin"])
        .eq("is_active", true);
      if (managers?.length) {
        await admin.from("notifications").insert(
          managers.map((m) => ({
            user_id: m.id,
            type: "timer_auto_stop",
            severity: "warning" as const,
            channel: "in_app" as const,
            message: `${user.name}'s timer ran over 12h and was capped. Review the flagged time.`,
          })),
        );
      }
    } catch {
      // Notification is best-effort; the capped entries are already saved.
    }
  }

  refresh();
  return {
    ok: true,
    message: autoStopped
      ? "Timer exceeded 12h — capped at 12h and managers were notified."
      : segments.length > 1
        ? "Logged across days (split at midnight)."
        : "Time logged.",
  };
}
