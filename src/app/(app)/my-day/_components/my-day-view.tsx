"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/kit/page-header";
import { StatusBadge } from "@/components/kit/status-badge";
import { formatDate, formatDuration, formatHours } from "@/lib/format";
import { cn } from "@/lib/utils";
import { StartTimerButton } from "../../_timer/start-timer-button";

import { AddToPlan, type TaskOption } from "./add-to-plan";
import {
  carryGoalItem,
  dropGoalItem,
  setGoalStatus,
  setPlannedMinutes,
} from "../actions";

export type DayItem = {
  id: string;
  task_id: string | null;
  title: string;
  ticket_no: string | null;
  billable: boolean;
  planned_minutes: number;
  actual_minutes: number;
  status: string;
  pushed: boolean;
};
export type WeekDay = { date: string; plannedMinutes: number; actualMinutes: number };

function shiftDate(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function MyDayView({
  date,
  today,
  capacityHours,
  items,
  week,
  tasks,
  timerRunning,
  activeTimerTaskId,
}: {
  date: string;
  today: string;
  capacityHours: number;
  items: DayItem[];
  week: WeekDay[];
  tasks: TaskOption[];
  timerRunning: boolean;
  activeTimerTaskId: string | null;
}) {
  const plannedTotal = items.reduce((n, i) => n + i.planned_minutes, 0);
  const actualTotal = items.reduce((n, i) => n + i.actual_minutes, 0);
  const capacityMinutes = capacityHours * 60;
  const pct = capacityMinutes > 0 ? Math.min(100, (actualTotal / capacityMinutes) * 100) : 0;
  const overPlanned = plannedTotal > capacityMinutes;

  const inProgress = items.filter((i) => i.status === "in_progress");
  const planned = items.filter((i) => i.status === "planned");
  const done = items.filter((i) => i.status === "done");

  return (
    <div className="space-y-4">
      <PageHeader
        title="My Day"
        description={formatDate(date)}
        actions={
          <div className="flex items-center gap-1">
            <Button asChild variant="outline" size="sm">
              <Link href={`/my-day?date=${shiftDate(date, -1)}`}>← Prev</Link>
            </Button>
            <Button asChild variant="outline" size="sm" disabled={date === today}>
              <Link href="/my-day">Today</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href={`/my-day?date=${shiftDate(date, 1)}`}>Next →</Link>
            </Button>
          </div>
        }
      />

      {/* Capacity + progress */}
      <Card>
        <CardContent className="space-y-2 pt-6">
          <div className="flex items-center justify-between text-sm">
            <span>
              Goal: <span className="font-medium">{capacityHours}h</span>
            </span>
            <span className="text-muted-foreground">
              Planned{" "}
              <span className={cn("tabular-nums", overPlanned && "text-warning")}>
                {formatHours(plannedTotal)}h
              </span>{" "}
              · Logged{" "}
              <span className="tabular-nums">{formatHours(actualTotal)}h</span>
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-success" style={{ width: `${pct}%` }} />
          </div>
          {overPlanned ? (
            <p className="text-xs text-warning">
              Planned work exceeds your {capacityHours}h capacity.
            </p>
          ) : null}
        </CardContent>
      </Card>

      {/* Week strip */}
      <div className="grid grid-cols-7 gap-2">
        {week.map((d) => {
          const isCurrent = d.date === date;
          const ratio =
            capacityMinutes > 0 ? Math.min(100, (d.actualMinutes / capacityMinutes) * 100) : 0;
          return (
            <Link
              key={d.date}
              href={`/my-day?date=${d.date}`}
              className={cn(
                "rounded-md border p-2 text-center transition-colors hover:bg-muted",
                isCurrent && "border-primary bg-muted",
              )}
            >
              <div className="text-xs text-muted-foreground">
                {new Date(`${d.date}T00:00:00Z`).toLocaleDateString("en-CA", {
                  weekday: "short",
                  timeZone: "UTC",
                })}
              </div>
              <div className="mt-1 flex h-10 items-end justify-center">
                <div className="w-3 rounded bg-success" style={{ height: `${Math.max(4, ratio)}%` }} />
              </div>
              <div className="mt-1 text-xs tabular-nums">
                {formatHours(d.actualMinutes, 1)}h
              </div>
            </Link>
          );
        })}
      </div>

      <AddToPlan date={date} tasks={tasks} />

      <Bucket title="In Progress" items={inProgress} empty="Nothing in progress." {...{ date, timerRunning, activeTimerTaskId }} />
      <Bucket title="Planned" items={planned} empty="Nothing planned yet." {...{ date, timerRunning, activeTimerTaskId }} />
      <Bucket title="Done" items={done} empty="Nothing completed yet." {...{ date, timerRunning, activeTimerTaskId }} />
    </div>
  );
}

function Bucket({
  title,
  items,
  empty,
  date,
  timerRunning,
  activeTimerTaskId,
}: {
  title: string;
  items: DayItem[];
  empty: string;
  date: string;
  timerRunning: boolean;
  activeTimerTaskId: string | null;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {title} ({items.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">{empty}</p>
        ) : (
          items.map((i) => (
            <GoalItemRow
              key={i.id}
              item={i}
              date={date}
              timerRunning={timerRunning}
              isTimerTask={activeTimerTaskId === i.task_id}
            />
          ))
        )}
      </CardContent>
    </Card>
  );
}

function GoalItemRow({
  item,
  date,
  timerRunning,
  isTimerTask,
}: {
  item: DayItem;
  date: string;
  timerRunning: boolean;
  isTimerTask: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [planned, setPlanned] = useState(String(item.planned_minutes));
  const [dropOpen, setDropOpen] = useState(false);
  const [reason, setReason] = useState("");

  function run(fn: () => Promise<{ ok: boolean; error?: string }>, ok: string) {
    start(async () => {
      const res = await fn();
      if (!res.ok) {
        toast.error(res.error ?? "Action failed");
        return;
      }
      toast.success(ok);
      router.refresh();
    });
  }

  function savePlanned() {
    const m = Math.round(Number(planned));
    if (!Number.isFinite(m) || m === item.planned_minutes) return;
    run(() => setPlannedMinutes(item.id, m), "Plan updated");
  }

  async function onDrop() {
    const res = await dropGoalItem(item.id, reason);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success("Removed from plan");
    setDropOpen(false);
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border px-3 py-2">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium">
            {item.ticket_no ? `${item.ticket_no} · ` : ""}
            {item.title}
          </span>
          {item.billable ? <StatusBadge status="approved" label="Billable" /> : null}
          {item.pushed ? <StatusBadge status="info" label="Pushed" /> : null}
          {isTimerTask ? <StatusBadge status="in_progress" label="Timing" /> : null}
        </div>
        <p className="text-xs text-muted-foreground">
          Logged {formatDuration(item.actual_minutes)} of {formatDuration(item.planned_minutes)} planned
        </p>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-1">
        <Input
          type="number"
          min="0"
          step="5"
          value={planned}
          onChange={(e) => setPlanned(e.target.value)}
          onBlur={savePlanned}
          className="h-8 w-20"
          aria-label="Planned minutes"
        />
        {item.status !== "in_progress" && item.status !== "done" ? (
          <Button size="sm" variant="ghost" disabled={pending} onClick={() => run(() => setGoalStatus(item.id, "in_progress"), "Started")}>
            Start
          </Button>
        ) : null}
        {item.status !== "done" ? (
          <Button size="sm" variant="ghost" disabled={pending} onClick={() => run(() => setGoalStatus(item.id, "done"), "Marked done")}>
            Done
          </Button>
        ) : (
          <Button size="sm" variant="ghost" disabled={pending} onClick={() => run(() => setGoalStatus(item.id, "planned"), "Reopened")}>
            Reopen
          </Button>
        )}
        {item.task_id && item.status !== "done" ? (
          <StartTimerButton taskId={item.task_id} disabled={timerRunning} />
        ) : null}
        <Button size="sm" variant="ghost" disabled={pending} onClick={() => run(() => carryGoalItem(item.id, shiftDate(date, 1)), "Carried to next day")}>
          Carry
        </Button>
        {item.pushed ? (
          <Dialog open={dropOpen} onOpenChange={setDropOpen}>
            <Button size="sm" variant="ghost" onClick={() => setDropOpen(true)}>
              Drop
            </Button>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Drop pushed item</DialogTitle>
                <DialogDescription>
                  This item was assigned by a manager. A reason is required.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2">
                <Label htmlFor={`reason-${item.id}`}>Reason</Label>
                <Textarea
                  id={`reason-${item.id}`}
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>
              <DialogFooter>
                <Button variant="destructive" onClick={onDrop} disabled={!reason.trim()}>
                  Drop
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        ) : (
          <Button size="sm" variant="ghost" disabled={pending} onClick={() => run(() => dropGoalItem(item.id), "Removed from plan")}>
            Drop
          </Button>
        )}
      </div>
    </div>
  );
}
