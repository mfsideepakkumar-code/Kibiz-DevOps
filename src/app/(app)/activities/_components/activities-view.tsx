"use client";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable, type Column } from "@/components/kit/data-table";
import { PageHeader } from "@/components/kit/page-header";
import { StatusBadge } from "@/components/kit/status-badge";
import { isOwnerEditable } from "@/lib/activity-rules";
import { EMPTY_VALUE, formatDate, formatDuration, formatHours } from "@/lib/format";

import {
  ActivityForm,
  type ProjectOption,
  type TaskOption,
} from "./activity-form";
import { DeleteActivityButton } from "./delete-activity-button";

export type ActivityRow = {
  id: string;
  work_date: string;
  context_label: string;
  has_task: boolean;
  duration_minutes: number;
  billable: boolean;
  state: string;
  description: string | null;
};

const TIME_ENTRY_STATES = [
  "draft",
  "submitted",
  "approved",
  "rejected",
  "billed",
  "void",
  "locked",
];

export function ActivitiesView({
  rows,
  tasks,
  projects,
  filters,
  canManage,
}: {
  rows: ActivityRow[];
  tasks: TaskOption[];
  projects: ProjectOption[];
  filters: { state: string; billable: string; from: string; to: string };
  canManage: boolean;
}) {
  const router = useRouter();

  function setParam(key: string, value: string) {
    const params = new URLSearchParams();
    const next = { ...filters, [key]: value };
    if (next.state !== "all") params.set("state", next.state);
    if (next.billable !== "all") params.set("billable", next.billable);
    if (next.from) params.set("from", next.from);
    if (next.to) params.set("to", next.to);
    const qs = params.toString();
    router.push(qs ? `/activities?${qs}` : "/activities");
  }

  const totalMinutes = rows.reduce((n, r) => n + r.duration_minutes, 0);
  const billableMinutes = rows
    .filter((r) => r.billable)
    .reduce((n, r) => n + r.duration_minutes, 0);

  const columns: Column<ActivityRow>[] = [
    { key: "date", header: "Date", cell: (r) => formatDate(r.work_date) },
    { key: "context", header: "Logged against", cell: (r) => r.context_label },
    {
      key: "duration",
      header: "Duration",
      align: "right",
      cell: (r) => formatDuration(r.duration_minutes),
    },
    {
      key: "billable",
      header: "Billable",
      cell: (r) => (
        <StatusBadge
          status={r.billable ? "approved" : "draft"}
          label={r.billable ? "Billable" : "Non-Billable"}
        />
      ),
    },
    { key: "state", header: "State", cell: (r) => <StatusBadge status={r.state} /> },
    {
      key: "description",
      header: "Description",
      cell: (r) => (
        <span className="line-clamp-1 max-w-xs text-muted-foreground">
          {r.description ?? EMPTY_VALUE}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      cell: (r) =>
        isOwnerEditable(r.state) ? (
          <div className="flex justify-end gap-1">
            <ActivityForm
              tasks={[]}
              projects={[]}
              activity={{
                id: r.id,
                work_date: r.work_date,
                duration_minutes: r.duration_minutes,
                billable: r.billable,
                description: r.description,
                context_label: r.context_label,
                has_task: r.has_task,
              }}
              trigger={
                <Button variant="ghost" size="sm">
                  Edit
                </Button>
              }
            />
            {r.state === "draft" ? <DeleteActivityButton id={r.id} /> : null}
          </div>
        ) : null,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Activities"
        description={
          canManage
            ? "All logged time. Duration-first; raw minutes stored."
            : "Your logged time. Duration-first; raw minutes stored."
        }
        actions={
          <ActivityForm
            tasks={tasks}
            projects={projects}
            trigger={<Button size="sm">Log time</Button>}
          />
        }
      />

      <div className="mb-3 flex flex-wrap items-end gap-3">
        <Filter label="State">
          <Select value={filters.state} onValueChange={(v) => setParam("state", v)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All states</SelectItem>
              {TIME_ENTRY_STATES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Filter>
        <Filter label="Billable">
          <Select
            value={filters.billable}
            onValueChange={(v) => setParam("billable", v)}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="true">Billable</SelectItem>
              <SelectItem value="false">Non-Billable</SelectItem>
            </SelectContent>
          </Select>
        </Filter>
        <Filter label="From">
          <input
            type="date"
            value={filters.from}
            onChange={(e) => setParam("from", e.target.value)}
            className="h-9 rounded-md border bg-transparent px-3 text-sm"
          />
        </Filter>
        <Filter label="To">
          <input
            type="date"
            value={filters.to}
            onChange={(e) => setParam("to", e.target.value)}
            className="h-9 rounded-md border bg-transparent px-3 text-sm"
          />
        </Filter>
        <div className="ml-auto text-sm text-muted-foreground">
          <span className="tabular-nums">{formatHours(totalMinutes)}</span> h
          total ·{" "}
          <span className="tabular-nums">{formatHours(billableMinutes)}</span> h
          billable
        </div>
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(r) => r.id}
        emptyTitle="No activities"
        emptyDescription="Log time against a task or project to get started."
      />
    </div>
  );
}

function Filter({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      {children}
    </div>
  );
}
