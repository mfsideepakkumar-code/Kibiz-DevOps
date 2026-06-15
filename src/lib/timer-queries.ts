import "server-only";

import { createClient } from "@/lib/supabase/server";

export type ActiveTimer = {
  taskId: string;
  startedAt: string;
  label: string;
  billable: boolean;
};

// Reads the caller's running timer (if any) for display. Read-only — the 12h
// auto-stop/cap happens at stop time (proactive unattended auto-stop needs a
// WF-spec cron, deferred). RLS scopes timer_state to the caller's own row.
export async function getActiveTimer(): Promise<ActiveTimer | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("timer_state")
    .select("task_id, started_at, tasks(title, tickets(ticket_no, billing_type))")
    .not("started_at", "is", null)
    .maybeSingle();

  if (!data || !data.task_id || !data.started_at) return null;

  const task = data.tasks as {
    title: string;
    tickets: { ticket_no: string | null; billing_type: string | null } | null;
  } | null;
  const ticketNo = task?.tickets?.ticket_no;

  return {
    taskId: data.task_id,
    startedAt: data.started_at,
    label: task
      ? `${ticketNo ? `${ticketNo} · ` : ""}${task.title}`
      : "Task",
    billable: task?.tickets?.billing_type === "billable",
  };
}
