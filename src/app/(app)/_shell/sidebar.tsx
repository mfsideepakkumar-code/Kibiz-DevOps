"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  CalendarCheck,
  CalendarDays,
  ClipboardCheck,
  Clock,
  DollarSign,
  Inbox,
  LayoutDashboard,
  type LucideIcon,
  Settings,
  Ticket,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/roles";

type NavItem = { href: string; label: string; icon: LucideIcon; roles: Role[] };
type NavGroup = { heading: string; items: NavItem[] };

const ALL = ["developer", "project_lead", "manager", "admin"] as const;

const GROUPS: NavGroup[] = [
  {
    heading: "Work",
    items: [
      { href: "/my-day", label: "My Day", icon: CalendarDays, roles: [...ALL] },
      { href: "/tickets", label: "Tickets", icon: Ticket, roles: [...ALL] },
      { href: "/activities", label: "Activities", icon: Clock, roles: [...ALL] },
      { href: "/timesheets", label: "Timesheets", icon: CalendarCheck, roles: [...ALL] },
    ],
  },
  {
    heading: "Manage",
    items: [
      { href: "/team-day", label: "Team Day", icon: Users, roles: ["manager", "admin"] },
      { href: "/timesheet-review", label: "Reviews", icon: ClipboardCheck, roles: ["manager", "admin"] },
      { href: "/ops-queue", label: "Ops Queue", icon: Inbox, roles: ["manager", "admin"] },
    ],
  },
  {
    heading: "Insights",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["executive", "admin"] },
    ],
  },
  {
    heading: "Admin",
    items: [
      { href: "/admin", label: "Admin Home", icon: Settings, roles: ["admin"] },
      { href: "/admin/clients", label: "Clients & Projects", icon: Building2, roles: ["admin"] },
      { href: "/admin/pricing", label: "Client Pricing", icon: DollarSign, roles: ["admin"] },
    ],
  },
];

export function Sidebar({
  role,
  name,
  email,
}: {
  role: Role;
  name: string;
  email: string;
}) {
  const pathname = usePathname();
  const groups = GROUPS.map((g) => ({
    ...g,
    items: g.items.filter((i) => i.roles.includes(role)),
  })).filter((g) => g.items.length > 0);

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r bg-sidebar">
      <div className="flex h-14 items-center gap-2 border-b px-5">
        <span className="grid size-7 place-items-center rounded-md bg-primary text-xs font-medium text-primary-foreground">
          Ki
        </span>
        <span className="font-medium">KiBiz</span>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto p-3">
        {groups.map((group) => (
          <div key={group.heading} className="space-y-1">
            <p className="px-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {group.heading}
            </p>
            {group.items.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors",
                    active
                      ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/60",
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="border-t p-3">
        <div className="mb-2 px-2">
          <p className="truncate text-sm font-medium">{name}</p>
          <p className="truncate text-xs text-muted-foreground">{email}</p>
          <p className="text-xs capitalize text-muted-foreground">
            {role.replace("_", " ")}
          </p>
        </div>
        <form action="/auth/signout" method="post">
          <Button type="submit" variant="outline" size="sm" className="w-full">
            Sign out
          </Button>
        </form>
      </div>
    </aside>
  );
}
