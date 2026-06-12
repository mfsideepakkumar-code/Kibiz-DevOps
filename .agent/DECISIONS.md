\# DECISIONS.md — KiBiz Platform Architecture Decision Records  
\# APPEND-ONLY. Never edit an existing ADR. Write a new one that supersedes it.  
\# Format: ADR-\#\#\# | Date | Decision | Rationale | Supersedes | Hard block / Revisit trigger

\============================================================  
ADR-007 | 2026-06-10  
Decision: Web-based start/stop timers ship in Phase 1\. No idle detection. No desktop app.  
Rationale: Keeps the entire platform as a single Next.js codebase. Idle detection adds  
           complexity and a maintenance surface without proportional value at this stage.  
           Time quality is addressed by the Goal Sheet planning layer (planned vs actual),  
           not by activity monitoring. End-of-day nudge \+ missing-time alerts cover the  
           gap detection use case.  
Supersedes: nothing  
Hard block: do not add idle detection, activity monitoring, or an Electron app without  
           a new ADR approved by Raman.  
\============================================================

\============================================================  
ADR-008 | 2026-06-10  
Decision: Evaluated Drizzle ORM as an alternative to Prisma for this stack.  
Rationale: Drizzle is SQL-first and handles aggregate-heavy queries better than Prisma.  
           However, ADR-010 supersedes this by removing the ORM layer entirely.  
Supersedes: nothing  
Superseded by: ADR-010  
\============================================================

\============================================================  
ADR-009 | 2026-06-10  
Decision: Supabase replaces the original stack choices of Prisma ORM, Auth.js (NextAuth),  
           and Vercel Blob.  
Rationale: Supabase provides Postgres, Auth, Storage, and RLS in one platform.  
           \- Auth: Supabase Auth gives lockout, password reset, and session handling  
             for free — no hand-rolled auth.  
           \- Storage: Supabase Storage replaces Vercel Blob with RLS policies on files  
             (e.g. client portal users can only download their own invoice PDFs).  
           \- One vendor for db/auth/storage reduces integration surface and credentials.  
Supersedes: Prisma choice, Auth.js choice, Vercel Blob choice  
Hard block: do not introduce a separate auth library or file storage provider without  
           a new ADR.  
\============================================================

\============================================================  
ADR-010 | 2026-06-10  
Decision: No ORM in Phase 1\. Use supabase-js for all CRUD. Postgres views and RPCs  
           for reporting and transactional writes. Supabase CLI migrations for schema  
           changes. supabase gen types typescript for TypeScript types.  
Rationale: The platform is aggregate-heavy — true margin, KiCare profitability, blended  
           rates, utilisation matrices. These are relational queries that fight any ORM.  
           One query paradigm (SQL) throughout is cleaner for AI agents than mixing ORM  
           and raw SQL. CLI migrations give versioned, reviewable schema changes without  
           an abstraction layer. Generated types provide compile-time safety.  
Supersedes: ADR-008 (Drizzle), ADR-009 Prisma component  
Revisit trigger: if invoice-generation transactions outgrow RPC functions. Drizzle is  
           the preferred ORM if one is needed later.  
Hard block: never use raw ALTER in application code; never db push to prod; always  
           use supabase migration new.  
\============================================================

\============================================================  
ADR-011 | 2026-06-10  
Decision: Category and Profit Centre are INDEPENDENT dimensions. They are never derived  
           from each other. AI predicts both independently in a single API call with two  
           separate output fields.  
Rationale: Category \= ticket type (dev-facing: Bug Fix, New Feature, Support, etc.).  
           Profit Centre \= P\&L segment (finance-facing: Development Income, License  
           Income, Hosting Income, Support/KiCare, Internal R\&D). A bug fix on a KiCare  
           client belongs to Support/KiCare profit centre; a bug fix on a standard client  
           belongs to Development Income. The category is the same but the profit centre  
           differs. Mapping one to the other would produce wrong financial data.  
Supersedes: nothing  
Hard block: never add a mapping table or rule that derives profit centre from category  
           or vice versa.  
\============================================================

\============================================================  
ADR-012 | 2026-06-10  
Decision: Inngest is retained for background jobs. Free tier is acceptable for Phase 1\.  
           pg\_cron is not used as the primary job runner.  
Rationale: Inngest provides step functions, automatic retries, observability dashboard,  
           and idempotency primitives that would need to be hand-built on pg\_cron.  
           AI agents produce more reliable Inngest code because the SDK is well-documented  
           and patterns are conventional. Free tier covers threshold checks and reminder  
           jobs for a team of this size.  
           Action: confirm current Inngest free tier limits before Phase 1 ships.  
Supersedes: earlier consideration of pg\_cron \+ Supabase Edge Functions as replacement  
Revisit trigger: if a workflow requires step-level retry semantics that Inngest free  
           tier cannot handle.  
\============================================================

\============================================================  
ADR-013 | 2026-06-10  
Decision: Terminology overhaul — enforced in schema, UI strings, code comments, and tests.  
           Old term        → New term  
           Subtask         → Task (execution unit under a Ticket)  
           Provisional     → Draft (time entry state)  
           Billing Ready   → Ready to bill (ticket state)  
           TimeAllocation  → Split (profit centre split on a time entry)  
Rationale: "Subtask" is ClickUp-specific jargon. "Task" is universally understood.  
           "Provisional" sounds legal; "Draft" matches familiar document states.  
           "Billing Ready" reads as a label; "Ready to bill" reads as a state description.  
           "TimeAllocation" is internal DB language; "Split" is how humans say it.  
           Consistent terminology reduces cognitive load for developers, managers, and  
           AI agents reading the codebase.  
Supersedes: nothing  
Hard block: never use Subtask, Provisional, Billing Ready, or TimeAllocation in UI  
           strings, variable names, or documentation.  
\============================================================

\============================================================  
ADR-014 | 2026-06-10 (REVISED from original)  
Decision: Tasks picked from EXISTING, already-approved tickets require NO manager  
           approval. A developer can add any approved ticket's tasks to their goal sheet  
           and start working immediately. Gate 1 (manager approval queue) applies ONLY  
           to developer-CREATED tickets and tasks.  
Rationale: The original PRD required approval for all developer-created items. This  
           revision separates planning (manager defines and approves tickets upfront)  
           from execution (developer picks from the approved list freely). This is the  
           model that enables the 60-second action target — the approval friction is  
           front-loaded at ticket creation, not at daily execution.  
           Three gates: Gate 1 = dev-created items · Gate 2 = time before billing ·  
           Gate 3 = billing summaries. See [spec.md](file:///Volumes/X9%20Pro/Node%20JS/KiBiz%20Dev%20Ops/.agent/spec.md#L117-L122) (APPROVAL GATES section) for full rules.  
Supersedes: earlier version of ADR-014 that required approval on all goal sheet additions  
============================================================

============================================================  
ADR-015 | 2026-06-10  
Decision: Recurring tasks/meetings are managed via recurring_templates table.  
           Each template has: owner (user_id or team-wide null), days_of_week int[],  
           task mapping (ticket_id/task_id), default_minutes, activity_type, billable flag.  
           WF-006 (Inngest cron 00:05 daily) auto-inserts goal_items for the day from  
           active templates. Meetings only in v1.  
Rationale: Recurring meetings are the most common recurring item (standups, client calls).  
           Modelling them as templates that generate goal_items keeps the goal_items table  
           clean (no permanent recurring rows) and allows templates to be paused or  
           modified without affecting past goal history.  
Supersedes: nothing — resolves OQ-22  
============================================================

============================================================  
ADR-016 | 2026-06-10  
Decision: Platform invoices are the operational record. No QuickBooks sync is built  
           until conflict C-2 (invoice system-of-record boundary) is formally resolved  
           by stakeholders.  
Rationale: Building a QuickBooks integration before C-2 is resolved risks building the  
           wrong thing. The platform's in-platform invoice lifecycle (Cayan payments,  
           reminders, PDF generation, void/credit notes) is complete enough to operate  
           independently. QuickBooks sync can be added later as an export/integration  
           layer once the boundary is clear.  
Supersedes: v1.1 tracked-change insertion proposing "draft-in-platform, issue-in-  
           accounting" via QuickBooks (C-8 accepted the v1.1 insertions overall but  
           this specific integration is deferred pending C-2)  
Hard block: do not build any QuickBooks API integration until C-2 is resolved and a  
           new ADR is written.  
============================================================

============================================================  
ADR-017 | 2026-06-10  
Decision: SubProject is an OPTIONAL level between Project and Ticket, also called SOW.  
           Tickets may attach directly to a Project OR to a SubProject.  
           Hour Blocks remain CLIENT-LEVEL entities — they are not a hierarchy level.  
           A block funds work across multiple projects. Multiple blocks can be open  
           simultaneously per client.  
Rationale: The meeting (Doc C) described a Client > Project > Subproject hierarchy with  
           "a 100-hour block" as the example. The hour block is not a structural level —  
           it is a billing mechanism that spans projects. SubProject (SOW) is a genuine  
           grouping concept (e.g. "Phase 2 of ERP project") that sits between Project  
           and Ticket. Separating these prevents confusion between work organization and  
           billing mechanics.  
Supersedes: resolves C-11  
Hard block: do not add a Subproject entity beyond the [sub_projects](file:///Volumes/X9%20Pro/Node%20JS/KiBiz%20Dev%20Ops/.agent/schema.md#L119-L128) table defined in schema.md until C-11 is formally closed by stakeholders. The table exists;  
           do not add fields or relations speculatively.  
============================================================

============================================================  
ADR-018 | 2026-06-10 (REVISED)  
Decision: The execution unit under Ticket is named TASK in schema and code.  
           ACTIVITY is the UI label for time entries (logged work against a task).  
           This matches the existing FileMaker model exactly: Activity__Web layout,  
           "Automate Activity Creation" script.  
           Doc A "activity types" (CLIENTBILLABLE, PMMANAGEMENT, etc.) keep their name —  
           they classify activities. No collision.  
           Schema tables: tickets, tasks, time_entries.  
           UI label for time_entries: Activity.  
Rationale: "Task" is universally understood as "thing to do." "Activity" as the UI label  
           for logged work matches exactly how FileMaker already models it, eliminating  
           any translation layer in the FM sync (WF-009). Earlier drafts renamed  
           time_entries to "activities" in the schema — this revision keeps the schema  
           table name as time_entries (SQL-conventional) while using Activity in the UI.  
Supersedes: earlier ADR-018 draft that renamed the schema table to activities  
============================================================

============================================================  
ADR-019 | 2026-06-10  
Decision: KiCare profitability counts the SUM OF ALL NON-BILLABLE HOURS in the KiCare  
           period (both bucket a = KiCare-covered and bucket b = Client Non-Billable).  
           Formula: surplus = contract_amount − (non_billable_hours × client hourly_rate)  
           KiCare analysis lives as a TAB IN THE CLIENT PROFILE, not a separate screen.  
           Features: period card (amount + start/end), auto-listed non-billable tickets,  
           per-ticket EXCLUDE toggle (reason required), AI Analyse button (billable  
           candidates + support summary), surplus/deficit status, drill-down by type/dev/week.  
Rationale: Counting both buckets answers the actual business question "are we charging  
           enough for KiCare?" — bucket b (free out-of-scope work) is real cost absorbed  
           because of that client relationship. Excluding it understates the true cost.  
           The config flag (kicareBucketsCounted = 'a' | 'a_b') allows finance to override  
           if needed, but the default is the honest number.  
           Client profile tab placement keeps KiCare data in context with the client  
           rather than requiring navigation to a separate section.  
Supersedes: resolves C-3  
Hard block: do not hardcode the bucket formula — always read kicareBucketsCounted config.  
============================================================

============================================================  
ADR-020 | 2026-06-10  
Decision: WF-009 FM sync sends Hours to FileMaker as MILLISECONDS (duration_minutes × 60000).  
           The FM script "Automate Activity Creation" is NOT modified.  
Rationale: The FM script was confirmed to contain:  
           $Hours = Let(tt = JSONGetElement($pJSON;"Hours"); Case(tt>0; Round(tt/3600000;2);0))  
           This divides by 3,600,000 — it expects and handles milliseconds. Sending  
           minutes or decimal hours would produce fractional results (e.g. 90 minutes  
           sent as 90 would become 0.00003 hours in FM). Sending milliseconds (90 × 60000  
           = 5,400,000) produces the correct 1.50 hours. The FM script works correctly  
           as-is; the conversion belongs in the n8n payload node.  
Supersedes: nothing — resolves the hours unit ambiguity flagged during WF-009 design  
Hard block: never change the Hours unit sent to FM without first verifying the FM script  
           conversion formula has been updated to match.  
============================================================

============================================================  
ADR-021 | 2026-06-10  
Decision: Invoice overdue status is derived rather than stored in the database.  
Rationale: Overdue status depends dynamically on current date and amount due (due_date < current_date AND amount_due > 0). Storing it statically leads to cache invalidation and data drift issues.  
Supersedes: nothing — resolves OQ-9  
============================================================

============================================================  
ADR-022 | 2026-06-10  
Decision: Standardize company billing day and tax config.  
Rationale: Company billing day defaults globally to config monthly_billing_day with per-subscription overrides allowed. Tax is manually calculated using company_config tax_rate.  
Supersedes: nothing — resolves OQ-11, OQ-12  
============================================================

============================================================  
ADR-023 | 2026-06-10  
Decision: Hour block activation is tied to payment.  
Rationale: Hour block purchases generate a standard invoice and transition status to active automatically only upon invoice payment (paid status).  
Supersedes: nothing — resolves OQ-17  
============================================================

============================================================  
ADR-024 | 2026-06-10  
Decision: Extend projections for KiCare and Hour Blocks.  
Rationale: KiCare deficit is projected using trailing-3-week average burn. Hour blocks alerts at 80% or higher include projected depletion dates using the same trailing average.  
Supersedes: nothing — resolves OQ-10 extended  
============================================================

============================================================  
ADR-025 | 2026-06-10  
Decision: Enforce single-screen admin layout hierarchy.  
Rationale: The admin clients and projects page uses vertical layout nesting: left sidebar nav, vertical tabs in workspace, and right contextual sidebar (info + doc storage). No modal chains or page hops.  
Supersedes: nothing — resolves OQ-26  
============================================================

============================================================  
ADR-026 | 2026-06-10  
Decision: Admin role permission rules and cost model interim rule.  
Rationale: Enforce strict role permissions where unspecified actions default to denied (silence = deny). Use cost model interim setup pending finance sign-off.  
Supersedes: nothing — resolves C-9, C-10  
============================================================

============================================================  
PENDING DECISIONS (conflicts and open questions not yet resolved)  
============================================================

C-1  Client portal scope — deferred to Phase 3. Stakeholder decision needed before  
     Phase 3 planning. RLS policies written in Phase 1 but disabled.

C-2  Invoice system-of-record boundary (platform vs QuickBooks) — ADR-016 interim  
     rule applies. Full resolution needed before any accounting integration is built.

C-3  KiCare formula bucket scope — ADR-019 sets default to a+b with config flag.  
     Finance must confirm the value of kicareBucketsCounted before Phase 2 ships.

C-11 SubProject full definition — ADR-017 establishes the table and concept.  
      Field additions and relations beyond [schema.md](file:///Volumes/X9%20Pro/Node%20JS/KiBiz%20Dev%20Ops/.agent/schema.md#L119-L128) current spec are blocked until  
     stakeholders confirm the full SubProject/SOW model.

OQ-1  Burnout and utilisation formulas — original dashboard PRD not yet provided.  
      Build data capture only; do not build the score.

OQ-2  v1.1 Addendum (sections 20.4 and 21.3) — document not yet provided.  
      Requirements that depend on it remain open.

OQ-15 Email delivery provider — not yet selected. Resend or SendGrid both valid.  
      Decision needed before Phase 2 payment reminders and invoice emails ship.

OQ-18 Client portal account lifecycle (MFA, password reset, lockout policy) — blocked  
      by C-1. Spec this before Phase 3 portal build begins.

OQ-21 Identity of "Raman's and Priya's existing PRD documents" — unclear whether  
      these are Doc A and Doc B already consolidated, or additional documents.

END OF DECISIONS.md