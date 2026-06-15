"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
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
import { formatElapsed } from "@/lib/timer";
import type { ActiveTimer } from "@/lib/timer-queries";

import { stopTimer } from "./actions";

export function TimerWidget({ timer }: { timer: ActiveTimer | null }) {
  const router = useRouter();
  const [elapsed, setElapsed] = useState(0);
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);

  const startedAt = timer?.startedAt;
  useEffect(() => {
    if (!startedAt) return;
    const tick = () =>
      setElapsed((Date.now() - new Date(startedAt).getTime()) / 1000);
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  if (!timer) return null;

  const over12h = elapsed > 12 * 3600;

  async function onStop() {
    if (timer!.billable && !description.trim()) {
      toast.error("A description is required to stop a billable timer.");
      return;
    }
    setBusy(true);
    try {
      const res = await stopTimer({ description });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(res.message ?? "Time logged");
      setOpen(false);
      setDescription("");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-2 rounded-md border px-2 py-1">
      <span
        className={`size-2 rounded-full ${over12h ? "bg-warning" : "bg-success"}`}
        aria-hidden
      />
      <span className="hidden max-w-40 truncate text-xs text-muted-foreground sm:inline">
        {timer.label}
      </span>
      <span className="font-mono text-sm tabular-nums">
        {formatElapsed(elapsed)}
      </span>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        Stop
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Stop timer</DialogTitle>
            <DialogDescription>
              {timer.label} · {formatElapsed(elapsed)}
              {over12h ? " — over 12h, will be capped at 12h." : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="timer-desc">
              Description{timer.billable ? " (required — billable)" : " (optional)"}
            </Label>
            <Textarea
              id="timer-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button onClick={onStop} disabled={busy}>
              {busy ? "Stopping…" : "Stop & log"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
