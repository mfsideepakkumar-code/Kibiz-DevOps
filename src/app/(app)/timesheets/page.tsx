import { getCurrentUser, requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { mondayOf, recentWeeks, todayUtc, weekEnd } from "@/lib/week";

import {
  TimesheetsView,
  type EntryRow,
  type WeekSummary,
} from "./_components/timesheets-view";

export const metadata = { title: "My Timesheets · KiBiz" };

const WEEKS_BACK = 8;

export default async function TimesheetsPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  await requireRole("developer", "project_lead", "manager", "admin");
  const user = await getCurrentUser();
  const { week } = await searchParams;
  const selectedWeek = mondayOf(
    week && /^\d{4}-\d{2}-\d{2}$/.test(week) ? week : todayUtc(),
  );

  const weeks = recentWeeks(todayUtc(), WEEKS_BACK);
  const rangeStart = weeks[weeks.length - 1];
  const rangeEnd = weekEnd(weeks[0]);
  const supabase = await createClient();

  const [{ data: entries }, { data: timesheets }] = await Promise.all([
    supabase
      .from("time_entries")
      .select(
        "id, work_date, duration_minutes, billable, state, task_id, tasks(title, tickets(ticket_no)), projects(name)",
      )
      .eq("user_id", user!.id)
      .gte("work_date", rangeStart)
      .lte("work_date", rangeEnd)
      .neq("state", "void")
      .order("work_date"),
    supabase
      .from("timesheets")
      .select("week_start, status, review_note")
      .eq("user_id", user!.id)
      .gte("week_start", rangeStart)
      .lte("week_start", weeks[0]),
  ]);

  type EntryJoin = NonNullable<typeof entries>[number] & {
    tasks: { title: string; tickets: { ticket_no: string | null } | null } | null;
    projects: { name: string } | null;
  };
  const allEntries = (entries ?? []) as EntryJoin[];
  const tsByWeek = new Map(
    (timesheets ?? []).map((t) => [t.week_start, t]),
  );

  const summaries: WeekSummary[] = weeks.map((ws) => {
    const end = weekEnd(ws);
    const weekEntries = allEntries.filter(
      (e) => e.work_date >= ws && e.work_date <= end,
    );
    const totalMin = weekEntries.reduce((n, e) => n + e.duration_minutes, 0);
    const billableMin = weekEntries
      .filter((e) => e.billable)
      .reduce((n, e) => n + e.duration_minutes, 0);
    const ts = tsByWeek.get(ws);
    const status = ts?.status ?? (weekEntries.length > 0 ? "draft" : "empty");
    return {
      weekStart: ws,
      weekEnd: end,
      totalMinutes: totalMin,
      billableMinutes: billableMin,
      count: weekEntries.length,
      status,
      reviewNote: ts?.review_note ?? null,
    };
  });

  const selEnd = weekEnd(selectedWeek);
  const selectedEntries: EntryRow[] = allEntries
    .filter((e) => e.work_date >= selectedWeek && e.work_date <= selEnd)
    .map((e) => ({
      id: e.id,
      work_date: e.work_date,
      context: e.task_id
        ? `${e.tasks?.tickets?.ticket_no ? `${e.tasks.tickets.ticket_no} · ` : ""}${e.tasks?.title ?? "Task"}`
        : (e.projects?.name ?? "Project"),
      duration_minutes: e.duration_minutes,
      billable: e.billable,
      state: e.state,
    }));

  return (
    <TimesheetsView
      weeks={summaries}
      selectedWeek={selectedWeek}
      entries={selectedEntries}
    />
  );
}
