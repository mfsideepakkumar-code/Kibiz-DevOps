import { getCurrentUser, requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

import { TicketsView, type TicketRow } from "./_components/tickets-view";

export const metadata = { title: "Tickets · KiBiz" };

const MANAGER_ROLES = ["manager", "admin"];

export default async function TicketsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireRole("developer", "project_lead", "manager", "admin");
  const user = await getCurrentUser();
  const isManager = MANAGER_ROLES.includes(user?.role ?? "");
  const { status } = await searchParams;
  const supabase = await createClient();

  let ticketQuery = supabase
    .from("tickets")
    .select(
      "id, ticket_no, title, status, priority, updated_at, projects(name), categories(name)",
    )
    .order("updated_at", { ascending: false });
  if (status && status !== "all") ticketQuery = ticketQuery.eq("status", status);

  const [
    { data: tickets },
    { data: projects },
    { data: subProjects },
    { data: categories },
    { data: profitCenters },
  ] = await Promise.all([
    ticketQuery,
    supabase.from("projects").select("id, name").eq("status", "active").order("name"),
    supabase.from("sub_projects").select("id, name, project_id").order("name"),
    supabase.from("categories").select("id, name").order("name"),
    supabase
      .from("profit_centers")
      .select("id, name")
      .eq("is_active", true)
      .order("name"),
  ]);

  type Row = NonNullable<typeof tickets>[number] & {
    projects: { name: string } | null;
    categories: { name: string } | null;
  };
  const rows: TicketRow[] = ((tickets ?? []) as Row[]).map((t) => ({
    id: t.id,
    ticket_no: t.ticket_no,
    title: t.title,
    status: t.status,
    priority: t.priority,
    project_name: t.projects?.name ?? null,
    category_name: t.categories?.name ?? null,
    updated_at: t.updated_at,
  }));

  return (
    <TicketsView
      rows={rows}
      projects={projects ?? []}
      subProjects={subProjects ?? []}
      categories={categories ?? []}
      profitCenters={profitCenters ?? []}
      isManager={isManager}
      statusFilter={status && status !== "all" ? status : "all"}
    />
  );
}
