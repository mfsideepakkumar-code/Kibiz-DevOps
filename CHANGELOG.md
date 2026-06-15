# Changelog

- 2026-06-15 · P1-13 · Executive Dashboard (/dashboard, exec/admin): six headline KPI cards + confirmed-formula operational metrics (revenue, receivables, billable/approved hours, active projects/clients) from the v_executive_kpis materialized view (read via service role behind the role gate), a Risk panel (credit exposure ≥70%, hour blocks ≥80% used, KiCare loss/at-risk), and two Recharts (billable mix by developer 30d, 12-week billable trend), with a manual KPI Refresh. Cost, Margin %, Utilisation, and Idle Cost render as pending "—" rather than guessed — blocked on C-10 (true margin) / OQ-1 (utilisation formulas). Migration 0019 fixes fn_refresh_executive_kpis (the expression-index singleton made REFRESH CONCURRENTLY always fail → plain refresh). status-variant gains self-mapping semantic keys.

- 2026-06-15 · P1-12 · AI billing summaries (Gate 3): Ops Queue Billing Queue tab lists wrapping-up tickets (all tasks done, or an in-progress summary), with hours total/billable. Manager can Generate with AI (Claude API, claude-opus-4-8, JSON-schema output), edit the two outputs (client-facing summary_text never leaks rates/costs/staff names; internal_detail is accounting-only), then Approve → ticket goes Ready to bill, or Return with a reason. Degrades cleanly with no ANTHROPIC_API_KEY (manual write/approve still works). Migration 0018 (ai_usage_log: token usage logged on every call, admin read-only). All AI calls server-side; key never in client bundle.

- 2026-06-15 · UI · App shell + indigo theme to match the approved prototype: left sidebar (grouped nav + lucide icons, active state), white cards on light-gray surfaces, soft shadows, top-bar timer; all via design tokens. Applied globally to every authenticated screen.

- 2026-06-15 · P1-11 · Timesheets (Gate 2): dev My Timesheets (weekly submit/resubmit) + manager Timesheet Review (approve / flag entries with reason). Migration 0017 (dev draft/rejected→submitted policy + Gate 2 timesheet status guard); week.ts helpers + tests. Full submit/flag/resubmit/approve cycle verified live.

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
