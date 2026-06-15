import { getCurrentUser, requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getActiveTimer } from "@/lib/timer-queries";

import { MyDayView, type DayItem, type WeekDay } from "./_components/my-day-view";
import type { TaskOption } from "./_components/add-to-plan";

export const metadata = { title: "My Day · KiBiz" };

const WORKABLE_TASK_STATES = ["approved", "in_progress", "blocked", "done"];

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

// Monday-start week containing `date` (work_week_start default monday).
function weekDates(date: string): string[] {
  const d = new Date(`${date}T00:00:00Z`);
  const dow = (d.getUTCDay() + 6) % 7; // 0 = Monday
  const monday = new Date(d);
  monday.setUTCDate(d.getUTCDate() - dow);
  return Array.from({ length: 7 }, (_, i) => {
    const x = new Date(monday);
    x.setUTCDate(monday.getUTCDate() + i);
    return x.toISOString().slice(0, 10);
  });
}

export default async function MyDayPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  await requireRole("developer", "project_lead", "manager", "admin");
  const user = await getCurrentUser();
  const { date: dateParam } = await searchParams;
  const date = dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : todayUtc();
  const week = weekDates(date);
  const supabase = await createClient();

  const [
    { data: me },
    { data: goalItems },
    { data: dayEntries },
    { data: tasks },
    { data: planVsActual },
    activeTimer,
  ] = await Promise.all([
    supabase.from("users").select("daily_capacity_hours").eq("id", user!.id).single(),
    supabase
      .from("goal_items")
      .select(
        "id, task_id, planned_minutes, status, added_by, user_id, tasks(title, tickets(ticket_no, billing_type))",
      )
      .eq("user_id", user!.id)
      .eq("date", date)
      .in("status", ["planned", "in_progress", "done"]),
    supabase
      .from("time_entries")
      .select("task_id, duration_minutes")
      .eq("user_id", user!.id)
      .eq("work_date", date)
      .neq("state", "void"),
    supabase
      .from("tasks")
      .select("id, title, tickets(ticket_no)")
      .in("status", WORKABLE_TASK_STATES)
      .order("created_at", { ascending: false })
      .limit(300),
    supabase
      .from("v_goal_plan_vs_actual")
      .select("date, planned_minutes, actual_minutes")
      .eq("user_id", user!.id)
      .gte("date", week[0])
      .lte("date", week[6]),
    getActiveTimer(),
  ]);

  // Actual logged minutes per task for the selected day.
  const actualByTask = new Map<string, number>();
  for (const e of dayEntries ?? []) {
    if (e.task_id) {
      actualByTask.set(e.task_id, (actualByTask.get(e.task_id) ?? 0) + e.duration_minutes);
    }
  }

  type GoalJoin = NonNullable<typeof goalItems>[number] & {
    tasks: {
      title: string;
      tickets: { ticket_no: string | null; billing_type: string | null } | null;
    } | null;
  };
  const items: DayItem[] = ((goalItems ?? []) as GoalJoin[]).map((g) => ({
    id: g.id,
    task_id: g.task_id,
    title: g.tasks?.title ?? "Task",
    ticket_no: g.tasks?.tickets?.ticket_no ?? null,
    billable: g.tasks?.tickets?.billing_type === "billable",
    planned_minutes: g.planned_minutes ?? 0,
    actual_minutes: g.task_id ? (actualByTask.get(g.task_id) ?? 0) : 0,
    status: g.status,
    pushed: g.added_by !== g.user_id,
  }));

  const pvaByDate = new Map(
    (planVsActual ?? []).map((r) => [
      r.date,
      { planned: r.planned_minutes ?? 0, actual: r.actual_minutes ?? 0 },
    ]),
  );
  const weekData: WeekDay[] = week.map((d) => ({
    date: d,
    plannedMinutes: pvaByDate.get(d)?.planned ?? 0,
    actualMinutes: pvaByDate.get(d)?.actual ?? 0,
  }));

  type TaskJoin = NonNullable<typeof tasks>[number] & {
    tickets: { ticket_no: string | null } | null;
  };
  const taskOptions: TaskOption[] = ((tasks ?? []) as TaskJoin[]).map((t) => ({
    id: t.id,
    label: `${t.tickets?.ticket_no ? `${t.tickets.ticket_no} · ` : ""}${t.title}`,
  }));

  return (
    <MyDayView
      date={date}
      today={todayUtc()}
      capacityHours={me?.daily_capacity_hours ?? 8}
      items={items}
      week={weekData}
      tasks={taskOptions}
      timerRunning={activeTimer !== null}
      activeTimerTaskId={activeTimer?.taskId ?? null}
    />
  );
}
