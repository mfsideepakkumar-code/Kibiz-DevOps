"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { addGoalItem } from "../actions";

export type TaskOption = { id: string; label: string };

export function AddToPlan({
  date,
  tasks,
}: {
  date: string;
  tasks: TaskOption[];
}) {
  const router = useRouter();
  const [taskId, setTaskId] = useState("");
  const [pending, start] = useTransition();

  function onAdd() {
    if (!taskId) return;
    start(async () => {
      const res = await addGoalItem({ task_id: taskId, date });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Added to plan");
      setTaskId("");
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={taskId} onValueChange={setTaskId}>
        <SelectTrigger className="w-72">
          <SelectValue placeholder="Add an approved task to today…" />
        </SelectTrigger>
        <SelectContent>
          {tasks.length === 0 ? (
            <div className="px-2 py-1.5 text-sm text-muted-foreground">
              No approved tasks available
            </div>
          ) : (
            tasks.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.label}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
      <Button size="sm" onClick={onAdd} disabled={!taskId || pending}>
        Add
      </Button>
    </div>
  );
}
