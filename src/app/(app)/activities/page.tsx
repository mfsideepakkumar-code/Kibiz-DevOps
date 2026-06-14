import { getCurrentUser, requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

import {
  ActivitiesView,
  type ActivityRow,
} from "./_components/activities-view";
import type { TaskOption } from "./_components/activity-form";

export const metadata = { title: "Activities · KiBiz" };

const MANAGER_ROLES = ["manager", "admin"];
const WORKABLE_TASK_STATES = ["approved", "in_progress", "blocked", "done"];

export default async function ActivitiesPage({
  searchParams,
}: {
  searchParams: Promise<{
    state?: string;
    billable?: string;
    from?: string;
    to?: string;
  }>;
}) {
  await requireRole("developer", "project_lead", "manager", "admin");
  const user = await getCurrentUser();
  const canManage = MANAGER_ROLES.includes(user?.role ?? "");
  const sp = await searchParams;
  const supabase = await createClient();

  // RLS scopes rows: developers see their own, managers/admins see all.
  let q = supabase
    .from("time_entries")
    .select(
      "id, work_date, duration_minutes, billable, state, description, task_id, tickets(ticket_no), tasks(title), projects(name)",
    )
    .order("work_date", { ascending: false })
    .limit(500);
  if (sp.state && sp.state !== "all") q = q.eq("state", sp.state);
  if (sp.billable === "true") q = q.eq("billable", true);
  if (sp.billable === "false") q = q.eq("billable", false);
  if (sp.from) q = q.gte("work_date", sp.from);
  if (sp.to) q = q.lte("work_date", sp.to);

  const [{ data: entries }, { data: tasks }, { data: projects }] =
    await Promise.all([
      q,
      supabase
        .from("tasks")
        .select("id, title, tickets(ticket_no, billing_type)")
        .in("status", WORKABLE_TASK_STATES)
        .order("created_at", { ascending: false })
        .limit(300),
      supabase.from("projects").select("id, name").eq("status", "active").order("name"),
    ]);

  type EntryJoin = NonNullable<typeof entries>[number] & {
    tickets: { ticket_no: string | null } | null;
    tasks: { title: string } | null;
    projects: { name: string } | null;
  };
  const rows: ActivityRow[] = ((entries ?? []) as EntryJoin[]).map((e) => {
    const hasTask = e.task_id != null;
    const ticketNo = e.tickets?.ticket_no;
    const context = hasTask
      ? `${ticketNo ? `${ticketNo} · ` : ""}${e.tasks?.title ?? "Task"}`
      : (e.projects?.name ?? "Project");
    return {
      id: e.id,
      work_date: e.work_date,
      context_label: context,
      has_task: hasTask,
      duration_minutes: e.duration_minutes,
      billable: e.billable,
      state: e.state,
      description: e.description,
    };
  });

  type TaskJoin = NonNullable<typeof tasks>[number] & {
    tickets: { ticket_no: string | null; billing_type: string | null } | null;
  };
  const taskOptions: TaskOption[] = ((tasks ?? []) as TaskJoin[]).map((t) => ({
    id: t.id,
    label: `${t.tickets?.ticket_no ? `${t.tickets.ticket_no} · ` : ""}${t.title}`,
    billing_type: t.tickets?.billing_type ?? null,
  }));

  return (
    <ActivitiesView
      rows={rows}
      tasks={taskOptions}
      projects={projects ?? []}
      filters={{
        state: sp.state && sp.state !== "all" ? sp.state : "all",
        billable: sp.billable === "true" || sp.billable === "false" ? sp.billable : "all",
        from: sp.from ?? "",
        to: sp.to ?? "",
      }}
      canManage={canManage}
    />
  );
}
