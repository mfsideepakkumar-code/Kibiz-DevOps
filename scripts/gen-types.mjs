// Regenerates src/lib/database.types.ts from the live database schema.
// Runs postgres-meta's one-shot generate mode directly — the same code path
// `supabase gen types` uses, minus the Docker requirement.
// Reads SUPABASE_DB_URL from .env.local. Run after every migration (CLAUDE.md rule 5).
import { readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const envFile = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
const match = envFile.match(/^SUPABASE_DB_URL=(.+)$/m);
if (!match) {
  console.error("SUPABASE_DB_URL not found in .env.local");
  process.exit(1);
}

const result = spawnSync(
  process.execPath,
  ["node_modules/@supabase/postgres-meta/dist/server/server.js"],
  {
    env: {
      ...process.env,
      PG_META_DB_URL: match[1].trim(),
      PG_META_GENERATE_TYPES: "typescript",
      PG_META_GENERATE_TYPES_INCLUDED_SCHEMAS: "public",
    },
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
  },
);

if (result.status !== 0 || !result.stdout?.startsWith("export type Json")) {
  console.error(result.stderr || "type generation produced no output");
  process.exit(1);
}

writeFileSync(new URL("../src/lib/database.types.ts", import.meta.url), result.stdout);
console.log("src/lib/database.types.ts regenerated");
