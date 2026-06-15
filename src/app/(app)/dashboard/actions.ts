"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export type ActionResult =
  | { ok: true; message?: string }
  | { ok: false; error: string };

const EXEC_ROLES = ["executive", "admin"];

// Recompute v_executive_kpis (materialized). The matview is refreshed nightly
// by WF-008 (P1-15); this is the manual trigger for exec/admin. The refresh
// RPC is SECURITY DEFINER and revoked from API roles, so we call it via the
// service role after the server-side role check.
export async function refreshExecutiveKpis(): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user || !EXEC_ROLES.includes(user.role)) {
    return { ok: false, error: "Executive access required." };
  }
  const admin = createAdminClient();
  const { error } = await admin.rpc("fn_refresh_executive_kpis");
  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard");
  return { ok: true, message: "KPIs refreshed." };
}
