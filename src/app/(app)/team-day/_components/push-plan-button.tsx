"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TaskOption } from "../../my-day/_components/add-to-plan";

import { pushPlanItem } from "../../my-day/actions";

export function PushPlanButton({
  userId,
  userName,
  date,
  tasks,
}: {
  userId: string;
  userName: string;
  date: string;
  tasks: TaskOption[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [taskId, setTaskId] = useState("");
  const [busy, setBusy] = useState(false);

  async function onPush() {
    if (!taskId) return;
    setBusy(true);
    try {
      const res = await pushPlanItem({ user_id: userId, task_id: taskId, date });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(`Pushed to ${userName}`);
      setOpen(false);
      setTaskId("");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          Push task
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Push a task to {userName}</DialogTitle>
          <DialogDescription>
            Adds an approved task to their plan for this day.
          </DialogDescription>
        </DialogHeader>
        <Select value={taskId} onValueChange={setTaskId}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select an approved task…" />
          </SelectTrigger>
          <SelectContent>
            {tasks.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <DialogFooter>
          <Button onClick={onPush} disabled={!taskId || busy}>
            {busy ? "Pushing…" : "Push task"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
