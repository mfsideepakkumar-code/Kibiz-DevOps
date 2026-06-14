"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusBadge } from "@/components/kit/status-badge";
import { statusLabel } from "@/components/kit/status-variant";

// Shows the current status and a menu of allowed transitions. Used for both
// tickets and tasks; the caller supplies the allowed targets (from the
// lifecycle helpers) and the server action.
export function WorkStatusControl({
  current,
  transitions,
  action,
}: {
  current: string;
  transitions: string[];
  action: (to: string) => Promise<{ ok: boolean; error?: string }>;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function choose(to: string) {
    start(async () => {
      const res = await action(to);
      if (!res.ok) {
        toast.error(res.error ?? "Could not change status");
        return;
      }
      toast.success(`Moved to ${statusLabel(to)}`);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-2">
      <StatusBadge status={current} />
      {transitions.length > 0 ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" disabled={pending}>
              Change status
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {transitions.map((t) => (
              <DropdownMenuItem key={t} onClick={() => choose(t)}>
                {statusLabel(t)}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
    </div>
  );
}
