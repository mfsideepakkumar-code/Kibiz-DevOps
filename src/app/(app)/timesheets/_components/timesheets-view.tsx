"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/kit/data-table";
import { PageHeader } from "@/components/kit/page-header";
import { StatusBadge } from "@/components/kit/status-badge";
import { formatDate, formatDuration, formatHours } from "@/lib/format";
import { cn } from "@/lib/utils";

import { submitTimesheet } from "../actions";

export type WeekSummary = {
  weekStart: string;
  weekEnd: string;
  totalMinutes: number;
  billableMinutes: number;
  count: number;
  status: string;
  reviewNote: string | null;
};
export type EntryRow = {
  id: string;
  work_date: string;
  context: string;
  duration_minutes: number;
  billable: boolean;
  state: string;
};

const SUBMITTABLE = ["draft", "flagged"];

export function TimesheetsView({
  weeks,
  selectedWeek,
  entries,
}: {
  weeks: WeekSummary[];
  selectedWeek: string;
  entries: EntryRow[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const selected = weeks.find((w) => w.weekStart === selectedWeek);
  const totalMin = entries.reduce((n, e) => n + e.duration_minutes, 0);
  const billableMin = entries
    .filter((e) => e.billable)
    .reduce((n, e) => n + e.duration_minutes, 0);
  const status = selected?.status ?? "empty";
  const canSubmit = SUBMITTABLE.includes(status) && entries.length > 0;

  function onSubmit() {
    start(async () => {
      const res = await submitTimesheet(selectedWeek);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(res.message ?? "Submitted");
      router.refresh();
    });
  }

  const columns: Column<EntryRow>[] = [
    { key: "date", header: "Date", cell: (e) => formatDate(e.work_date) },
    { key: "context", header: "Logged against", cell: (e) => e.context },
    {
      key: "duration",
      header: "Duration",
      align: "right",
      cell: (e) => formatDuration(e.duration_minutes),
    },
    {
      key: "billable",
      header: "Billable",
      cell: (e) => (
        <StatusBadge
          status={e.billable ? "approved" : "draft"}
          label={e.billable ? "Billable" : "Non-Billable"}
        />
      ),
    },
    { key: "state", header: "State", cell: (e) => <StatusBadge status={e.state} /> },
  ];

  return (
    <div>
      <PageHeader
        title="My Timesheets"
        description="Weekly Gate 2 submit / review cycle."
      />
      <div className="flex gap-6">
        {/* Recent weeks */}
        <aside className="w-64 shrink-0 space-y-1">
          {weeks.map((w) => (
            <Link
              key={w.weekStart}
              href={`/timesheets?week=${w.weekStart}`}
              scroll={false}
              className={cn(
                "block rounded-md border px-3 py-2 transition-colors hover:bg-muted",
                w.weekStart === selectedWeek && "border-primary bg-muted",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium">
                  {formatDate(w.weekStart)}
                </span>
                {w.status !== "empty" ? (
                  <StatusBadge status={w.status} />
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </div>
              <span className="text-xs text-muted-foreground tabular-nums">
                {formatHours(w.totalMinutes)}h · {w.count} entries
              </span>
            </Link>
          ))}
        </aside>

        {/* Selected week */}
        <div className="min-w-0 flex-1 space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-2">
              <div className="space-y-1">
                <CardTitle>
                  Week of {formatDate(selectedWeek)} –{" "}
                  {formatDate(selected?.weekEnd ?? selectedWeek)}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  <span className="tabular-nums">{formatHours(totalMin)}</span> h
                  total ·{" "}
                  <span className="tabular-nums">{formatHours(billableMin)}</span>{" "}
                  h billable · {entries.length} entries
                </p>
              </div>
              <div className="flex items-center gap-2">
                {status !== "empty" ? <StatusBadge status={status} /> : null}
                <Button onClick={onSubmit} disabled={!canSubmit || pending} size="sm">
                  {pending
                    ? "Submitting…"
                    : status === "flagged"
                      ? "Resubmit"
                      : "Submit timesheet"}
                </Button>
              </div>
            </CardHeader>
            {status === "flagged" && selected?.reviewNote ? (
              <CardContent>
                <div className="rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning">
                  Flagged: {selected.reviewNote}. Fix the flagged entries on the
                  Activities screen, then resubmit.
                </div>
              </CardContent>
            ) : null}
          </Card>

          <DataTable
            columns={columns}
            rows={entries}
            rowKey={(e) => e.id}
            emptyTitle="No time logged this week"
            emptyDescription="Log time on the Activities or My Day screen."
          />
        </div>
      </div>
    </div>
  );
}
