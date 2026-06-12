import { requireRole } from "@/lib/auth";

// Placeholder landing — the Goal Sheet ships with P1-10.
export default async function MyDayPage() {
  const user = await requireRole(
    "developer",
    "project_lead",
    "manager",
    "admin",
  );

  return (
    <div className="space-y-1">
      <h1 className="text-lg font-medium">My Day</h1>
      <p className="text-sm text-muted-foreground">
        Goal Sheet lands here (P1-10). Signed in as {user.email}.
      </p>
    </div>
  );
}
