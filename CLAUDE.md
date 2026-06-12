# CLAUDE.md — Agent Operating Contract (KiBiz Platform)  
# Read this first on every session. Then: .agent/tasks/TASKS.md → spec.md → schema.md → security.md → prd.md → DECISIONS.md

## Session start order  
1. This file (CLAUDE.md)  
2. .agent/tasks/TASKS.md — pick top unblocked [ ] task, mark [~] with branch name  
3. .agent/spec.md — condensed implementation spec  
4. .agent/schema.md — full schema map (the "Workspace MD")  
5. .agent/security.md — full security rules map  
6. .agent/prd.md — project requirements document (phase plan, specifications, and sync contracts)  
7. .agent/DECISIONS.md — architecture decision records (ADR log)

## Core rules

1. ONE task in progress per agent. One task = one PR. Half-day max scope.  
2. Definition of done: code + tests passing + TASKS.md updated (status + date + PR ref) + one-line CHANGELOG.md entry. CI fails if src/ changes without TASKS.md changing.  
3. Never guess on finance logic, approval rules, or sync behaviour. If ambiguous → write the question under the task in TASKS.md and STOP.  
4. Never modify: closed billing periods · invoice numbering sequences · rateApplied snapshots · priceHistory entries · audit_logs rows. Any touch requires a new ADR.  
5. Schema changes via Supabase CLI only: `supabase migration new` then `supabase gen types typescript`. Never raw ALTER, never `db push` to prod. Commit generated types in the same PR as the migration. Update schema.md in the same PR.  
6. AI prompts live in /prompts/. If you touch one: run `npm run evals`. Do NOT merge on >2-point regression. Category and profit-centre evals report separately — check both independently.  
7. Inngest workflows implemented ONLY from a WF-spec in .agent/spec.md §Workflows. No spec = no workflow. Every step.run must be idempotent. Every workflow ships a double-delivery test.  
8. FM sync (WF-009): send Hours as MILLISECONDS (minutes × 60000). Billable labels are exactly "Billable" / "Non-Billable". Never remove the Clickup_Act dedup key from the activity payload.
9. Composite foreign keys for hierarchical integrity: tickets with a sub_project_id must match the parent project_id using a composite key (project_id, sub_project_id) referencing sub_projects.
10. Timer interface & execution: Active web timer is built on the Goal Sheet (My Day) screen, not the time entry screen. Manual time entries are duration-only; timers capture start/end times via timer_state. Timers crossing midnight must split at the DB/server level.

## HARD BLOCKS — do not build, scaffold, or reference until DECISIONS.md shows the block resolved

- C-1: client portal (schema flags exist and are inert; RLS policies written but DISABLED)  
- C-11: Subproject entity — table sub_projects exists; do NOT add fields or relations beyond what schema.md specifies until C-11 is formally resolved  
- C-2: QuickBooks sync — ADR-016 interim rule: platform invoices are the operational record; do not build any QB integration  
- C-3: KiCare formula bucket scope — ships behind config flag; do not hardcode the formula

## Terminology (ADR-013 + ADR-018 — enforced in schema, UI strings, code comments, tests)

Hierarchy: Client → Project → SubProject (optional/SOW) → Ticket → Task → Time entry  
UI label for time entries: Activity (matches FM Activity__Web layout)  
States: Draft (not Provisional) → Submitted → Approved → Billed  
"Ready to bill" (not Billing Ready)  
Category ≠ Profit centre — independent dimensions, never derived from each other  
"Billable" / "Non-Billable" (exact casing, hyphen) — used in FM sync and UI

## Tech stack (ADR-009/010 — do not deviate without a new ADR)

Next.js App Router + TypeScript  
shadcn/ui + Tailwind CSS  
Supabase: Postgres, Auth, Storage, RLS — NO ORM  
supabase-js for all CRUD; Postgres views + RPCs for reporting and transactional writes  
React Query (TanStack) for server state  
React Hook Form + Zod for forms  
Inngest for background jobs  
Cayan for payments (card + ACH; webhook is the only truth source)  
Recharts for charts  
Low-cost model (Minimax or equivalent) for Goal Sheet activity description refinement  
Claude API for classification, billing summaries, weekly client reports, boss chatbot  
All AI calls server-side only — API key never in client bundle

## AI model matrix (C-5 resolved)

Goal Sheet description refinement → Minimax (or equivalent low-cost)  
Category suggestion → Claude API  
Profit centre suggestion → Claude API (independent call/output from category)  
Split detection → Claude API  
KiCare scope classification → Claude API  
Billing summary generation → Claude API  
Weekly client status reports → Claude API  
Boss chatbot tool calls → Claude API  
Token usage logged on every call. Daily circuit breaker disables inline classification only (never approval flows) past spend threshold in company_config.

## UI standard (non-negotiable — every screen)

shadcn/ui components and design tokens only. No inline hex values. No one-off font sizes. Two font weights only: 400 (regular) and 500 (medium).  
Every data view ships three states: loading, empty, error. No raw spinners, no unstyled "No data", no unhandled error boundaries.  
Tables: right-aligned numerics with tabular figures. Currency via shared formatter (src/lib/format.ts). Dates via shared formatter. Never hand-format money or dates inline.  
Forms: labels on every field, inline validation messages (RHF + Zod), buttons disabled while submitting.  
Role-appropriate density: manager/exec screens = information-dense; developer screens = minimal (60-second action rule).  
Admin clients-and-projects screen: SINGLE-SCREEN (FR-17.10). Left sidebar nav, vertical tabs, right contextual sidebar (info + document storage). Inline panels and slide-overs. No page-hops. No modal chains.  
Status colours from one semantic palette only: success (green), warning (amber), danger (red), info (blue). The same green means the same thing on every screen.  
Before marking any UI task done: screenshot against an approved reference screen. No reference exists → flag in TASKS.md and stop.

## Security rules agents most commonly break

costPrice, costRatePerHour, true margin figures, burnout scores: ABSENT (not null) from API responses for non-admin roles. Enforced in RPC/view definitions, not UI conditionals.  
Every API route: server-side role check before any data access.  
RLS enabled on every table. Service-role key used server-side only — never in client code.  
Card data never touches KiBiz servers. Cayan webhook is the only payment confirmation source — never trust browser redirects.  
audit_logs: INSERT-only. Revoke UPDATE and DELETE at the DB level.  
Append-only fields: client_pricing.price_history, time_entries.edit_history, payment_reminders, mcp_audit_log. Never overwrite.  
Audit log triggers: Implement database-level Postgres triggers on audited tables (e.g., client_pricing, time_entries) to automatically write to audit_logs rather than relying on application-level logging.

## Migration lineage  
After every migration, append one line to .agent/MIGRATION-LINEAGE.md:  
FORMAT: [migration_id] | [tables touched] | [reason] | [date]