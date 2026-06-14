import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/kit/page-header";

import {
  ApprovalsQueue,
  type PendingBug,
  type PendingTask,
  type PendingTicket,
} from "./_components/approvals-queue";

export const metadata = { title: "Operations Queue · KiBiz" };

export default async function OpsQueuePage() {
  await requireRole("manager", "admin");
  const supabase = await createClient();

  const [{ data: tickets }, { data: tasks }, { data: bugs }, { data: users }] =
    await Promise.all([
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
      />
    </div>
  );
}
