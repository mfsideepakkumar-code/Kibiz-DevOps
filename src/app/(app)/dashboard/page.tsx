import { requireRole } from "@/lib/auth";

// Placeholder landing — the Executive Dashboard ships with P1-13.
export default async function DashboardPage() {
  const user = await requireRole("executive", "admin");

  return (
    <div className="space-y-1">
      <h1 className="text-lg font-medium">Executive Dashboard</h1>
      <p className="text-sm text-muted-foreground">
        KPI cards and trends land here (P1-13). Signed in as {user.email}.
      </p>
    </div>
  );
}
