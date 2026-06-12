# TASKS.md — Active Task Registry (KiBiz Platform)

## Phase 1 — Foundation

- [x] P1-01: Supabase project setup, CLI, repo scaffold, and .agent/ workspace files (branch: p1-01-scaffold · done 2026-06-12 · local merge, no remote configured yet)
- [ ] P1-02: Full schema migrations 0001–0010 (incorporating composite keys for subprojects & audit triggers) and generated types committed
- [ ] P1-03: Auth & RBAC (Supabase Auth, role-based routing, RLS policies, server-side role checks)
- [ ] P1-04: Design system (shadcn/ui tokens, formatters, shared table/form/card components)
- [ ] P1-05: Single-screen admin (clients + projects + sub_projects + engagement + pricing summary)
- [ ] P1-06: Client pricing screen (admin-only, priceHistory audit, stale warnings)
- [ ] P1-07: Tickets, tasks, and bugs lifecycle (including Gate 1 approval queue)
- [ ] P1-08: Activities (time entries) management (duration-first, raw minutes, edit/lock states)
- [ ] P1-09: Web timers engine (timer_state, server actions, midnight database split, 12h auto-stop)
- [ ] P1-10: Goal Sheet / My Day (developer view + timer integration + manager team-day grid)
- [ ] P1-11: Timesheets management (Gate 2 weekly submit/review cycle)
- [ ] P1-12: AI billing summaries (Gate 3 queue UI)
- [ ] P1-13: Materialized dashboards & operational views (v_billable_by_developer, v_executive_kpis)
- [ ] P1-14: AI Evaluation harness (/evals/datasets/, /evals/run.ts, regression blocking)
- [ ] P1-15: FM sync (WF-009) n8n integration webhooks and backoff handler

---
*Reference CLAUDE.md for rules on task lifecycle: pick top unblocked task, mark [~] with branch name, run tests, update task to [x] on PR submit.*
