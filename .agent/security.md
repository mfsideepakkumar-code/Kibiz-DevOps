\# security.md — KiBiz Platform Security Rules  
\# Agents: these are the rules most commonly broken. Read before touching auth, APIs, or payments.

\#\# RBAC — enforced server-side on every route and RPC

Roles: developer | project\_lead | manager | executive | admin | client (inert until C-1)  
Silence \= deny. If a permission is not explicitly granted, it is denied.

DEVELOPER  
\- Own time entries (create, edit draft)  
\- Own tasks (view, status updates)  
\- Own goal sheet  
\- Own timesheets (submit, resubmit)  
\- Gate 1: create tickets/tasks/bugs via approval queue  
\- Self-approve internal non-billable activities under configured threshold (default 2h)  
\- View own billable vs non-billable stats only

PROJECT LEAD  
\- All developer permissions  
\- Approve tasks \+ time entries within own projects only  
\- View project-scoped ticket and activity data

MANAGER  
\- All project lead permissions (org-wide)  
\- Full ticket/task/bug approval (Gate 1\)  
\- Timesheet review and approval (Gate 2\)  
\- Billing summary approval (Gate 3\)  
\- Send/suppress payment reminders (from invoice screen — not a separate "admin" screen)  
\- Sprint and milestone management  
\- Review and send AI weekly client status reports  
\- Push-planning on developer goal sheets  
\- View all team time, billable stats, engagement health  
\- Generate invoices (draft and send)  
\- Does NOT see: costPrice, cost\_rate\_per\_hour, true margin figures, confidential PDF

EXECUTIVE  
\- Read-only access to all analytics including true margin and burnout (once those ship)  
\- Executive dashboard \+ all profitability drill-downs  
\- KiCare health summary  
\- Boss chatbot  
\- No mutations except own profile

ADMIN  
\- All manager permissions  
\- Edit client\_pricing (admin-only screen)  
\- View and edit products.cost\_price  
\- Void invoices \+ add credit note adjustment lines  
\- Record manual payments (Zelle, e-transfer, cheque)  
\- Download CONFIDENTIAL profit/margin PDF  
\- Period lock management  
\- company\_config management  
\- User management \+ role assignment  
\- MCP API key management  
\- View fm\_sync\_status errors and trigger manual retry  
\- Sole role that receives system\_error notifications from WF-008

CLIENT (inert — C-1 hard block)  
\- Schema flags exist (has\_portal\_access on client\_contacts)  
\- RLS policies written but DISABLED  
\- No login, no routes, no UI until C-1 is formally resolved

\#\# Field-level protection (in RPC/view definitions — never UI-only)

The following fields MUST be ABSENT (not null, not zero — absent) from API responses for non-admin roles.  
Automated test in evals asserts absence on each role.

\- users.cost\_rate\_per\_hour  
\- project\_rates.cost\_rate\_per\_hour  
\- products.cost\_price  
\- v\_hosting\_margins.cost\_price, margin, margin\_percent (non-admin gets price only)  
\- v\_true\_margin (entire view — admin \+ executive only after finance sign-off)  
\- report\_snapshots where type \= profit\_margin (admin only)  
\- resources.monthly\_rate (executive \+ admin only)  
\- burnout scores and inputs (executive \+ admin only once implemented)

Enforcement location: Postgres RLS policies \+ RPC function WHERE clauses \+ view column lists.  
Never enforce with UI conditional rendering alone.

\#\# Supabase-specific rules

\- RLS ENABLED on every table. No exceptions. Test with \`supabase db lint\`.  
\- Service-role key: server-side only. Never in client bundle, never in env files committed to git.  
\- Anon key: only for unauthenticated public routes (none currently; note this if any are added).  
\- Row policies:  
  \- developers: SELECT time\_entries WHERE user\_id \= auth.uid()  
  \- project leads: SELECT time\_entries WHERE project\_id IN (their projects)  
  \- manager/admin/executive: SELECT time\_entries (all rows)  
  \- client role policies: written but DISABLED (condition: has\_portal\_access \= true AND client\_id \= auth.jwt() \-\>\> 'client\_id')  
\- Storage buckets:  
  \- invoices/: authenticated users; clients see only their own invoice PDFs (inert until C-1)  
  \- work-orders/: same as invoices  
  \- attachments/: project-scoped read; manager/admin write  
  \- logos/: admin write; public read (for email headers)  
  \- reports/: admin/executive read; signed URLs, 24h expiry  
\- Signed URL expiry: 24 hours for all PDF report downloads. Generate fresh URL on each request.

\#\# Payment security (Cayan)

Card data: NEVER stored, logged, or transited through KiBiz servers. Cayan-hosted page handles everything.  
ACH data: entered on Cayan's page only.  
Zelle: KiBiz only displays instructions. Admin manually records receipt. No financial data exchanged.

Webhook endpoint (/api/webhooks/cayan):  
\- Verify Cayan HMAC signature on every request before processing. Reject without 200 if invalid.  
\- Idempotency: check payments.cayan\_transaction\_id UNIQUE constraint before inserting. On conflict \= 200 no-op (not an error — Cayan retries are expected).  
\- Never trust browser redirect for payment confirmation. Webhook is the only source of truth.  
\- Rate limit: 100 requests/minute per IP.  
\- IP allowlist: add Cayan webhook IP ranges if Cayan publishes them.

PCI posture: Cayan-hosted page \+ no card storage \= SAQ A eligible. ACH path \+ webhook endpoint still require security review before Phase 2 ships. Log this as a Phase 2 gate item.

\#\# Audit & immutability

audit\_logs: INSERT-only. Revoke UPDATE and DELETE grants from all roles including service role:  
  REVOKE UPDATE, DELETE ON audit\_logs FROM authenticated, service\_role;

Append-only arrays (never overwrite existing elements, only push):  
  client\_pricing.price\_history  
  time\_entries.edit\_history  
  hour\_blocks.alerts\_sent

Immutable fields (set once, never updated):  
  invoices.invoice\_no  
  time\_entries.rate\_applied (set at invoice time; null until then)  
  payments.cayan\_transaction\_id

Period locks:  
  Locked time entries (state \= locked): reject mutations at RPC level (not UI level).  
  Admin override: requires void\_reason text, creates audit\_log entry, then allows edit.  
  Void of locked-period invoice: returns entries to unbilled in current period (not the locked period).

\#\# MCP server security (Phase 3\)

Scoped API keys: stored as bcrypt hash (mcp\_api\_keys.key\_hash). Plaintext shown once on creation only.  
Scope enforcement: same RPC functions as web — one enforcement path, not a separate code branch.  
Fields stripped per scope:  
  read\_only: no mutations; cost/margin/burnout absent  
  manager: no admin-gated fields (costPrice, true margin, confidential PDF)  
  billing: only invoice/payment/reminder tools; no analytics  
  admin: full access

Every call logged to mcp\_audit\_log (sanitize PII from params before logging).  
Revocation: is\_active \= false, effective immediately (checked on every request before scope check).  
Rate limit per key: configurable in company\_config; default 60 req/min.

\#\# NFR proposals (need stakeholder sign-off)

Backups: Supabase PITR (point-in-time recovery) \+ weekly export to separate cloud account  
Retention: financial records 7 years; audit\_logs 7 years; notifications 1 year; report\_snapshots 3 years  
Encryption: at rest (Supabase default AES-256); TLS 1.2+ everywhere  
Sessions: 8h idle expiry; refresh token rotation on each use  
Rate limits: auth endpoints 5 req/min/IP with 15-min lockout; webhook endpoints budgeted per-key  
MFA: required for admin role; optional for others  
Browser support: last 2 major versions of Chrome, Firefox, Safari, Edge  
Uptime target: 99.5% (Supabase SLA covers the majority)  
DR: RTO 24h / RPO 1h (validate with Supabase PITR settings)

\#\# Security review gates (must complete before phase ships)

End of Phase 1:  
  \[ \] RLS policies verified with supabase db lint  
  \[ \] Per-role API field audit automated test green (cost/margin fields absent for non-admin)  
  \[ \] Service-role key confirmed absent from all client-side code and committed files  
  \[ \] audit\_logs UPDATE/DELETE revoked and tested

End of Phase 2 (before Cayan goes live):  
  \[ \] Cayan webhook HMAC signature verification implemented and tested  
  \[ \] Idempotency test: fire same payment webhook twice, confirm one payment record  
  \[ \] PCI SAQ A self-assessment completed  
  \[ \] ACH data path reviewed (Cayan handles; confirm no logging on our side)  
  \[ \] Rate limiting on webhook endpoint active  
  \[ \] Penetration test or security review on payment routes