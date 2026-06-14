"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/kit/status-badge";
import { EMPTY_VALUE } from "@/lib/format";
import { engagementLabel } from "@/lib/admin-enums";

import type { ClientDetail } from "../types";

export function ClientInfoSidebar({ detail }: { detail: ClientDetail }) {
  const { client, projects, contacts } = detail;
  const subProjectCount = projects.reduce(
    (n, p) => n + p.sub_projects.length,
    0,
  );

  return (
    <aside className="w-72 shrink-0 space-y-4 border-l pl-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Client info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <Row label="Status">
            <StatusBadge
              status={client.is_active ? "active" : "archived"}
              label={client.is_active ? "Active" : "Inactive"}
            />
          </Row>
          <Row label="Engagement">
            {engagementLabel(client.engagement_model)}
          </Row>
          <Row label="Industry">{client.industry ?? EMPTY_VALUE}</Row>
          <Row label="FM client ID">{client.fm_client_id ?? EMPTY_VALUE}</Row>
          <Row label="Projects">{projects.length}</Row>
          <Row label="Sub-projects">{subProjectCount}</Row>
          <Row label="Contacts">{contacts.length}</Row>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Document storage</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Client document storage attaches here. Storage buckets and uploads
            ship in a later task.
          </p>
        </CardContent>
      </Card>
    </aside>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span>{children}</span>
    </div>
  );
}
