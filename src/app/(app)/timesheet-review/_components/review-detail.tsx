"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/kit/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate, formatDuration, formatHours } from "@/lib/format";

import { approveTimesheet, flagTimesheet } from "../../timesheets/actions";

export type ReviewEntry = {
  id: string;
  work_date: string;
  context: string;
  duration_minutes: number;
  billable: boolean;
  state: string;
};

export function ReviewDetail({
  timesheetId,
  userName,
  weekStart,
  weekEnd,
  status,
  entries,
}: {
  timesheetId: string;
  userName: string;
  weekStart: string;
  weekEnd: string;
  status: string;
  entries: ReviewEntry[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [flagOpen, setFlagOpen] = useState(false);
  const [note, setNote] = useState("");

  const totalMin = entries.reduce((n, e) => n + e.duration_minutes, 0);
  const submittedEntries = entries.filter((e) => e.state === "submitted");
  const canReview = status === "submitted" || status === "flagged";

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function onApprove() {
    start(async () => {
      const res = await approveTimesheet(timesheetId);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(res.message ?? "Approved");
      router.refresh();
    });
  }

  async function onFlag() {
    const res = await flagTimesheet({
      timesheetId,
      entryIds: [...selected],
      note,
    });
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success(res.message ?? "Flagged");
    setFlagOpen(false);
    setNote("");
    setSelected(new Set());
    router.refresh();
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2">
        <div className="space-y-1">
          <CardTitle>
            {userName} · {formatDate(weekStart)} – {formatDate(weekEnd)}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            <span className="tabular-nums">{formatHours(totalMin)}</span> h ·{" "}
            {entries.length} entries
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={status} />
          {canReview ? (
            <>
              <Button
                size="sm"
                variant="outline"
                disabled={selected.size === 0}
                onClick={() => setFlagOpen(true)}
              >
                Flag selected ({selected.size})
              </Button>
              <Button size="sm" onClick={onApprove} disabled={pending}>
                {pending ? "Approving…" : "Approve"}
              </Button>
            </>
          ) : null}
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8" />
              <TableHead>Date</TableHead>
              <TableHead>Logged against</TableHead>
              <TableHead className="text-right">Duration</TableHead>
              <TableHead>Billable</TableHead>
              <TableHead>State</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((e) => (
              <TableRow key={e.id}>
                <TableCell>
                  {canReview && e.state === "submitted" ? (
                    <Checkbox
                      checked={selected.has(e.id)}
                      onCheckedChange={() => toggle(e.id)}
                      aria-label="Select entry to flag"
                    />
                  ) : null}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {formatDate(e.work_date)}
                </TableCell>
                <TableCell>{e.context}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatDuration(e.duration_minutes)}
                </TableCell>
                <TableCell>
                  <StatusBadge
                    status={e.billable ? "approved" : "draft"}
                    label={e.billable ? "Billable" : "Non-Billable"}
                  />
                </TableCell>
                <TableCell>
                  <StatusBadge status={e.state} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {canReview && submittedEntries.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            No submitted entries awaiting review.
          </p>
        ) : null}
      </CardContent>

      <Dialog open={flagOpen} onOpenChange={setFlagOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Flag {selected.size} entr{selected.size === 1 ? "y" : "ies"}</DialogTitle>
            <DialogDescription>
              The developer will see this note and can fix and resubmit.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="flag-note">Reason</Label>
            <Textarea
              id="flag-note"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="destructive" onClick={onFlag} disabled={!note.trim()}>
              Flag &amp; return
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
