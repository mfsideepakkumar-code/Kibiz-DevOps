export const ROLES = [
  "developer",
  "project_lead",
  "manager",
  "executive",
  "admin",
  "client",
] as const;

export type Role = (typeof ROLES)[number];

// Primary landing per role (prd.md §4: dev→My Day, mgr→Ops Queue,
// exec→Dashboard, admin→Admin Home). client is inert until C-1.
const LANDING: Record<Role, string> = {
  developer: "/my-day",
  project_lead: "/my-day",
  manager: "/ops-queue",
  executive: "/dashboard",
  admin: "/admin",
  client: "/portal-unavailable",
};

export function roleLandingPath(role: Role): string {
  return LANDING[role];
}

export function isRole(value: string | null | undefined): value is Role {
  return ROLES.includes(value as Role);
}
