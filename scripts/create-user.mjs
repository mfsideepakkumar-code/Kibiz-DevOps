// Creates a platform user via the Supabase admin API (service role).
// Role goes into app_metadata (server-controlled) — the signup trigger
// copies it to public.users. Usage:
//   node scripts/create-user.mjs <email> <password> <role> [name]
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const ROLES = ["developer", "project_lead", "manager", "executive", "admin", "client"];

const envFile = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
const env = (key) => envFile.match(new RegExp(`^${key}=(.+)$`, "m"))?.[1]?.trim();

const [email, password, role, name] = process.argv.slice(2);
if (!email || !password || !ROLES.includes(role)) {
  console.error(`usage: node scripts/create-user.mjs <email> <password> <${ROLES.join("|")}> [name]`);
  process.exit(1);
}

const admin = createClient(env("NEXT_PUBLIC_SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), {
  auth: { persistSession: false },
});

const { data, error } = await admin.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  app_metadata: { role },
  user_metadata: name ? { name } : undefined,
});

if (error) {
  console.error(`failed: ${error.message}`);
  process.exit(1);
}

// The signup trigger creates the users row INACTIVE with role 'developer'
// (migration 0012 — app_metadata is not visible at insert time and self-
// signups must stay inert). Assign the real role and activate explicitly.
const { error: roleError } = await admin
  .from("users")
  .update({ role, is_active: true, ...(name ? { name } : {}) })
  .eq("id", data.user.id);

if (roleError) {
  console.error(`user created but role assignment failed: ${roleError.message}`);
  process.exit(1);
}
console.log(`created ${role} ${data.user.email} (${data.user.id})`);
