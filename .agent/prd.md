KIBIZ PLATFORM — WORKING DOC  
v3.1 Decisions · Phase Plan · ClickUp Phase-Out · FM Sync Design (WF-009)  
Date: 10 June 2026 · Owner: Raman · Status: FM script confirmed, n8n JSON finalized

============================================================  
1. ARCHITECTURAL DECISIONS LOG  
============================================================

All Architectural Decision Records (ADRs) are logged and tracked in [.agent/DECISIONS.md](file:///Volumes/X9%20Pro/Node%20JS/KiBiz%20Dev%20Ops/.agent/DECISIONS.md). 

Refer to that document for:
* **ADR-007 through ADR-020**: Detailed architectural choices, rationales, and hard blocks (Auth, Supabase, Terminology, FM sync units, etc.).
* **ADR-021 through ADR-026**: Decisions resolved from original project queries (overdue invoices, billing configs, single-screen layouts, and permission boundaries).
* **Pending Decisions**: Stakeholder conflicts (C-1, C-2, etc.) and open questions (OQ-1, OQ-2, etc.).

\============================================================  
2\. MANAGER APPROVAL — THREE GATES  
\============================================================  

GATE 1 (work items — dev-created only): manager/admin-created auto-approved. Dev-created → queue (approve/edit/reject/merge/convert). Dev may start immediately; time logs as Draft. Picking existing approved ticket/task \= no approval. Internal non-billable \<2h \= self-approved.

GATE 2 (activities — every entry): all activities start Draft. Weekly timesheet auto-assembles → dev submits Fri → manager reviews Mon (one-click approve or flag with reason) → dev resolves/resubmits. APPROVED \= billing-eligible; feeds blocks, credit, KiCare. Project leads approve within own projects.

GATE 3 (billing — per ticket): tasks Done → AI billing summary → manager APPROVE/EDIT/RETURN → Ready to bill. Separate audit trail from Gate 2\.

Net: zero friction on planned pre-defined work. Approvals only touch new scope and money.

\============================================================  
3\. HOUR BLOCKS — DRAWDOWN RULES  
\============================================================  
Client-level: client\_id, total\_hours, rate, status, activated\_at, linked\_project\_ids\[\] (NULL \= all client projects).  
ELIGIBLE \= activities that are (1) APPROVED, (2) BILLABLE, (3) on eligible project, (4) not drawn/invoiced.  
Multiple blocks: FIFO by activated\_at; depleted → next auto.  
Manager overrides: PIN ticket to block, or EXCLUDE ticket from drawdown.  
Over 100%: overrun flag, manager approval before more work, create/refill shortcut.  
Alerts 50/80/95/100; depletion date projected from 80%+; alerts\_sent\[\] dedup.  
Purchase/refill \= standard invoice; activates on paid.

\============================================================  
4\. PHASE SUMMARIES  
\============================================================

PHASE 1 — FOUNDATION  
1\. Supabase project, CI, repo with .agent/ workspace  
2\. Auth & RBAC: Supabase Auth; 5 roles (client inert); RLS everywhere; server-side checks; landings dev→My Day, mgr→Ops Queue, exec→Dashboard, admin→Admin Home  
3\. Full schema via CLI migrations \+ generated types — no ORM  
4\. Design system FIRST (shadcn tokens, formatters, component kit)  
5\. Single-screen admin: left nav, vertical tabs, right info/docs sidebar  
6\. Client pricing (admin-only, per-field audit \+ stale warning)  
7\. Tickets/tasks/bugs full lifecycles; Gate 1 queue  
8\. Activities (time entries): duration-first, raw minutes, rounding at invoice only, splits as AI-flagged exception, per-state edit rights  
9\. Web timers: one/user, midnight auto-split, 12h auto-stop. No idle detection.  
10\. Goal Sheet (My Day): pick approved tasks, quick-add, future dates \+ week drag, timer→planned-vs-actual, inline hours \+ Done, side sheet \+ AI refinement, end-of-day carry/reschedule/drop  
11\. Manager team-day grid: any date, capacity bars, exception signals, push-planning  
12\. Timesheets (Gate 2): auto-weekly, deadlines, flag/resubmit  
13\. Basic AI billing summaries (Gate 3 queue)  
14\. Dashboards on Postgres views  
15\. Evals harness \+ golden datasets \+ product-metric instrumentation  
16\. WF-009 FM sync build starts end of P1

PHASE 2 — ENGAGEMENT & BILLING  
1\. Hour blocks (Section 3 rules \+ projections \+ refill)  
2\. Pay-as-billed credit limits (70/90/100, bill-now escalation)  
3\. KiCare: classification \+ client-profile tab (ADR-019)  
4\. AI classification suite (category \+ profit centre independent; governance enforced)  
5\. Invoicing: enum, immutable numbering, assembly, void, credit notes  
6\. Rate resolution \+ rateApplied snapshot  
7\. Cayan payments: /pay/\[token\], card \+ ACH, Zelle, manual methods, webhook-only truth  
8\. Payment reminders: \-3d/due/+7/+14/+30, configurable, logged  
9\. Products & subscriptions: catalog, renewal auto-invoicing, hosting margins  
10\. Reports: billable/non-billable, profit & margin, CONFIDENTIAL PDF, snapshot-backed  
11\. WF-009 LIVE \+ ClickUp parallel run (Stages 1-2)

PHASE 3 — INTELLIGENCE & INTEGRATION  
1\. Client portal (C-1): login, RLS, invoices, blocks, work orders, milestones  
2\. MCP server: scoped keys, full tool families, audit log  
3\. Boss chatbot over MCP tools  
4\. AI weekly client status reports (manager-gated)  
5\. Email/transcript ingestion → ticket intake  
6\. Advanced exec trends, automation rules, predictive alerts  
7\. ClickUp DECOMMISSION (Stage 3\)

WORKFLOWS (all idempotent \+ double-delivery tested):  
WF-001 block thresholds · WF-002 credit exposure · WF-003 reminders 08:00 · WF-004 subscription invoicing 06:00 · WF-005 KiCare projection Mon 07:00 · WF-006 recurring goal items 00:05 · WF-007 Friday client reports 15:00 · WF-008 nightly integrity 02:00 · WF-009 FM sync

\============================================================  
5\. FM SYNC (WF-009) — CONFIRMED FROM SCRIPT \+ n8n JSON  
\============================================================

5.1 FM SCRIPT CONFIRMED ("Automate Activity Creation" on Activity\_\_Web)

HOURS UNIT: MILLISECONDS confirmed.  
Script line: $Hours \= Let(tt \= JSONGetElement($pJSON;"Hours"); Case(tt\>0; Round(tt/3600000;2); 0))  
WF-009 MUST send milliseconds. n8n converts: platform minutes × 60000 → ms.  
In n8n payload node: "Hours": "={{ $json.body.activity.minutes \* 60000 }}"

FIELD MAPPING (note the swap — do not "fix" this):  
\- JSONGetElement($pJSON;"Summary") → $BillingNotes (task TITLE goes to FM BillingNotes field)  
\- JSONGetElement($pJSON;"Notes") → $Description (task DESCRIPTION goes to FM Description field)  
This is intentional contract behaviour. Preserve it.

STAFF LOOKUP: ExecuteSQL("Select StaffID FROM Staff Where Email\_ClickUp \= ?"; $Staff)  
with hardcoded exception PatternCount($Staff;"priya") → 1009\.  
ACTION: seed every platform user's email into Staff::Email\_ClickUp before WF-009 goes live.  
On no-match, activity lands with blank StaffID silently — add a validation step to n8n: if response scriptError ≠ "0" AND response data\[0\].fieldData.StaffID is empty → flag fm\_sync\_status \= staff\_mismatch \+ admin alert.  
Optional: fix Priya's Email\_ClickUp and remove the hardcode. Not blocking.

BILLABLE LABELS: exactly "Billable" / "Non-Billable" (with hyphen). These are the only values the platform sends.

DUPLICATE GUARD: confirmed present in FM script.  
Enter Find Mode → Set Field \[Activity::ClickUp\_Act; "=="&$ClickUpID\] → Perform Find  
If Get(LastError)=0: record found \= duplicate → skip (sets $Found=1, continues to set fields on existing record)  
Else: New Record/Request  
WF-009 retries are safe — exact-match dedup on ClickUp\_Act field.

External\_Ticket\_ID FIELD ERROR: field does not yet exist in Ticket\_\_Web layout in FM.  
FIX: remove the External\_Ticket\_ID line from the fm-create-ticket n8n node for now.  
LATER (Phase 1 cleanup task T-FM-01): add External\_Ticket\_ID field to Ticket\_\_Web in FM for cleaner future reporting. Non-blocking.

5.2 FINAL n8n WF-009 WORKFLOW — IMPORT-READY

Key changes from draft:  
\- Hours node sends minutes × 60000 (milliseconds)  
\- External\_Ticket\_ID line removed from fm-create-ticket node  
\- Staff mismatch detection on activity response  
\- Billable enum values locked to "Billable" / "Non-Billable"

PAYLOAD CONTRACT (platform → n8n webhook):

// Ticket approved (Gate 1):  
POST /webhook/kibiz-fm-sync  
{  
  "event": "ticket.approved",  
  "ticket": {  
    "externalId": "platform-uuid",  
    "fmClientId": "1042",  
    "title": "Fix login redirect",  
    "description": "Long description...",  
    "billingTypeLabel": "Billable",  
    "categoryLabel": "Bug Fix"  
  }  
}  
// Response stored on tickets.fm\_ticket\_id

// Activity approved (Gate 2):  
POST /webhook/kibiz-fm-sync  
{  
  "event": "activity.approved",  
  "activity": {  
    "externalId": "entry-uuid",  
    "fmTicketId": "20231",  
    "staffEmail": "dev@kibiz.com",  
    "minutes": 90,  
    "notes": "Description text",  
    "summary": "Task title",  
    "billableLabel": "Billable",  
    "tags": \["urgent"\]  
  }  
}

SCHEMA ADDITIONS (P1 migration):  
clients.fm\_client\_id         text     \-- "KiClient ID" from FM  
tickets.fm\_ticket\_id         text     \-- FM-generated TicketID written back after create  
time\_entries.fm\_synced\_at    timestamptz  
time\_entries.fm\_sync\_status  text     \-- synced | error | staff\_mismatch | pending

5.3 PHASE-OUT STAGES

STAGE 0 (NOW):  
\- ClickUp \+ existing n8n sync untouched  
\- ROTATE the exposed ClickUp API token (pk\_67350671\_... visible in the n8n JSON pasted in chat). Do this today.  
\- Confirm fm\_client\_id values for each client from FM (KiClient ID field)  
\- Confirm Staff::Email\_ClickUp coverage for all developers

STAGE 1 (end P1 / start P2):  
\- WF-009 live alongside old ClickUp sync  
\- New work created in platform; legacy projects keep ClickUp  
\- Nightly reconciliation running

STAGE 2 (P2) — CUTOVER CRITERIA:  
\- 2-week pilot: ≥85% same-day logging, create-to-submit \<60s  
\- All active client work in platform  
\- WF-009 reconciliation clean 2 consecutive weeks  
Then: freeze new ClickUp tickets → migrate open tickets (list/space→project, task→ticket, subtask→task, time→activities marked legacy) → old sync OFF

STAGE 3 (P3):  
\- ClickUp read-only 30 days → full export archived to Supabase Storage → cancel seats  
\- FM sync continues until C-2 end-state

\============================================================  
6\. REMAINING INPUTS NEEDED FROM RAMAN  
\============================================================  
\- KiClient ID values per client (seeds clients.fm\_client\_id)  
\- Staff::Email\_ClickUp audit — list of developers \+ their FM email values  
\- Cayan account \+ API keys · email provider \+ DKIM (OQ-15)  
\- Final profit centre list · confirmed category list  
\- Per-client pricing seed data · resource monthly rates \+ capacity  
\- KiCare contract amounts \+ periods per client  
\- \~200 labelled FM tickets (categories) \+ \~150 (profit centres) for eval golden sets — Ticket\_\_Web \+ Activity\_\_Web history is the source  
\- company\_config values (invoice prefix, tax label/rate, currency, payment terms, billing day, deadlines)  
\- OQ-1 (original dashboard PRD / burnout formulas), OQ-2 (v1.1 addendum), OQ-21  
\- Finance sign-off on true-margin cost model before that report ships

END OF DOCUMENT