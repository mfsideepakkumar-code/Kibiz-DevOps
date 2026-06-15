"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import { startTimer } from "./actions";

// Starts a timer for a task. Disabled when another timer is already running
// (the server also enforces one-timer-per-user).
export function StartTimerButton({
  taskId,
  disabled,
}: {
  taskId: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function onClick() {
    start(async () => {
      const res = await startTimer(taskId);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Timer started");
      router.refresh();
    });
  }

  return (
    <Button
      size="sm"
      variant="ghost"
      onClick={onClick}
      disabled={pending || disabled}
      title={disabled ? "Stop the running timer first" : "Start a timer"}
    >
      {pending ? "Starting…" : "Start timer"}
    </Button>
  );
}
