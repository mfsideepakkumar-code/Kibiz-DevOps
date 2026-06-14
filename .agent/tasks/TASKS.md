# TASKS.md — Active Task Registry (KiBiz Platform)

## Phase 1 — Foundation

- [x] P1-01: Supabase project setup, CLI, repo scaffold, and .agent/ workspace files (branch: p1-01-scaffold · done 2026-06-12 · local merge, no remote configured yet)
- [x] P1-02: Full schema migrations 0001–0010 (incorporating composite keys for subprojects & audit triggers) and generated types committed (branch: p1-02-schema · done 2026-06-12 · local merge, no remote configured yet)
  - OPEN QUESTION (finance — do not guess): categories.default_billable seeded NULL for all 9 categories. Which categories default to billable?
  - OPEN QUESTION (stakeholder): profit_centers NOT seeded — schema.md list is marked "e.g."; need the confirmed centre list (prd.md §6).
  - OPEN QUESTION (OQ-1): v_executive_kpis ships without Utilisation and Idle Cost — formulas pending the original dashboard PRD. Do not build until OQ-1 resolves.
  - NOTE: KiCare per-ticket exclude toggle has no schema field yet (no column in schema.md); expected with P2-03 KiCare classification.
- [x] P1-03: Auth & RBAC (Supabase Auth, role-based routing, RLS policies, server-side role checks) (branch: p1-03-auth-rbac · done 2026-06-12 · local merge, no remote configured yet)
  - OPEN QUESTION (stakeholder): project_lead row-scoping — security.md says "within own projects" but no project-membership model exists in schema.md (no members table; assignment via tasks? project_rates?). project_lead = developer-level access until resolved.
  - ACTION REQUIRED (dashboard, cannot be done in SQL): disable public email signups in Supabase dashboard (Auth → Providers) before pilot. DB-level defense (signups land inactive) is in place.
  - NOTE: select * fails for non-admins on users/project_rates/products (column-level grants) — always select explicit columns; see security.md implementation notes.
- [x] P1-04: Design system (shadcn/ui tokens, formatters, shared table/form/card components) (branch: p1-04-design-system · done 2026-06-13 · local merge, no remote configured yet)
  - FLAG (CLAUDE.md UI standard): no approved reference screens exist yet. The screenshot-against-reference gate cannot run for P1-05+ until references are provided. Stakeholder to supply reference designs or approve the first built screens as the references.
- [x] P1-05: Single-screen admin (clients + projects + sub_projects + engagement + pricing summary) (branch: p1-05-admin-screen · done 2026-06-14 · local merge, no remote configured yet)
  - REFERENCE-SCREEN GATE (CLAUDE.md UI standard): built from PRD/spec (FR-17.10 / ADR-025) per instruction "build from spec". APPROVED as the reference baseline by stakeholder 2026-06-14 — recorded in .agent/ui-references.md. This screen is now the canonical single-screen admin pattern for later admin screens. (Authenticated screenshot deferred until email login is re-enabled.)
  - ACTION REQUIRED (dashboard): Email logins are currently DISABLED in Supabase (Auth → Providers → Email). Re-enable the Email provider but keep "Allow new users to sign up" OFF. Right now nobody (incl. admin) can log in. Verified separately that admin RLS insert policies pass via JWT impersonation.
  - NOTE: pricing tab is read-only summary; full pricing edit + price-history + 90-day stale warning is P1-06. Document storage panel is a placeholder (storage buckets not yet provisioned).
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
