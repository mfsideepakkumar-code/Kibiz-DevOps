"use client";

import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { refreshExecutiveKpis } from "../actions";

export function RefreshKpisButton() {
  const router = useRouter();
  const [pending, start] = useTransition();

  function onClick() {
    start(async () => {
      const res = await refreshExecutiveKpis();
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(res.message ?? "Refreshed");
      router.refresh();
    });
  }

  return (
    <Button size="sm" variant="outline" disabled={pending} onClick={onClick}>
      <RefreshCw className={pending ? "animate-spin" : undefined} />
      {pending ? "Refreshing…" : "Refresh"}
    </Button>
  );
}
