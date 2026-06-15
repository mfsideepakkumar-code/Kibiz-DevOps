# Changelog

- 2026-06-15 · P1-10 · Goal Sheet / My Day: developer day view (date nav, week strip, capacity/progress, In Progress/Planned/Done buckets, add task, planned-vs-actual, timer start, carry/drop) + manager Team Day grid (capacity bars, exception flags, push-planning). Migrations 0015 (users.daily_capacity_hours default 8) and 0016 (goal_items own-write security fix).

- 2026-06-15 · P1-09 · Web timers: start/stop server actions (one-per-user), stop finalizes into time_entries with start/end times, midnight split, 12h cap + manager notification, under-1-min discard, billable-requires-description; global header TimerWidget (live tick) + StartTimerButton on ticket tasks; computeTimerSegments/formatElapsed helpers + 7 tests.

- 2026-06-14 · P1-08 · Activities (time entries): /activities screen with duration-first logging (task or project-level), draft/rejected editing, own-draft delete, filters + totals; migration 0014 (period-lock guard with service-role override + own-draft delete policy); activity validation rules + 8 tests. Rules and lock guard verified live.

- 2026-06-14 · P1-07 · Tickets/tasks/bugs lifecycle + Gate 1: migration 0013 (ticket auto-numbering, DB Gate 1 status guard), lifecycle helpers, server actions, /tickets list+detail, task management, and the Operations Queue Pending Approvals tab (approve/reject/return/triage). Gate 1 enforcement verified live.

- 2026-06-14 · P1-06 · Client Pricing screen (/admin/pricing, admin-only): per-field rate editor with per-field last-changed audit, append-only price history, 90-day stale warning + mark-reviewed. Append-only enforcement verified live.

- 2026-06-14 · P1-05 · Single-screen admin (Clients & Projects): left client nav, vertical tabs (Overview/Projects+sub-projects/Contacts/Pricing summary), right info+docs sidebar; slide-over CRUD forms (RHF+Zod) via admin-gated server actions; composite-FK-safe sub-projects. RLS insert policies verified live.

- 2026-06-13 · P1-04 · Design system: shared formatters (format.ts), semantic status tokens + StatusBadge, DataTable with mandatory loading/empty/error states, PageHeader, SubmitButton, React Query provider, full shadcn primitive set.

- 2026-06-12 · P1-03 · Auth & RBAC: RLS policies per security.md (migrations 0011–0012), column-level cost-field protection, signup trigger (inactive by default), Next.js middleware + login + role landings + server-side role checks; verified live (12 RBAC checks).

- 2026-06-12 · P1-02 · Schema migrations 0001–0010 applied (41 tables, composite subproject FK, audit/append-only/immutable triggers, RLS on all tables, reporting views) + generated TS types.
- 2026-06-12 · P1-01 · Repo scaffold: Next.js App Router + TS + Tailwind + shadcn/ui, Supabase CLI init, stack deps, .agent/ workspace, CI with TASKS.md guard.
