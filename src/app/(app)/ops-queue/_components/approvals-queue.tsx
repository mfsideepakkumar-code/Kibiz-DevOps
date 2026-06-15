"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/kit/data-state";
import { StatusBadge } from "@/components/kit/status-badge";
import { EMPTY_VALUE, formatDate } from "@/lib/format";
import {
  approveTask,
  approveTicket,
  rejectTicket,
  returnTask,
  triageBug,
} from "../../tickets/actions";
import { BillingQueue, type BillingItem } from "./billing-queue";
import { RejectDialog } from "./reject-dialog";

export type PendingTicket = {
  id: string;
  ticket_no: string | null;
  title: string;
  priority: string | null;
  created_at: string;
  project_name: string | null;
  category_name: string | null;
  created_by_name: string;
};
export type PendingTask = {
  id: string;
  title: string;
  created_at: string;
  ticket_label: string;
  created_by_name: string;
};
export type PendingBug = {
  id: string;
  title: string;
  created_at: string;
  project_name: string | null;
  reporter_name: string;
};

export function ApprovalsQueue({
  tickets,
  tasks,
  bugs,
  billing,
  aiConfigured,
}: {
  tickets: PendingTicket[];
  tasks: PendingTask[];
  bugs: PendingBug[];
  billing: BillingItem[];
  aiConfigured: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const total = tickets.length + tasks.length + bugs.length;

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

  return (
    <Tabs defaultValue="approvals">
      <TabsList>
        <TabsTrigger value="approvals">
          Pending Approvals{total ? ` (${total})` : ""}
        </TabsTrigger>
        <TabsTrigger value="risk">Risk Monitoring</TabsTrigger>
        <TabsTrigger value="billing">
          Billing Queue{billing.length ? ` (${billing.length})` : ""}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="approvals" className="space-y-4 pt-4">
        {total === 0 ? (
          <EmptyState
            title="Nothing waiting for approval"
            description="Developer-created tickets, tasks, and bugs appear here for review."
          />
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Tickets ({tickets.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {tickets.length === 0 ? (
                  <p className="text-sm text-muted-foreground">None.</p>
                ) : (
                  tickets.map((t) => (
                    <Row
                      key={t.id}
                      title={`${t.ticket_no ? `${t.ticket_no} · ` : ""}${t.title}`}
                      meta={`${t.project_name ?? EMPTY_VALUE} · ${t.category_name ?? EMPTY_VALUE} · by ${t.created_by_name} · ${formatDate(t.created_at)}`}
                      badge={t.priority}
                      actions={
                        <>
                          <Button
                            size="sm"
                            disabled={pending}
                            onClick={() =>
                              run(() => approveTicket(t.id), "Ticket approved")
                            }
                          >
                            Approve
                          </Button>
                          <RejectDialog
                            title="Reject ticket"
                            description={t.title}
                            confirmLabel="Reject"
                            onConfirm={async (note) => {
                              const res = await rejectTicket(t.id, note);
                              if (!res.ok) {
                                toast.error(res.error);
                                return;
                              }
                              toast.success("Ticket rejected");
                              router.refresh();
                            }}
                          />
                        </>
                      }
                    />
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tasks ({tasks.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {tasks.length === 0 ? (
                  <p className="text-sm text-muted-foreground">None.</p>
                ) : (
                  tasks.map((t) => (
                    <Row
                      key={t.id}
                      title={t.title}
                      meta={`${t.ticket_label} · by ${t.created_by_name} · ${formatDate(t.created_at)}`}
                      actions={
                        <>
                          <Button
                            size="sm"
                            disabled={pending}
                            onClick={() =>
                              run(() => approveTask(t.id), "Task approved")
                            }
                          >
                            Approve
                          </Button>
                          <RejectDialog
                            title="Return task"
                            description={t.title}
                            confirmLabel="Return"
                            onConfirm={async (note) => {
                              const res = await returnTask(t.id, note);
                              if (!res.ok) {
                                toast.error(res.error);
                                return;
                              }
                              toast.success("Task returned");
                              router.refresh();
                            }}
                          />
                        </>
                      }
                    />
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Bugs ({bugs.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {bugs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">None.</p>
                ) : (
                  bugs.map((b) => (
                    <Row
                      key={b.id}
                      title={b.title}
                      meta={`${b.project_name ?? EMPTY_VALUE} · by ${b.reporter_name} · ${formatDate(b.created_at)}`}
                      actions={
                        <>
                          <Button
                            size="sm"
                            disabled={pending}
                            onClick={() =>
                              run(
                                () => triageBug(b.id, "approved"),
                                "Bug approved",
                              )
                            }
                          >
                            Approve
                          </Button>
                          <RejectDialog
                            title="Reject bug"
                            description={b.title}
                            confirmLabel="Reject"
                            onConfirm={async (note) => {
                              const res = await triageBug(b.id, "rejected", note);
                              if (!res.ok) {
                                toast.error(res.error);
                                return;
                              }
                              toast.success("Bug rejected");
                              router.refresh();
                            }}
                          />
                        </>
                      }
                    />
                  ))
                )}
              </CardContent>
            </Card>
          </>
        )}
      </TabsContent>

      <TabsContent value="risk" className="pt-4">
        <EmptyState
          title="Risk Monitoring"
          description="Hour-block, credit-exposure, and KiCare risk signals land here in Phase 2."
        />
      </TabsContent>
      <TabsContent value="billing" className="pt-4">
        <BillingQueue items={billing} aiConfigured={aiConfigured} />
      </TabsContent>
    </Tabs>
  );
}

function Row({
  title,
  meta,
  badge,
  actions,
}: {
  title: string;
  meta: string;
  badge?: string | null;
  actions: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-md border px-3 py-2">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium">{title}</span>
          {badge ? <StatusBadge status={badge} label={badge.toUpperCase()} /> : null}
        </div>
        <p className="truncate text-xs text-muted-foreground">{meta}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">{actions}</div>
    </div>
  );
}
