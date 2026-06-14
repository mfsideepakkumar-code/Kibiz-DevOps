"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { engagementLabel } from "@/lib/admin-enums";

import { ClientForm } from "./client-form";
import type { ClientListItem } from "../types";

export function ClientNav({
  clients,
  selectedId,
}: {
  clients: ClientListItem[];
  selectedId: string | null;
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((c) => c.name.toLowerCase().includes(q));
  }, [clients, query]);

  return (
    <aside className="flex w-64 shrink-0 flex-col gap-3 border-r pr-4">
      <ClientForm
        trigger={
          <Button size="sm" className="w-full">
            New client
          </Button>
        }
      />
      <Input
        placeholder="Search clients…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <nav className="flex-1 space-y-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="px-2 py-6 text-center text-sm text-muted-foreground">
            No clients match.
          </p>
        ) : (
          filtered.map((c) => (
            <Link
              key={c.id}
              href={`/admin/clients?client=${c.id}`}
              scroll={false}
              className={cn(
                "block rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted",
                c.id === selectedId && "bg-muted font-medium",
              )}
            >
              <span className="flex items-center justify-between gap-2">
                <span className="truncate">{c.name}</span>
                {!c.is_active ? (
                  <span className="text-xs text-muted-foreground">inactive</span>
                ) : null}
              </span>
              <span className="text-xs text-muted-foreground">
                {engagementLabel(c.engagement_model)}
              </span>
            </Link>
          ))
        )}
      </nav>
    </aside>
  );
}
