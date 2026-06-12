import "server-only";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { roleLandingPath, type Role } from "@/lib/roles";

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

// Single source for "who is calling" on the server. Reads the users row via
// the caller's own session (RLS applies).
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("users")
    .select("id, name, email, role, is_active")
    .eq("id", user.id)
    .single();
  if (!data || !data.is_active) return null;

  return {
    id: data.id,
    name: data.name,
    email: data.email,
    role: data.role as Role,
  };
}

// Server-side role gate for pages and API routes (security.md: every route
// checks role server-side before any data access). Redirects rather than
// rendering for page usage.
export async function requireRole(...allowed: Role[]): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!allowed.includes(user.role)) redirect(roleLandingPath(user.role));
  return user;
}
