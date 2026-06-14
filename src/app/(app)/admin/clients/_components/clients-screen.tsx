"use client";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/kit/data-state";

import { ClientForm } from "./client-form";
import { ClientInfoSidebar } from "./client-info-sidebar";
import { ClientNav } from "./client-nav";
import { ClientWorkspace } from "./client-workspace";
import type { ClientDetail, ClientListItem } from "../types";

// Single-screen admin (FR-17.10 / ADR-025): left sidebar nav, vertical tabs in
// the workspace, right contextual sidebar. No page-hops, no modal chains —
// client selection is a soft search-param navigation, edits are slide-overs.
export function ClientsScreen({
  clients,
  selectedId,
  detail,
}: {
  clients: ClientListItem[];
  selectedId: string | null;
  detail: ClientDetail | null;
}) {
  if (clients.length === 0) {
    return (
      <EmptyState
        title="No clients yet"
        description="Create the first client to start managing projects and pricing."
        action={
          <ClientForm trigger={<Button size="sm">New client</Button>} />
        }
      />
    );
  }

  return (
    <div className="flex h-[calc(100svh-7rem)] gap-6">
      <ClientNav clients={clients} selectedId={selectedId} />
      <div className="min-w-0 flex-1 overflow-y-auto">
        {detail ? (
          <ClientWorkspace detail={detail} />
        ) : (
          <EmptyState
            title="Select a client"
            description="Choose a client from the list to view details."
          />
        )}
      </div>
      {detail ? <ClientInfoSidebar detail={detail} /> : null}
    </div>
  );
}
