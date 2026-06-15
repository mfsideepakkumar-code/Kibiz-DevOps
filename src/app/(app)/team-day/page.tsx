import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

import { TeamDayView, type TeamRow } from "./_components/team-day-view";
import type { TaskOption } from "../my-day/_components/add-to-plan";

export const metadata = { title: "Team Day · KiBiz" };

const WORKABLE_TASK_STATES = ["approved", "in_progress", "blocked", "done"];

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

export default async function TeamDayPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  await requireRole("manager", "admin");
  const { date: dateParam } = await searchParams;
  const date = dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : todayUtc();
  const supabase = await createClient();

  const { data: devs } = await supabase
    .from("users")
    .select("id, name, daily_capacity_hours")
    .in("role", ["developer", "project_lead"])
    .eq("is_active", true)
    .order("name");

  const devIds = (devs ?? []).map((d) => d.id);

  const [{ data: pva }, { data: tasks }] = await Promise.all([
    devIds.length
      ? supabase
          .from("v_goal_plan_vs_actual")
          .select("user_id, planned_minutes, actual_minutes")
          .eq("date", date)
          .in("user_id", devIds)
      : Promise.resolve({ data: [] as { user_id: string; planned_minutes: number; actual_minutes: number }[] }),
    supabase
      .from("tasks")
      .select("id, title, tickets(ticket_no)")
      .in("status", WORKABLE_TASK_STATES)
      .order("created_at", { ascending: false })
      .limit(300),
  ]);

  const pvaByUser = new Map(
    (pva ?? []).map((r) => [
      r.user_id,
      { planned: r.planned_minutes ?? 0, actual: r.actual_minutes ?? 0 },
    ]),
  );

  const rows: TeamRow[] = (devs ?? []).map((d) => ({
    user_id: d.id,
    name: d.name,
    capacity_hours: d.daily_capacity_hours ?? 8,
    planned_minutes: pvaByUser.get(d.id)?.planned ?? 0,
    actual_minutes: pvaByUser.get(d.id)?.actual ?? 0,
  }));

  type TaskJoin = NonNullable<typeof tasks>[number] & {
    tickets: { ticket_no: string | null } | null;
  };
  const taskOptions: TaskOption[] = ((tasks ?? []) as TaskJoin[]).map((t) => ({
    id: t.id,
    label: `${t.tickets?.ticket_no ? `${t.tickets.ticket_no} · ` : ""}${t.title}`,
  }));

  return (
    <TeamDayView date={date} today={todayUtc()} rows={rows} tasks={taskOptions} />
  );
}
