import Link from "next/link";

import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";
import type { Role } from "@/lib/roles";
import { getActiveTimer } from "@/lib/timer-queries";
import { TimerWidget } from "./_timer/timer-widget";

const NAV: { href: string; label: string; roles: Role[] }[] = [
  { href: "/my-day", label: "My Day", roles: ["developer", "project_lead", "manager", "admin"] },
  { href: "/tickets", label: "Tickets", roles: ["developer", "project_lead", "manager", "admin"] },
  { href: "/activities", label: "Activities", roles: ["developer", "project_lead", "manager", "admin"] },
  { href: "/timesheets", label: "Timesheets", roles: ["developer", "project_lead", "manager", "admin"] },
  { href: "/team-day", label: "Team Day", roles: ["manager", "admin"] },
  { href: "/timesheet-review", label: "Reviews", roles: ["manager", "admin"] },
  { href: "/ops-queue", label: "Ops Queue", roles: ["manager", "admin"] },
  { href: "/dashboard", label: "Dashboard", roles: ["executive", "admin"] },
  { href: "/admin", label: "Admin", roles: ["admin"] },
];

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  const items = user ? NAV.filter((n) => n.roles.includes(user.role)) : [];
  const activeTimer = user ? await getActiveTimer() : null;

  return (
    <div className="min-h-svh">
      <header className="flex items-center justify-between border-b px-6 py-3">
        <nav className="flex items-center gap-1">
          <span className="mr-3 font-medium">KiBiz</span>
          {items.map((n) => (
            <Button key={n.href} asChild variant="ghost" size="sm">
              <Link href={n.href}>{n.label}</Link>
            </Button>
          ))}
        </nav>
        <div className="flex items-center gap-4">
          <TimerWidget timer={activeTimer} />
          <span className="text-sm text-muted-foreground">
            {user?.name} · {user?.role}
          </span>
          <form action="/auth/signout" method="post">
            <Button type="submit" variant="outline" size="sm">
              Sign out
            </Button>
          </form>
        </div>
      </header>
      <main className="p-6">{children}</main>
    </div>
  );
}
