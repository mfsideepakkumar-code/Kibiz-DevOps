// Live RBAC verification against the dev database (security.md end-of-phase
// gate: per-role API field audit). Signs in as the __rbac test users and
// asserts row- and column-level access. Usage:
//   node scripts/verify-rbac.mjs <devPassword>
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const envFile = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
const env = (key) => envFile.match(new RegExp(`^${key}=(.+)$`, "m"))?.[1]?.trim();

const url = env("NEXT_PUBLIC_SUPABASE_URL");
const anonKey = env("NEXT_PUBLIC_SUPABASE_ANON_KEY");
const devPassword = process.argv[2];
if (!devPassword) {
  console.error("usage: node scripts/verify-rbac.mjs <devPassword>");
  process.exit(1);
}

let failures = 0;
const check = (label, ok, detail = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures += 1;
};

// anonymous: everything denied
const anon = createClient(url, anonKey, { auth: { persistSession: false } });
{
  const { data } = await anon.from("users").select("id");
  check("anon cannot read users", !data || data.length === 0);
  const { data: cfg } = await anon.from("company_config").select("company_name");
  check("anon cannot read company_config", !cfg || cfg.length === 0);
}

// developer role
const dev = createClient(url, anonKey, { auth: { persistSession: false } });
{
  const { error: signInErr } = await dev.auth.signInWithPassword({
    email: "__rbac.dev@test.local",
    password: devPassword,
  });
  check("developer can sign in", !signInErr, signInErr?.message);

  // Column-level grants make select(*) fail on protected tables — app code
  // must use explicit column lists (auth.ts does). Verify both behaviours.
  const { data: me, error: meErr } = await dev
    .from("users")
    .select("id, name, email, role, is_active")
    .eq("email", "__rbac.dev@test.local")
    .single();
  check("developer reads own users row (explicit columns)", !!me, meErr?.message);

  const { error: starErr } = await dev.from("users").select("*").limit(1);
  check("users select(*) rejected (cost column not readable)", !!starErr);

  const { data: pricing } = await dev.from("client_pricing").select("client_id");
  check("developer cannot read client_pricing", !pricing || pricing.length === 0);

  const { data: inv } = await dev.from("invoices").select("id");
  check("developer cannot read invoices", !inv || inv.length === 0);

  const { error: colErr } = await dev.from("users").select("cost_rate_per_hour");
  check("explicit cost_rate_per_hour select is rejected", !!colErr);

  const { error: costProdErr } = await dev.from("products").select("cost_price");
  check("explicit products.cost_price select is rejected", !!costProdErr);

  const { data: cats } = await dev.from("categories").select("name");
  check("developer reads categories (reference data)", (cats?.length ?? 0) > 0);

  const { error: kpiErr } = await dev.from("v_executive_kpis").select("*");
  check("developer cannot read v_executive_kpis", !!kpiErr);

  const { data: auditRows } = await dev.from("audit_logs").select("id").limit(1);
  check("developer cannot read audit_logs", !auditRows || auditRows.length === 0);

  await dev.auth.signOut();
}

console.log(failures === 0 ? "\nALL RBAC CHECKS PASSED" : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
