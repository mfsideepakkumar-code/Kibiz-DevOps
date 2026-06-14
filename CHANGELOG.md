# Changelog

- 2026-06-14 · P1-06 · Client Pricing screen (/admin/pricing, admin-only): per-field rate editor with per-field last-changed audit, append-only price history, 90-day stale warning + mark-reviewed. Append-only enforcement verified live.

- 2026-06-14 · P1-05 · Single-screen admin (Clients & Projects): left client nav, vertical tabs (Overview/Projects+sub-projects/Contacts/Pricing summary), right info+docs sidebar; slide-over CRUD forms (RHF+Zod) via admin-gated server actions; composite-FK-safe sub-projects. RLS insert policies verified live.

- 2026-06-13 · P1-04 · Design system: shared formatters (format.ts), semantic status tokens + StatusBadge, DataTable with mandatory loading/empty/error states, PageHeader, SubmitButton, React Query provider, full shadcn primitive set.

- 2026-06-12 · P1-03 · Auth & RBAC: RLS policies per security.md (migrations 0011–0012), column-level cost-field protection, signup trigger (inactive by default), Next.js middleware + login + role landings + server-side role checks; verified live (12 RBAC checks).

- 2026-06-12 · P1-02 · Schema migrations 0001–0010 applied (41 tables, composite subproject FK, audit/append-only/immutable triggers, RLS on all tables, reporting views) + generated TS types.
- 2026-06-12 · P1-01 · Repo scaffold: Next.js App Router + TS + Tailwind + shadcn/ui, Supabase CLI init, stack deps, .agent/ workspace, CI with TASKS.md guard.
