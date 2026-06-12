# KiBiz Platform

Internal time, billing, and engagement platform. Next.js App Router + TypeScript, Supabase (Postgres/Auth/Storage/RLS, no ORM), shadcn/ui + Tailwind, Inngest for background jobs.

## Before you write code

Read, in order: `CLAUDE.md` → `.agent/tasks/TASKS.md` → `.agent/spec.md` → `.agent/schema.md` → `.agent/security.md` → `.agent/prd.md` → `.agent/DECISIONS.md`.

## Getting started

```bash
pnpm install
cp .env.example .env.local   # fill in Supabase project values
pnpm dev
```

## Commands

| Command | What it does |
| --- | --- |
| `pnpm dev` | Start the dev server |
| `pnpm build` | Production build |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | TypeScript, no emit |
| `pnpm test` | Vitest |
| `pnpm exec supabase migration new <name>` | New schema migration (never raw ALTER) |
| `pnpm exec supabase gen types typescript` | Regenerate DB types (commit with the migration) |

## Conventions

- Schema changes only via Supabase CLI migrations; update `.agent/schema.md` and `.agent/MIGRATION-LINEAGE.md` in the same PR.
- CI fails if `src/` changes without a `.agent/tasks/TASKS.md` update.
- One task in progress per agent; one task = one PR.
