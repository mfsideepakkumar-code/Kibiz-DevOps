"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/kit/data-state";
import { StatusBadge } from "@/components/kit/status-badge";
import { EMPTY_VALUE, formatHours } from "@/lib/format";

import {
  approveBillingSummary,
  generateBillingSummaryAction,
  returnBillingSummary,
  saveBillingSummary,
} from "../billing-actions";
import { RejectDialog } from "./reject-dialog";

export type BillingItem = {
  ticket_id: string;
  ticket_no: string | null;
  title: string;
  project_name: string | null;
  total_minutes: number;
  billable_minutes: number;
  summary_text: string | null;
  internal_detail: string | null;
  summary_status: string | null; // null = no summary yet
  generated_by: string | null;
};

export function BillingQueue({
  items,
  aiConfigured,
}: {
  items: BillingItem[];
  aiConfigured: boolean;
}) {
  if (items.length === 0) {
    return (
      <EmptyState
        title="Nothing ready to bill"
        description="Tickets whose tasks are all done appear here for an AI billing summary."
      />
    );
  }
  return (
    <div className="space-y-3">
      {!aiConfigured ? (
        <div className="rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning">
          AI generation is off (no ANTHROPIC_API_KEY). You can still write and
          approve summaries manually.
        </div>
      ) : null}
      {items.map((item) => (
        <BillingCard key={item.ticket_id} item={item} aiConfigured={aiConfigured} />
      ))}
    </div>
  );
}

function BillingCard({
  item,
  aiConfigured,
}: {
  item: BillingItem;
  aiConfigured: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const hasSummary = !!item.summary_text;

  function run(fn: () => Promise<{ ok: boolean; error?: string; message?: string }>) {
    start(async () => {
      const res = await fn();
      if (!res.ok) {
        toast.error(res.error ?? "Action failed");
        return;
      }
      toast.success(res.message ?? "Done");
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2">
            {item.ticket_no ? `${item.ticket_no} · ` : ""}
            {item.title}
            {item.summary_status ? (
              <StatusBadge status={item.summary_status} />
            ) : (
              <StatusBadge status="pending" label="Needs summary" />
            )}
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            {item.project_name ?? EMPTY_VALUE} ·{" "}
            <span className="tabular-nums">{formatHours(item.total_minutes)}</span>h
            total ·{" "}
            <span className="tabular-nums">{formatHours(item.billable_minutes)}</span>h
            billable
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={pending || !aiConfigured}
            onClick={() => run(() => generateBillingSummaryAction(item.ticket_id))}
          >
            {hasSummary ? "Regenerate" : "Generate with AI"}
          </Button>
          <BillingEditForm item={item} />
        </div>
      </CardHeader>
      {hasSummary ? (
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">
              Client-facing summary
            </p>
            <p className="whitespace-pre-wrap text-sm">{item.summary_text}</p>
          </div>
          {item.internal_detail ? (
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">
                Internal (accounting only)
              </p>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                {item.internal_detail}
              </p>
            </div>
          ) : null}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              disabled={pending}
              onClick={() => run(() => approveBillingSummary(item.ticket_id))}
            >
              Approve · Ready to bill
            </Button>
            <RejectDialog
              title="Return summary"
              description={item.title}
              confirmLabel="Return"
              onConfirm={async (note) => {
                const res = await returnBillingSummary(item.ticket_id, note);
                if (!res.ok) {
                  toast.error(res.error);
                  return;
                }
                toast.success(res.message ?? "Returned");
                router.refresh();
              }}
            />
          </div>
        </CardContent>
      ) : null}
    </Card>
  );
}

function BillingEditForm({ item }: { item: BillingItem }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [summary, setSummary] = useState(item.summary_text ?? "");
  const [internal, setInternal] = useState(item.internal_detail ?? "");
  const [busy, setBusy] = useState(false);

  async function save() {
    if (!summary.trim()) {
      toast.error("Summary is required");
      return;
    }
    setBusy(true);
    try {
      const res = await saveBillingSummary({
        ticketId: item.ticket_id,
        summary_text: summary,
        internal_detail: internal,
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(res.message ?? "Saved");
      setOpen(false);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="sm" variant="ghost">
          Edit
        </Button>
      </SheetTrigger>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Edit billing summary</SheetTitle>
          <SheetDescription>
            Client-facing summary must not include rates, costs, or staff names.
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-4 px-4">
          <div className="space-y-2">
            <Label htmlFor="summary">Client-facing summary</Label>
            <Textarea
              id="summary"
              rows={5}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="internal">Internal detail (accounting only)</Label>
            <Textarea
              id="internal"
              rows={4}
              value={internal}
              onChange={(e) => setInternal(e.target.value)}
            />
          </div>
        </div>
        <SheetFooter>
          <Button onClick={save} disabled={busy}>
            {busy ? "Saving…" : "Save summary"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
