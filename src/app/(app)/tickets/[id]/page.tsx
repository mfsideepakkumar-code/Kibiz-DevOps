import { notFound } from "next/navigation";

import { getCurrentUser, requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getActiveTimer } from "@/lib/timer-queries";

import {
  TicketDetail,
  type DetailTask,
  type DetailTicket,
} from "../_components/ticket-detail";

const MANAGER_ROLES = ["manager", "admin"];

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("developer", "project_lead", "manager", "admin");
  const user = await getCurrentUser();
  const isManager = MANAGER_ROLES.includes(user?.role ?? "");
  const { id } = await params;
  const supabase = await createClient();

  const { data: ticket } = await supabase
    .from("tickets")
    .select(
      "id, ticket_no, title, description, status, priority, billing_type, projects(name), sub_projects(name), categories(name)",
    )
    .eq("id", id)
    .maybeSingle();
  if (!ticket) notFound();

  const [{ data: tasks }, { data: users }, activeTimer] = await Promise.all([
    supabase
      .from("tasks")
      .select("id, title, description, status, assignee_id")
      .eq("ticket_id", id)
      .order("created_at"),
    supabase.from("users").select("id, name").eq("is_active", true).order("name"),
    getActiveTimer(),
  ]);

  const userName = (uid: string | null) =>
    (users ?? []).find((u) => u.id === uid)?.name ?? null;

  type TicketJoin = typeof ticket & {
    projects: { name: string } | null;
    sub_projects: { name: string } | null;
    categories: { name: string } | null;
  };
  const tk = ticket as TicketJoin;

  const detailTicket: DetailTicket = {
    id: tk.id,
    ticket_no: tk.ticket_no,
    title: tk.title,
    description: tk.description,
    status: tk.status,
    priority: tk.priority,
    billing_type: tk.billing_type,
    project_name: tk.projects?.name ?? null,
    sub_project_name: tk.sub_projects?.name ?? null,
    category_name: tk.categories?.name ?? null,
  };

  const detailTasks: DetailTask[] = (tasks ?? []).map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    status: t.status,
    assignee_name: userName(t.assignee_id),
  }));

  return (
    <TicketDetail
      ticket={detailTicket}
      tasks={detailTasks}
      users={users ?? []}
      isManager={isManager}
      timerRunning={activeTimer !== null}
    />
  );
}
