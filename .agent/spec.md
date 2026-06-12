# spec.md — KiBiz Platform Implementation Spec  
# Condensed from prd.md (PRD v3.1) + all ADRs.  
# Authority: DECISIONS.md (ADRs) > prd.md (PRD) > this file (Spec) > docs/PRD.md

## Resolved decisions — build these

ADR-007: Timers Phase 1, web start/stop only. No idle detection, no desktop app.  
ADR-009/010: Supabase (Postgres/Auth/Storage/RLS); no ORM; supabase-js + CLI migrations; Inngest.  
ADR-011: Category ⊥ profit centre, independent AI predictions, never derived from each other.  
ADR-013: Task replaces Subtask; Draft replaces Provisional; Ready to bill replaces Billing Ready.  
ADR-014: Tasks from existing approved tickets need no approval. Gate 1 = dev-created items only.  
ADR-015: Recurring templates (owner, days-of-week, task mapping, default minutes) auto-insert goal items 00:05.  
ADR-016: Platform invoices are the operational record; no QuickBooks sync until C-2 resolved.  
ADR-017: SubProject = optional level (SOW) between Project and Ticket. HourBlocks stay client-level.  
ADR-018: Activity = UI label for time entries (matches FM Activity__Web). Task = execution unit.  
ADR-019: KiCare counts all non-billable hours (buckets a+b). Config flag for bucket scope. Client-profile tab.

## HARD BLOCKS — do not build until DECISIONS.md shows resolved

C-1: client portal  
C-11: sub_project entity additions beyond schema.md current spec  
C-2: QuickBooks integration  
C-3: KiCare formula bucket scope (ships behind config, finance must choose a vs a+b)  
OQ-1: burnout/utilisation formulas (build data capture; do not build the score)

## Phase 1 build order (do not skip ahead; each item unblocks the next)

P1-01: Supabase project setup, CLI, repo scaffold, .agent/ workspace files  
P1-02: Full schema migrations 0001–0010 (see schema.md). Generated types committed.  
P1-03: Auth + RBAC (Supabase Auth, role-based routing, RLS policies, server-side role checks)  
P1-04: Design system (shadcn tokens, formatters, table/form/card kit) — MUST ship before any feature screens  
P1-05: Single-screen admin (clients + projects + sub_projects + engagement + pricing summary)  
P1-06: Client pricing screen (admin-only, per-field audit, stale warning at 90 days)  
P1-07: Tickets + tasks + bugs (full lifecycles, Gate 1 approval queue)  
P1-08: Time entries (Activities) — duration-first, raw minutes, edit rights per state, period locks  
P1-09: Web timers (timer_state, server actions, midnight split, 12h auto-stop)  
P1-10: Goal Sheet / My Day (developer view + manager team-day grid)  
P1-11: Timesheets (Gate 2 — auto-create, submit, flag, resubmit)  
P1-12: Basic AI billing summaries (Gate 3 queue, shadcn UI only)  
P1-13: Dashboards (v_billable_by_developer, v_executive_kpis materialized)  
P1-14: Evals harness (/evals/datasets/, /evals/run.ts, CI gate)  
P1-15: FM sync (WF-009) — build in parallel with P1-12, go live end of P1

## Phase 2 build order

P2-01: Hour blocks + drawdown engine + alerts + projected depletion date  
P2-02: Pay-as-billed credit limits + v_unbilled_exposure  
P2-03: KiCare classification + client-profile KiCare tab (ADR-019)  
P2-04: AI classification suite (category, profit centre, split detection, backfill, descriptions)  
P2-05: Invoice assembly + numbering + void + credit notes  
P2-06: Rate resolution + rateApplied stamping  
P2-07: Cayan payments + webhook handling  
P2-08: Payment reminders (WF-003)  
P2-09: Products + client subscriptions + renewal auto-invoicing (WF-004)  
P2-10: Hosting margin view  
P2-11: Reports (billable/non-billable, profit/margin, PDF export)  
P2-12: WF-009 live + ClickUp parallel run

## Phase 3 build order

P3-01: Client portal (only after C-1 resolved + OQ-18 account lifecycle spec)  
P3-02: MCP server (read-only tools first)  
P3-03: Boss chatbot (exec/admin, over MCP tools)  
P3-04: AI weekly client status reports  
P3-05: Email/transcript ingestion → ticket intake  
P3-06: Advanced exec trends + automation rules + predictive alerts  
P3-07: ClickUp decommission

## Key business rules (single source — agents read this, not scattered PRD sections)

TIME ENTRIES  
- Duration-first. start/end captured by timer only, not required for manual entries.  
- Minimum 1 minute. Under 1 minute discarded silently.  
- Raw minutes stored. Rounding only at invoice time via client_pricing.billing_increment.  
- Project-level entries (task_id null) allowed with required description.  
- Descriptions required on billable = true only. AI drafts, one-tap accept.  
- Splits = exception path. AI flags multi-centre entries; split UI appears only then.  
- 12h auto-stop: entry flagged fm_sync_status = pending, manager notified.  
- Midnight auto-split: timer running at midnight creates two entries (one per day).

RATE RESOLUTION (see schema.md — applied at invoice time, rate_applied is immutable)

HOUR BLOCKS  
- Eligible time: APPROVED + BILLABLE + on eligible project + not already drawn/invoiced.  
- FIFO drawdown by activated_at. Depleted block → next active block automatically.  
- Manager can PIN (ticket always draws from specific block) or EXCLUDE (ticket never draws).  
- Over 100%: overrun flag. More work requires manager approval. Never auto-creates blocks.  
- Alerts 50/80/95/100 via WF-001. alerts_sent[] = idempotency guard (no duplicate alerts).  
- Projected depletion date shown from 80%+ using trailing-3-week average burn rate.  
- Block purchase: standard invoice (type = hour_block). Block activates on invoice paid.

KICARE (ADR-019)  
- Formula: surplus = contract_amount − (non_billable_hours × client_pricing.hourly_rate)  
- non_billable_hours = all non-billable time entries within contract start_date and end_date.  
- Exclude toggle per ticket (reason required). Excluded tickets are visually marked, drop from formula.  
- Bucket scope (C-3): config kicare_buckets_counted = 'a' | 'a_b'. Finance must choose.  
- Status: profitable (surplus > 20% of contract), at_risk (0–20%), loss (negative).  
- Projection: trailing-3-week average weekly burn extrapolated to end_date. Alert max 1/week.  
- AI Analyse: two outputs: (1) billable candidates with one-line rationale; (2) period support summary.  
- Summary is client-shareable after manager approval.

INVOICES  
- Status enum: draft | sent | partial | paid | void. OVERDUE is DERIVED, not stored.  
- Overdue derived: due_date < current_date AND amount_due > 0.  
- Invoice numbers: company_config.invoice_prefix + auto-incrementing counter. IMMUTABLE. NEVER REUSED.  
- Void: sets void_at, void_by, void_reason. Clears invoice_id on all linked time_entries (returns to unbilled). VOID watermark on PDF. Cannot reactivate. New invoice must be created.  
- Credit notes: invoice_lines with type = adjustment, negative amount, description required.  
- Partial payment: invoice stays active, amount_due updates live, status = partial.

PAYMENTS (Cayan)  
- portal_token = unique per invoice, never reused after paid/void.  
- Cayan webhook = ONLY truth source. Never trust browser redirect for status.  
- cayan_transaction_id is unique constraint — webhook re-delivery is idempotent.  
- Card data never stored. Zelle = admin marks received manually.  
- Receipt auto-sent to all client_contacts where receives_invoices = true, on any payment method.

APPROVAL GATES  
- Gate 1 (work items): dev-created tickets/tasks/bugs only → queue. Manager/admin-created = auto-approved. Picking existing approved ticket/task = NO approval. Internal non-billable under threshold (default 2h) = self-approved.  
- Gate 2 (time): all activities start Draft. Weekly timesheet submit/review cycle. APPROVED = billing-eligible + feeds blocks + credit + KiCare.  
- Gate 3 (billing): required tasks Done → AI summary → manager APPROVE/EDIT/RETURN → Ready to bill.  
- Finance-sensitive AI (category, profit centre, billing type): NEVER auto-apply. Always one-click confirm. Low confidence → manager queue.

## Workflows (WF-specs — Inngest implements ONLY from these)

WF-001 BLOCK THRESHOLDS  
Trigger: event time_entry.approved  
Steps: 1) recompute block used_hours for affected block(s); 2) for each threshold in alert_thresholds not yet in alerts_sent and now crossed → send notification, append threshold to alerts_sent; 3) if threshold ≥ 80 → compute projected depletion date (trailing-3-week burn), include in alert  
Idempotency: alerts_sent[] is the guard; never re-fire a recorded threshold  
Failure: retry 3x with exponential backoff; on final failure → notification type = system_error to admin

WF-002 CREDIT EXPOSURE  
Trigger: event time_entry.approved OR event payment.recorded  
Steps: recompute v_unbilled_exposure for client; fire alert if new threshold crossed (70/90/100)  
Idempotency: same threshold + same client + same day = skip

WF-003 PAYMENT REMINDERS  
Trigger: cron daily 08:00  
Steps: find all sent invoices where amount_due > 0; for each check if a reminder is due per company_config.reminder_schedule and has not been suppressed; send; log to payment_reminders  
Stops: invoice.status = paid

WF-004 SUBSCRIPTION INVOICING  
Trigger: cron daily 06:00  
Steps: annual subscriptions where renewal_date = today + 30 → generate invoice; T-60 and T-30 → in-app alert to manager; monthly subscriptions where billing day matches today → generate invoice; auto-send if auto_send_invoice = true

WF-005 KICARE PROJECTION  
Trigger: cron Monday 07:00  
Steps: for each active kicare_contract → compute trailing-3-week burn → project to end_date; if projected deficit → alert manager (max 1 alert per contract per week)

WF-006 RECURRING GOAL ITEMS  
Trigger: cron daily 00:05  
Steps: for each active recurring_template where today's day_of_week is in days_of_week → insert goal_item if not already present for user + date + task

WF-007 FRIDAY CLIENT REPORTS  
Trigger: cron Friday 15:00  
Steps: for each active project with client_contacts where receives_reports = true → call Claude API with project context → create billing_summary-style draft → notify manager queue

WF-008 NIGHTLY INTEGRITY  
Trigger: cron daily 02:00  
Steps:  
  1) splits: for each time_entry with splits, sum(percent) must = 100; flag violations  
  2) hour blocks: for each block, sum(hour_block_drawdowns.hours_drawn) must = used_hours; flag drift  
  3) invoice totals: sum(invoice_lines.amount where is_included = true) must = invoices.subtotal; flag drift  
  4) audit_logs: spot-check that no UPDATE/DELETE exists on audit_logs table; alert if found  
  5) FM reconciliation: count platform approved activities vs FM activities per work_date; mismatch > 0 → admin alert  
On any violation: in-app notification to admin + log to audit_logs

WF-009 FM SYNC (KiBiz Platform → FileMaker via n8n)  
Trigger: platform HTTP webhook POST to n8n /webhook/kibiz-fm-sync  
Transport: Inngest action calls n8n webhook URL from env FM_SYNC_WEBHOOK_URL  
Events:  
  ticket.approved → create Ticket__Web record, read back TicketID, store in tickets.fm_ticket_id  
  activity.approved (Gate 2) → call "Automate Activity Creation" script on Activity__Web  
Payload: see schema.md §FM Sync field contract  
Hours unit: MILLISECONDS (duration_minutes × 60000)  
Billable labels: "Billable" / "Non-Billable" (exact)  
Idempotency: FM script deduplicates on Activity::ClickUp_Act exact match  
Retry: 3x with backoff; on failure → time_entries.fm_sync_status = error + admin notification  
Staff mismatch detection: if FM response scriptError = "401" or StaffID empty → fm_sync_status = staff_mismatch + admin alert with user email for Staff::Email_ClickUp fix  
External_Ticket_ID: field not yet in FM Ticket__Web layout — do NOT include in payload until T-FM-01 is done

## Evals (AI gate — CI blocks >2-point regression on any prompt change)

Datasets in /evals/datasets/, versioned with prompts.  
Run: npm run evals  
Category golden set: 200 tickets hand-labelled → ≥85% accuracy; ≥95% on high-confidence subset  
Profit centre golden set: 150 items spanning all centres → ≥80% accuracy; ZERO confident License↔Development misassignments  
Split detection: 60 entries (30 genuine, 30 single-centre) → 100% recall; ≤10% false prompts  
Billable/non-billable: 200 entries → ≥90%; zero false-billable on internal projects  
KiCare scope: 100 entries → ≥85%; low-confidence always routes to manager queue  
Billing summary: 50 tickets with reference summaries → rubric ≥4/5; zero hallucinated work items  
Weekly report: 20 projects → zero internal data leakage (names, rates, costs)  
KiCare billable candidates: 50 KiCare tickets → ≥80% precision on "could be billed" flags  
Description refinement: live acceptance rate ≥70%

Product metrics (instrumented in P1, measured during pilot):  
create-to-submit < 60 seconds · ≥85% activities logged same day · approval < 1 business day  
% of day planned on goal sheet by 10am · plan-vs-actual adherence trend

System evals (WF-008):  
Dashboard queries < 2s at 100k time entries  
Nightly integrity checks all green  
Per-role API response audits: cost/margin/burnout fields absent (not null) for non-admin

Live vs offline divergence: if live acceptance rate diverges >10 points from golden set accuracy → refresh dataset before next eval run.

============================================================  
NOTIFICATION CATALOG (N1–N18)  
============================================================

All notifications have two channels: in-app and email unless noted.  
Critical notifications cannot be disabled by users.

N1  Pending approval  
    Recipients: Manager  
    Trigger: developer creates ticket/task/bug → enters approval queue  
    Critical: no (but timely — queue grows)

N2  Missing time  
    Recipients: Developer (nudge), then Manager (alert if not resolved)  
    Trigger: WF-008 detects approved activities < expected hours for a past work day  
    Critical: yes — feeds billing data quality

N3  Overdue items  
    Recipients: Manager  
    Trigger: ticket past due date and not Done  
    Critical: no

N4  Escalated priority  
    Recipients: Manager + Project Lead  
    Trigger: ticket priority set to P0 or escalation_level incremented  
    Critical: yes for P0

N5  Hour block thresholds (50 / 80 / 95 / 100%)  
    Recipients: Manager at 50%; Manager + Admin at 80/95/100%  
    Trigger: WF-001 on time_entry.approved  
    Critical: yes at 95/100%  
    Extra: 80%+ includes projected depletion date in message

N6  Credit exposure thresholds (70 / 90 / 100%)  
    Recipients: Manager at 70/90%; Manager + Admin at 100%  
    Trigger: WF-002 on time_entry.approved or payment.recorded  
    Critical: yes at 100% (work pause/bill-now decision required)

N7  KiCare over-scope and renewal  
    Recipients: Manager for over-scope; Manager + Executive for renewal approaching  
    Trigger: WF-005 Monday projection run  
    Critical: yes

N8  Billing summary ready for review  
    Recipients: Manager  
    Trigger: all required tasks on a ticket reach Done → AI generates billing summary  
    Critical: no (but queues billing)

N9  Burnout risk (data capture only in Phase 1–2; score ships post-OQ-1)  
    Recipients: Manager  
    Trigger: TBD (pending OQ-1 burnout formula)  
    Critical: yes once implemented

N10 KiCare projected deficit  
    Recipients: Manager  
    Trigger: WF-005 — projected end-of-period balance turns negative  
    Critical: yes  
    Frequency: max once per contract per week

N11 Client pricing not reviewed > 90 days  
    Recipients: Admin  
    Trigger: WF-008 nightly scan of client_pricing.updated_at  
    Critical: no

N12 Hosting margin below threshold / stale price  
    Recipients: Admin (shown as row highlight in hosting margins view; not an email)  
    Trigger: WF-008 nightly scan  
    Critical: no

N13 Payment reminders to client (schedule: -3d, due, +7d, +14d, +30d)  
    Recipients: client contacts where receives_invoices = true; Manager in-app at +7/+14; Manager + Admin email at +30  
    Trigger: WF-003 daily 08:00  
    Critical: yes (revenue-critical; cannot be globally disabled, only suppressed per invoice)

N14 Subscription renewal alerts (T-60 and T-30)  
    Recipients: Manager  
    Trigger: WF-004 daily 06:00  
    Critical: yes at T-30

N15 SSL/domain expiry internal alert  
    Recipients: Team (internal only — never to client)  
    Trigger: WF-004 daily 06:00 when product.category = ssl or domain and renewal within threshold  
    Critical: yes

N16 Payment receipt  
    Recipients: All client contacts where receives_invoices = true  
    Trigger: payment recorded by any method (Cayan webhook, admin manual entry)  
    Critical: yes (client confirmation)  
    Channel: email only (not in-app for client — portal is Phase 3)

N17 AI weekly client report draft ready  
    Recipients: Manager  
    Trigger: WF-007 Friday 15:00  
    Critical: no

N18 Daily digest  
    Recipients: Manager  
    Trigger: company_config.daily_digest_time (default 18:00 weekdays)  
    Content: team hours summary, pending approvals count, unsubmitted timesheets  
    Critical: no  
    Channel: email only

============================================================  
SCREEN INVENTORY (from PRD v2.1 §11, updated for v3 terminology)  
============================================================

DEVELOPER SCREENS  
My Day (Goal Sheet)         Primary landing. Task picker, inline hours, side sheet, week view, planned-vs-actual, recurring items.  
My Work                     Assigned tickets and tasks. Status updates, comments, timer controls.  
Ticket Detail               Full ticket view: task checklist, comments, attachments, billing summary status.  
Task Detail                 Activity logging, description, comments, time history for this task.  
Draft Status                Developer-created items and their approval states.  
My Timesheets               Weekly timesheet view: submit, view flagged entries, resubmit.  
Notifications               In-app notification center.

MANAGER SCREENS  
Operations Queue            Primary landing. Tabs: Pending Approvals (Gate 1), Risk Monitoring, Billing Queue (Gate 3). All governance from one screen.  
Timesheet Review            List of submitted timesheets. Batch approve or flag individual entries (Gate 2).  
Tickets                     Full ticket list with filters, priority, status, billing summary state.  
Projects                    Project list with margin summary and engagement model indicator.  
Clients                     Client directory with engagement health and financial summary.  
Hour Blocks                 Block usage by client and project with alerts and projected depletion dates.  
KiCare                      KiCare tab within client profile: period card, exclude toggles, AI Analyse, surplus/deficit status.  
Client Report Review Queue  AI weekly status report drafts: review, edit, approve, send.  
Sprints / Milestones        Sprint planning, burndown chart, velocity. Milestone progress.  
Team Day Grid               Any-date view of developer goal sheets: capacity bars, exception signals, push-planning.

EXECUTIVE SCREENS  
Executive Dashboard         Primary landing. Six KPI cards (Revenue, Cost, Margin%, Utilisation, Idle Cost, Active Projects). Risk panel. 3-month trends.  
Profitability               Six-tab drill-down: By Project, By Client, By Group, By Developer, By Profit Centre, By Engagement Model.  
Resources / Utilisation     Resource utilisation matrix with effective rate and idle cost.  
KiCare Health Summary       Across all active KiCare clients. Loss/at-risk contracts flagged.  
Engagement Health           Hour block, KiCare, and credit exposure summary.  
Boss Chatbot (Phase 3)      Natural language Q&A over live data.

ADMIN SCREENS  
Admin Home                  Admin landing. Summary of open issues: pricing staleness, sync errors, security alerts.  
Clients & Projects          SINGLE-SCREEN (FR-17.10): left sidebar nav, vertical tabs, right contextual sidebar. Manages clients, projects, sub-projects, engagement model, pricing, contacts, subscriptions, document storage.  
Client Pricing              Admin-only: per-field current value, last updated/by, 90-day stale warning, full price history.  
Hosting Margin View         Client × product margin table. Highlights <30% margin or stale >90 days.  
Product Catalog             Global products (hosting, license, SSL, domain, other). Cost price admin-only.  
Invoices                    Invoice list/detail: void, credit-note adjustment lines, manual reminder send/suppress, record manual payments.  
Payments Log                All payments: method, amount, currency, timestamp, recordedBy, reference/transaction ID.  
Reports — Billable          Filterable report. Bar charts, drill-down, PDF export, shareable URL.  
Reports — Profit & Margin   CONFIDENTIAL. Admin only. PDF marked CONFIDENTIAL.  
Company Configuration       Singleton white-label/company settings, reminder schedule, targets, deadlines.  
User Management             Roles, developer profiles (rate, capacity, type), MCP API keys.  
FM Sync Monitor             WF-009 status: fm_sync_status per ticket/activity, staff mismatch alerts, manual retry trigger.

CLIENT PORTAL SCREENS (Phase 3 — C-1 must be resolved first)  
Portal Login                Email + password auth. Role = client, sees only own data.  
Invoices                    List with status/amount due/due date. Pay Now (Cayan). PDF download.  
Hour Blocks                 Active block burn bar. Past blocks with associated work orders.  
Work Orders                 Downloadable PDFs. No developer names. No internal costs.  
Projects                    Milestone status and progress only. No internal task detail.