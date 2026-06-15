"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/kit/data-state";
import { PageHeader } from "@/components/kit/page-header";
import { StatusBadge } from "@/components/kit/status-badge";
import { formatDate, formatHours } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { TaskOption } from "../../my-day/_components/add-to-plan";

import { PushPlanButton } from "./push-plan-button";

export type TeamRow = {
  user_id: string;
  name: string;
  capacity_hours: number;
  planned_minutes: number;
  actual_minutes: number;
};

function shiftDate(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function TeamDayView({
  date,
  today,
  rows,
  tasks,
}: {
  date: string;
  today: string;
  rows: TeamRow[];
  tasks: TaskOption[];
}) {
  return (
    <div className="space-y-4">
      <PageHeader
        title="Team Day"
        description={formatDate(date)}
        actions={
          <div className="flex items-center gap-1">
            <Button asChild variant="outline" size="sm">
              <Link href={`/team-day?date=${shiftDate(date, -1)}`}>← Prev</Link>
            </Button>
            <Button asChild variant="outline" size="sm" disabled={date === today}>
              <Link href="/team-day">Today</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href={`/team-day?date=${shiftDate(date, 1)}`}>Next →</Link>
            </Button>
          </div>
        }
      />

      {rows.length === 0 ? (
        <EmptyState title="No developers" description="No active developers to plan." />
      ) : (
        <Card>
          <CardContent className="divide-y pt-6">
            {rows.map((r) => {
              const capMin = r.capacity_hours * 60;
              const plannedPct = capMin > 0 ? Math.min(100, (r.planned_minutes / capMin) * 100) : 0;
              const actualPct = capMin > 0 ? Math.min(100, (r.actual_minutes / capMin) * 100) : 0;
              const overbooked = r.planned_minutes > capMin;
              const noPlan = r.planned_minutes === 0;
              return (
                <div key={r.user_id} className="flex items-center gap-4 py-3">
                  <div className="w-40 shrink-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium">{r.name}</span>
                      {overbooked ? <StatusBadge status="warning" label="Overbooked" /> : null}
                      {noPlan ? <StatusBadge status="draft" label="No plan" /> : null}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      cap {r.capacity_hours}h
                    </span>
                  </div>

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn("absolute inset-y-0 left-0 rounded-full bg-info/40")}
                        style={{ width: `${plannedPct}%` }}
                      />
                      <div
                        className={cn("absolute inset-y-0 left-0 rounded-full bg-success")}
                        style={{ width: `${actualPct}%` }}
                      />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      planned{" "}
                      <span className={cn("tabular-nums", overbooked && "text-warning")}>
                        {formatHours(r.planned_minutes)}h
                      </span>{" "}
                      · logged{" "}
                      <span className="tabular-nums">{formatHours(r.actual_minutes)}h</span>
                    </div>
                  </div>

                  <div className="shrink-0">
                    <PushPlanButton
                      userId={r.user_id}
                      userName={r.name}
                      date={date}
                      tasks={tasks}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
