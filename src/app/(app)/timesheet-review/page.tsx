import Link from "next/link";

import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/kit/data-state";
import { PageHeader } from "@/components/kit/page-header";
import { StatusBadge } from "@/components/kit/status-badge";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { weekEnd } from "@/lib/week";

import {
  ReviewDetail,
  type ReviewEntry,
} from "./_components/review-detail";

export const metadata = { title: "Timesheet Review · KiBiz" };

export default async function TimesheetReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  await requireRole("manager", "admin");
  const { id } = await searchParams;
  const supabase = await createClient();

  const { data: queueData } = await supabase
    .from("timesheets")
    .select("id, user_id, week_start, status, submitted_at, users(name)")
    .in("status", ["submitted", "flagged"])
    .order("submitted_at", { ascending: true });

  type QueueRow = NonNullable<typeof queueData>[number] & {
    users: { name: string } | null;
  };
  const queue = (queueData ?? []) as QueueRow[];

  const selectedId = id && queue.some((t) => t.id === id) ? id : (queue[0]?.id ?? null);
  const selected = queue.find((t) => t.id === selectedId) ?? null;

  let entries: ReviewEntry[] = [];
  if (selected) {
    const end = weekEnd(selected.week_start);
    const { data: e } = await supabase
      .from("time_entries")
      .select(
        "id, work_date, duration_minutes, billable, state, task_id, tasks(title, tickets(ticket_no)), projects(name)",
      )
      .eq("user_id", selected.user_id)
      .gte("work_date", selected.week_start)
      .lte("work_date", end)
      .neq("state", "void")
      .order("work_date");
    type EJoin = NonNullable<typeof e>[number] & {
      tasks: { title: string; tickets: { ticket_no: string | null } | null } | null;
      projects: { name: string } | null;
    };
    entries = ((e ?? []) as EJoin[]).map((row) => ({
      id: row.id,
      work_date: row.work_date,
      context: row.task_id
        ? `${row.tasks?.tickets?.ticket_no ? `${row.tasks.tickets.ticket_no} · ` : ""}${row.tasks?.title ?? "Task"}`
        : (row.projects?.name ?? "Project"),
      duration_minutes: row.duration_minutes,
      billable: row.billable,
      state: row.state,
    }));
  }

  return (
    <div>
      <PageHeader
        title="Timesheet Review"
        description="Gate 2 — approve submitted weeks or flag entries back to the developer."
      />
      {queue.length === 0 ? (
        <EmptyState
          title="Nothing to review"
          description="Submitted and flagged timesheets appear here."
        />
      ) : (
        <div className="flex gap-6">
          <aside className="w-64 shrink-0 space-y-1">
            {queue.map((t) => (
              <Link
                key={t.id}
                href={`/timesheet-review?id=${t.id}`}
                scroll={false}
                className={cn(
                  "block rounded-md border px-3 py-2 transition-colors hover:bg-muted",
                  t.id === selectedId && "border-primary bg-muted",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium">
                    {t.users?.name ?? "Unknown"}
                  </span>
                  <StatusBadge status={t.status} />
                </div>
                <span className="text-xs text-muted-foreground">
                  Week of {formatDate(t.week_start)}
                </span>
              </Link>
            ))}
          </aside>

          <div className="min-w-0 flex-1">
            {selected ? (
              <ReviewDetail
                timesheetId={selected.id}
                userName={selected.users?.name ?? "Unknown"}
                weekStart={selected.week_start}
                weekEnd={weekEnd(selected.week_start)}
                status={selected.status}
                entries={entries}
              />
            ) : (
              <EmptyState title="Select a timesheet" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
