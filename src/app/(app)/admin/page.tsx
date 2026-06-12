import { requireRole } from "@/lib/auth";

// Placeholder landing — Admin Home summary ships alongside P1-05/P1-06.
export default async function AdminHomePage() {
  const user = await requireRole("admin");

  return (
    <div className="space-y-1">
      <h1 className="text-lg font-medium">Admin Home</h1>
      <p className="text-sm text-muted-foreground">
        Pricing staleness, sync errors, and security alerts land here. Signed
        in as {user.email}.
      </p>
    </div>
  );
}
