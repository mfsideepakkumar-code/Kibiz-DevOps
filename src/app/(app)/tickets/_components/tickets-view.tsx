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
import { EMPTY_VALUE, formatDate } from "@/lib/format";
import { TICKET_STATUSES } from "@/lib/work-lifecycle";

import { BugForm } from "./bug-form";
import { TicketForm, type Option, type SubOption } from "./ticket-form";

export type TicketRow = {
  id: string;
  ticket_no: string | null;
  title: string;
  status: string;
  priority: string | null;
  project_name: string | null;
  category_name: string | null;
  updated_at: string;
};

export function TicketsView({
  rows,
  projects,
  subProjects,
  categories,
  profitCenters,
  isManager,
  statusFilter,
}: {
  rows: TicketRow[];
  projects: Option[];
  subProjects: SubOption[];
  categories: Option[];
  profitCenters: Option[];
  isManager: boolean;
  statusFilter: string;
}) {
  const router = useRouter();

  function onStatusChange(value: string) {
    router.push(value === "all" ? "/tickets" : `/tickets?status=${value}`);
  }

  const columns: Column<TicketRow>[] = [
    {
      key: "ticket_no",
      header: "Ticket",
      cell: (r) => r.ticket_no ?? EMPTY_VALUE,
    },
    { key: "title", header: "Title", cell: (r) => r.title },
    {
      key: "project",
      header: "Project",
      cell: (r) => r.project_name ?? EMPTY_VALUE,
    },
    {
      key: "category",
      header: "Category",
      cell: (r) => r.category_name ?? EMPTY_VALUE,
    },
    {
      key: "priority",
      header: "Priority",
      cell: (r) => (r.priority ? r.priority.toUpperCase() : EMPTY_VALUE),
    },
    {
      key: "status",
      header: "Status",
      cell: (r) => <StatusBadge status={r.status} />,
    },
    {
      key: "updated",
      header: "Updated",
      align: "right",
      cell: (r) => formatDate(r.updated_at),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Tickets"
        description="Work items across projects. Developer-created tickets require approval (Gate 1)."
        actions={
          <>
            <BugForm
              projects={projects}
              trigger={
                <Button variant="outline" size="sm">
                  Report bug
                </Button>
              }
            />
            <TicketForm
              projects={projects}
              subProjects={subProjects}
              categories={categories}
              profitCenters={profitCenters}
              isManager={isManager}
              trigger={<Button size="sm">New ticket</Button>}
            />
          </>
        }
      />
      <div className="mb-3 w-48">
        <Select value={statusFilter} onValueChange={onStatusChange}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {TICKET_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s.replaceAll("_", " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(r) => r.id}
        onRowClick={(r) => router.push(`/tickets/${r.id}`)}
        emptyTitle="No tickets"
        emptyDescription="Create a ticket to get started."
      />
    </div>
  );
}
