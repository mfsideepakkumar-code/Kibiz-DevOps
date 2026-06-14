import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/kit/page-header";
import { requireRole } from "@/lib/auth";

// Admin landing — open-issues summary (pricing staleness, sync errors, security
// alerts) ships alongside P1-06+. For now it links into the admin screens.
export default async function AdminHomePage() {
  const user = await requireRole("admin");

  return (
    <div>
      <PageHeader
        title="Admin Home"
        description={`Signed in as ${user.email}`}
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Clients &amp; Projects</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Manage clients, projects, sub-projects, engagement models, and
              contacts.
            </p>
            <Button asChild size="sm">
              <Link href="/admin/clients">Open</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
