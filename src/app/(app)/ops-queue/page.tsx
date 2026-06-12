import { requireRole } from "@/lib/auth";

// Placeholder landing — the Operations Queue ships with P1-07 (Gate 1 tab).
export default async function OpsQueuePage() {
  const user = await requireRole("manager", "admin");

  return (
    <div className="space-y-1">
      <h1 className="text-lg font-medium">Operations Queue</h1>
      <p className="text-sm text-muted-foreground">
        Pending Approvals · Risk Monitoring · Billing Queue land here (P1-07
        onward). Signed in as {user.email}.
      </p>
    </div>
  );
}
