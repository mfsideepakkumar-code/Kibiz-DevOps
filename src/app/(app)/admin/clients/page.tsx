import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

import { ClientsScreen } from "./_components/clients-screen";
import type {
  ClientDetail,
  ClientListItem,
  ProjectWithSubProjects,
} from "./types";

export const metadata = { title: "Clients & Projects · KiBiz" };

async function loadDetail(
  supabase: Awaited<ReturnType<typeof createClient>>,
  clientId: string,
): Promise<ClientDetail | null> {
  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("id", clientId)
    .single();
  if (!client) return null;

  const [{ data: projects }, { data: contacts }, { data: pricing }] =
    await Promise.all([
      supabase
        .from("projects")
        .select("*, sub_projects(*)")
        .eq("client_id", clientId)
        .order("name"),
      supabase
        .from("client_contacts")
        .select("*")
        .eq("client_id", clientId)
        .order("is_primary", { ascending: false })
        .order("name"),
      supabase
        .from("client_pricing")
        .select("*")
        .eq("client_id", clientId)
        .maybeSingle(),
    ]);

  return {
    client,
    projects: (projects ?? []) as ProjectWithSubProjects[],
    contacts: contacts ?? [],
    pricing: pricing ?? null,
  };
}

export default async function ClientsAndProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string }>;
}) {
  await requireRole("admin");
  const { client: selectedId } = await searchParams;
  const supabase = await createClient();

  const { data: clientsData } = await supabase
    .from("clients")
    .select("id, name, engagement_model, is_active")
    .order("name");
  const clients: ClientListItem[] = clientsData ?? [];

  const resolvedId =
    selectedId && clients.some((c) => c.id === selectedId)
      ? selectedId
      : (clients[0]?.id ?? null);

  const detail = resolvedId ? await loadDetail(supabase, resolvedId) : null;

  return (
    <ClientsScreen
      clients={clients}
      selectedId={resolvedId}
      detail={detail}
    />
  );
}
