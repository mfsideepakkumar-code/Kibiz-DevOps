import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { isAiConfigured } from "@/lib/ai/anthropic";
import { PageHeader } from "@/components/kit/page-header";

import {
  ApprovalsQueue,
  type PendingBug,
  type PendingTask,
  type PendingTicket,
} from "./_components/approvals-queue";
import type { BillingItem } from "./_components/billing-queue";

const BILLING_TICKET_STATES = ["approved", "in_progress", "blocked", "done"];

export const metadata = { title: "Operations Queue · KiBiz" };

export default async function OpsQueuePage() {
  await requireRole("manager", "admin");
  const supabase = await createClient();

  const [
    { data: tickets },
    { data: tasks },
    { data: bugs },
    { data: users },
    { data: billingTickets },
    { data: summaries },
  ] = await Promise.all([
    supabase
      .from("tickets")
      .select(
        "id, ticket_no, title, priority, created_at, created_by, projects(name), categories(name)",
      )
      .eq("status", "pending_approval")
      .order("created_at"),
    supabase
      .from("tasks")
      .select("id, title, created_at, created_by, tickets(ticket_no, title)")
      .eq("status", "pending_approval")
      .order("created_at"),
    supabase
      .from("bugs")
      .select("id, title, created_at, reporter_id, projects(name)")
      .eq("triage_status", "pending")
      .order("created_at"),
    supabase.from("users").select("id, name"),
    // Billing queue (Gate 3 candidates): active tickets, with their tasks and
    // time entries, so we can surface the ones whose work is wrapping up.
    supabase
      .from("tickets")
      .select(
        "id, ticket_no, title, created_at, projects(name), tasks(status), time_entries(duration_minutes, billable, state)",
      )
      .in("status", BILLING_TICKET_STATES)
      .order("created_at"),
    supabase
      .from("billing_summaries")
      .select("ticket_id, summary_text, internal_detail, status, generated_by"),
  ]);

  const userName = (id: string | null) =>
    (users ?? []).find((u) => u.id === id)?.name ?? "Unknown";

  type TicketRow = NonNullable<typeof tickets>[number] & {
    projects: { name: string } | null;
    categories: { name: string } | null;
  };
  type TaskRow = NonNullable<typeof tasks>[number] & {
    tickets: { ticket_no: string | null; title: string } | null;
  };
  type BugRow = NonNullable<typeof bugs>[number] & {
    projects: { name: string } | null;
  };

  const pendingTickets: PendingTicket[] = ((tickets ?? []) as TicketRow[]).map(
    (t) => ({
      id: t.id,
      ticket_no: t.ticket_no,
      title: t.title,
      priority: t.priority,
      created_at: t.created_at,
      project_name: t.projects?.name ?? null,
      category_name: t.categories?.name ?? null,
      created_by_name: userName(t.created_by),
    }),
  );

  const pendingTasks: PendingTask[] = ((tasks ?? []) as TaskRow[]).map((t) => ({
    id: t.id,
    title: t.title,
    created_at: t.created_at,
    ticket_label: t.tickets
      ? `${t.tickets.ticket_no ? `${t.tickets.ticket_no} · ` : ""}${t.tickets.title}`
      : "—",
    created_by_name: userName(t.created_by),
  }));

  const pendingBugs: PendingBug[] = ((bugs ?? []) as BugRow[]).map((b) => ({
    id: b.id,
    title: b.title,
    created_at: b.created_at,
    project_name: b.projects?.name ?? null,
    reporter_name: userName(b.reporter_id),
  }));

  type BillingTicketRow = {
    id: string;
    ticket_no: string | null;
    title: string;
    projects: { name: string } | null;
    tasks: { status: string }[] | null;
    time_entries: { duration_minutes: number; billable: boolean; state: string }[] | null;
  };
  const summaryByTicket = new Map(
    (summaries ?? []).map((s) => [s.ticket_id, s]),
  );

  const billingItems: BillingItem[] = ((billingTickets ?? []) as BillingTicketRow[])
    .map((t) => {
      const summary = summaryByTicket.get(t.id);
      const tasks = t.tasks ?? [];
      const allTasksDone = tasks.length > 0 && tasks.every((x) => x.status === "done");
      // Eligible when work is wrapped (all tasks done) or a manager has already
      // started a summary (draft/returned). Approved summaries drop off the queue.
      const eligible =
        (allTasksDone || !!summary) && summary?.status !== "approved";
      if (!eligible) return null;

      const entries = (t.time_entries ?? []).filter((e) => e.state !== "void");
      const total_minutes = entries.reduce((n, e) => n + e.duration_minutes, 0);
      const billable_minutes = entries
        .filter((e) => e.billable)
        .reduce((n, e) => n + e.duration_minutes, 0);

      return {
        ticket_id: t.id,
        ticket_no: t.ticket_no,
        title: t.title,
        project_name: t.projects?.name ?? null,
        total_minutes,
        billable_minutes,
        summary_text: summary?.summary_text ?? null,
        internal_detail: summary?.internal_detail ?? null,
        summary_status: summary?.status ?? null,
        generated_by: summary?.generated_by ?? null,
      } satisfies BillingItem;
    })
    .filter((x): x is BillingItem => x !== null);

  return (
    <div>
      <PageHeader
        title="Operations Queue"
        description="Gate 1 approvals for developer-created work items."
      />
      <ApprovalsQueue
        tickets={pendingTickets}
        tasks={pendingTasks}
        bugs={pendingBugs}
        billing={billingItems}
        aiConfigured={isAiConfigured()}
      />
    </div>
  );
}
