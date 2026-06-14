"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/kit/data-state";
import { PageHeader } from "@/components/kit/page-header";
import { EMPTY_VALUE } from "@/lib/format";
import {
  taskTransitions,
  ticketTransitions,
  type TaskStatus,
  type TicketStatus,
} from "@/lib/work-lifecycle";

import { setTaskStatus, setTicketStatus } from "../actions";
import { TaskForm } from "./task-form";
import { WorkStatusControl } from "./work-status-control";
import type { Option } from "./ticket-form";

export type DetailTicket = {
  id: string;
  ticket_no: string | null;
  title: string;
  description: string | null;
  status: string;
  priority: string | null;
  billing_type: string | null;
  project_name: string | null;
  sub_project_name: string | null;
  category_name: string | null;
};
export type DetailTask = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  assignee_name: string | null;
};

const APPROVED_TICKET = [
  "approved",
  "in_progress",
  "blocked",
  "done",
  "ready_to_bill",
];

export function TicketDetail({
  ticket,
  tasks,
  users,
  isManager,
}: {
  ticket: DetailTicket;
  tasks: DetailTask[];
  users: Option[];
  isManager: boolean;
}) {
  const autoApproved = isManager || APPROVED_TICKET.includes(ticket.status);

  return (
    <div className="space-y-4">
      <PageHeader
        title={`${ticket.ticket_no ? `${ticket.ticket_no} · ` : ""}${ticket.title}`}
        actions={
          <WorkStatusControl
            current={ticket.status}
            transitions={ticketTransitions(
              ticket.status as TicketStatus,
              isManager,
            )}
            action={(to) => setTicketStatus(ticket.id, to as TicketStatus)}
          />
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
            <Meta label="Project" value={ticket.project_name} />
            <Meta label="Sub-project" value={ticket.sub_project_name} />
            <Meta label="Category" value={ticket.category_name} />
            <Meta
              label="Priority"
              value={ticket.priority?.toUpperCase() ?? null}
            />
            <Meta
              label="Billing"
              value={
                ticket.billing_type === "billable"
                  ? "Billable"
                  : ticket.billing_type === "non_billable"
                    ? "Non-Billable"
                    : null
              }
            />
          </div>
          {ticket.description ? (
            <p className="whitespace-pre-wrap text-sm">{ticket.description}</p>
          ) : (
            <p className="text-sm text-muted-foreground">No description.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle>Tasks ({tasks.length})</CardTitle>
          <TaskForm
            ticketId={ticket.id}
            users={users}
            autoApproved={autoApproved}
            trigger={
              <Button size="sm" variant="outline">
                Add task
              </Button>
            }
          />
        </CardHeader>
        <CardContent className="space-y-2">
          {tasks.length === 0 ? (
            <EmptyState
              title="No tasks yet"
              description="Break this ticket into tasks to start logging work."
            />
          ) : (
            tasks.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between gap-4 rounded-md border px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{t.title}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {t.assignee_name ?? "Unassigned"}
                  </p>
                </div>
                <WorkStatusControl
                  current={t.status}
                  transitions={taskTransitions(
                    t.status as TaskStatus,
                    isManager,
                  )}
                  action={(to) => setTaskStatus(t.id, to as TaskStatus)}
                />
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Meta({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p>{value ?? EMPTY_VALUE}</p>
    </div>
  );
}
