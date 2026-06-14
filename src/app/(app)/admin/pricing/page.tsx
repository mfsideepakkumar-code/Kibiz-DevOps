import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/kit/data-state";
import { PageHeader } from "@/components/kit/page-header";

import { PricingNav } from "./_components/pricing-nav";
import { PricingEditor } from "./_components/pricing-editor";
import type { PricingRow } from "./pricing-shared";

export const metadata = { title: "Client Pricing · KiBiz" };

type ClientItem = { id: string; name: string; is_active: boolean };

export default async function ClientPricingPage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string }>;
}) {
  await requireRole("admin");
  const { client: selectedId } = await searchParams;
  const supabase = await createClient();

  const { data: clientsData } = await supabase
    .from("clients")
    .select("id, name, is_active")
    .order("name");
  const clients: ClientItem[] = clientsData ?? [];

  const resolvedId =
    selectedId && clients.some((c) => c.id === selectedId)
      ? selectedId
      : (clients[0]?.id ?? null);

  let pricing: PricingRow | null = null;
  let userMap: Record<string, string> = {};
  let clientName = "";

  if (resolvedId) {
    clientName = clients.find((c) => c.id === resolvedId)?.name ?? "";
    const [{ data: pricingData }, { data: users }] = await Promise.all([
      supabase
        .from("client_pricing")
        .select("*")
        .eq("client_id", resolvedId)
        .maybeSingle(),
      // admin can read users (id, name) — needed to resolve price_history actors
      supabase.from("users").select("id, name"),
    ]);
    pricing = pricingData ?? null;
    userMap = Object.fromEntries((users ?? []).map((u) => [u.id, u.name]));
  }

  return (
    <div>
      <PageHeader
        title="Client Pricing"
        description="Admin-only. Per-field values, change history, and 90-day review reminders."
      />
      {clients.length === 0 ? (
        <EmptyState
          title="No clients yet"
          description="Create a client on the Clients & Projects screen first."
        />
      ) : (
        <div className="flex h-[calc(100svh-9rem)] gap-6">
          <PricingNav clients={clients} selectedId={resolvedId} />
          <div className="min-w-0 flex-1 overflow-y-auto">
            {resolvedId ? (
              <PricingEditor
                clientId={resolvedId}
                clientName={clientName}
                pricing={pricing}
                userMap={userMap}
              />
            ) : (
              <EmptyState title="Select a client" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
