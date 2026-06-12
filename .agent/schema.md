\# schema.md — KiBiz Platform Workspace Schema Map  
\# This IS the "Workspace MD" required by Doc C.  
\# Update in the SAME PR as any migration. Drift \= blocked CI.  
\# Conventions: snake\_case tables, camelCase in TS via generated types.  
\# Money: numeric(12,2). Durations: integer MINUTES (raw, unrounded).  
\# Rounding happens at invoice time only via client\_pricing.billing\_increment.

\#\# Hierarchy  
Client → Project → SubProject? (aka SOW) → Ticket → Task → time\_entries (Activities)  
HourBlock is CLIENT-level — not part of the ticket hierarchy.  
Sub\_projects is optional — tickets may attach to project OR sub\_project directly.

\#\# Identity & configuration

users  
  id uuid PK  
  name text  
  email text UNIQUE  
  role text CHECK role IN (developer, project\_lead, manager, executive, admin, client)  
  resource\_id uuid FK resources  
  billing\_rate\_per\_hour numeric(12,2)  
  cost\_rate\_per\_hour numeric(12,2)   \-- ADMIN-READ ONLY, stripped from all non-admin API responses  
  is\_active boolean DEFAULT true  
  fm\_email text                       \-- must match Staff::Email\_ClickUp in FM for WF-009

resources  
  id uuid PK  
  name text  
  type text  
  monthly\_rate numeric(12,2)  
  capacity\_hours numeric(6,2)        \-- for effective hourly cost \= monthly\_rate / capacity\_hours

company\_config   \-- SINGLETON, exactly one row, seed on first deploy  
  id uuid PK  
  company\_name text  
  logo\_url text  
  address text  
  phone text  
  email text                         \-- outgoing email from-address  
  website text  
  default\_currency text DEFAULT 'CAD'  
  default\_payment\_terms\_days int DEFAULT 30  
  invoice\_prefix text DEFAULT 'KB-'  
  tax\_label text  
  tax\_rate numeric(5,4)  
  fiscal\_year\_start text             \-- e.g. '01-01'  
  work\_week\_start text DEFAULT 'monday'  
  billable\_target\_percent int DEFAULT 80  
  profit\_margin\_target int DEFAULT 40  
  timesheet\_submit\_deadline text     \-- e.g. 'FRI\_17:00'  
  timesheet\_review\_deadline text     \-- e.g. 'MON\_12:00'  
  daily\_digest\_time text DEFAULT '18:00'  
  monthly\_billing\_day int DEFAULT 1  \-- OQ-11: company-wide default  
  reminder\_schedule jsonb            \-- { minus3d, due, plus7, plus14, plus30 } on/off \+ day offsets

profit\_centers  
  id uuid PK  
  name text                          \-- e.g. Development Income, License Income, Hosting Income, Support/KiCare, Internal R\&D  
  description text  
  is\_active boolean DEFAULT true

categories  
  id uuid PK  
  name text                          \-- new\_feature | support | bug\_fix | change\_request | testing\_qa | research | meeting\_client | meeting\_internal | admin  
  default\_billable boolean

\#\# Clients & pricing

clients  
  id uuid PK  
  name text  
  engagement\_model text CHECK IN (hour\_block, pay\_as\_billed, kicare)  
  industry text  
  is\_active boolean DEFAULT true  
  fm\_client\_id text                  \-- "KiClient ID" in FM; seeds ID\_Project in Ticket\_\_Web sync

client\_contacts  
  id uuid PK  
  client\_id uuid FK clients  
  name text  
  email text  
  phone text  
  is\_primary boolean  
  receives\_invoices boolean DEFAULT false  
  receives\_reports boolean DEFAULT false  
  has\_portal\_access boolean DEFAULT false   \-- inert until C-1 resolved

client\_pricing   \-- 1:1 with clients, admin-only edit  
  client\_id uuid PK FK clients  
  hourly\_rate numeric(12,2)  
  hosting\_price numeric(12,2)  
  hosting\_cycle text CHECK IN (monthly, annual)  
  filemaker\_license\_price numeric(12,2)  
  filemaker\_license\_cycle text CHECK IN (monthly, annual)  
  billing\_increment text DEFAULT 'exact' CHECK IN (exact, 6min, 15min)  
  notes text  
  updated\_at timestamptz DEFAULT now()  
  updated\_by uuid FK users  
  price\_history jsonb\[\] DEFAULT '{}'   \-- APPEND-ONLY: {field, old\_value, new\_value, updated\_at, updated\_by}

client\_credit\_policies  
  client\_id uuid PK FK clients  
  credit\_limit numeric(12,2)  
  alert\_thresholds int\[\] DEFAULT '{70,90,100}'  
  \-- current\_exposure is DERIVED via v\_unbilled\_exposure view, not stored

\#\# Projects & work hierarchy

projects  
  id uuid PK  
  client\_id uuid FK clients  
  name text  
  status text CHECK IN (active, on\_hold, completed, archived)  
  sow\_hours numeric(8,2)  
  default\_rate\_per\_hour numeric(12,2)  
  default\_profit\_center\_id uuid FK profit\_centers  
  is\_internal boolean DEFAULT false

sub\_projects   \-- OPTIONAL level, aka SOW  
  id uuid PK  
  project\_id uuid FK projects  
  name text  
  sow\_hours numeric(8,2)  
  status text CHECK IN (active, on\_hold, completed, archived)  
  start\_date date  
  end\_date date  
  notes text

project\_rates   \-- per-developer per-project overrides, multiple rows allowed  
  id uuid PK  
  project\_id uuid FK projects  
  user\_id uuid FK users  
  billing\_rate\_per\_hour numeric(12,2)  
  cost\_rate\_per\_hour numeric(12,2)  
  effective\_from date                \-- entries before this date use previous rate row

sprints   \-- optional, one active per project  
  id uuid PK  
  project\_id uuid FK projects  
  name text  
  status text CHECK IN (planned, active, completed)  
  start\_date date  
  end\_date date  
  goal text

milestones   \-- independent of sprints  
  id uuid PK  
  project\_id uuid FK projects  
  name text  
  description text  
  target\_date date  
  target\_hours numeric(8,2)  
  status text CHECK IN (pending, in\_progress, completed)  
  completed\_at timestamptz

tickets   \-- billing unit  
  id uuid PK  
  ticket\_no text UNIQUE             \-- human-readable, e.g. TKT-0042  
  project\_id uuid FK projects  
  sub\_project\_id uuid FK sub\_projects  \-- nullable: tickets attach to project OR sub\_project  
  title text NOT NULL  
  description text  
  status text CHECK IN (draft, pending\_approval, approved, in\_progress, blocked, done, ready\_to\_bill, closed, rejected)  
  priority text CHECK IN (p0, p1, p2, p3)  
  escalation\_level int DEFAULT 0  
  category\_id uuid FK categories NOT NULL  
  profit\_center\_id uuid FK profit\_centers   \-- overrides project default when set  
  billing\_type text CHECK IN (billable, non\_billable)  
  fm\_ticket\_id text                  \-- FM-generated TicketID, written back by WF-009 on ticket approval  
  created\_by uuid FK users  
  created\_at timestamptz DEFAULT now()  
  updated\_at timestamptz DEFAULT now()

tasks   \-- execution unit (formerly subtask)  
  id uuid PK  
  ticket\_id uuid FK tickets  
  title text NOT NULL  
  description text  
  assignee\_id uuid FK users  
  status text CHECK IN (draft, pending\_approval, approved, in\_progress, blocked, done, archived)  
  priority text CHECK IN (p0, p1, p2, p3)  
  estimated\_hours numeric(6,2)       \-- for sprint burndown and goal sheet pre-fill  
  sprint\_id uuid FK sprints  
  milestone\_id uuid FK milestones  
  activity\_type text                 \-- CLIENTBILLABLE | CLIENTNONBILLABLE | INTERNALPRODUCTRD | PMMANAGEMENT | SALESBD | INNOVATIONRD | OPERATIONSADMIN | LEARNING  
  created\_by uuid FK users  
  created\_at timestamptz DEFAULT now()

bugs  
  id uuid PK  
  project\_id uuid FK projects  
  title text  
  description text  
  reporter\_id uuid FK users  
  triage\_status text CHECK IN (pending, approved, merged, converted, rejected)  
  converted\_to\_type text            \-- ticket | task  
  converted\_to\_id uuid  
  duplicate\_of\_id uuid FK tickets  
  created\_at timestamptz DEFAULT now()

\#\# Time & activities

time\_entries   \-- UI label: Activities  
  id uuid PK  
  task\_id uuid FK tasks              \-- nullable: project-level entries allowed with required description  
  project\_id uuid FK projects        \-- denormalised  
  ticket\_id uuid FK tickets          \-- denormalised for KiCare \+ block drawdown queries  
  user\_id uuid FK users  
  work\_date date NOT NULL  
  duration\_minutes int NOT NULL CHECK duration\_minutes \> 0  
  start\_time timestamptz             \-- set by timer only, not required for manual  
  end\_time timestamptz               \-- set by timer only  
  state text CHECK IN (draft, submitted, approved, rejected, billed, void, locked) DEFAULT 'draft'  
  billable boolean NOT NULL  
  billable\_label text                \-- "Billable" | "Non-Billable" — exact FM-contract values  
  description text                   \-- required when billable \= true  
  activity\_type text                 \-- inherits from task, overridable  
  rate\_applied numeric(12,2)         \-- IMMUTABLE, stamped at invoice time only  
  invoice\_id uuid FK invoices        \-- set when included on invoice  
  edit\_history jsonb\[\] DEFAULT '{}'  \-- APPEND-ONLY: {field, old\_value, new\_value, edited\_by, edited\_at}  
  fm\_synced\_at timestamptz           \-- set by WF-009 on successful sync  
  fm\_sync\_status text DEFAULT 'pending' CHECK IN (pending, synced, error, staff\_mismatch)  
  local\_id uuid                      \-- client-generated for timer dedup  
  created\_at timestamptz DEFAULT now()

splits   \-- profit-centre split, exception path only; AI-triggered  
  id uuid PK  
  time\_entry\_id uuid FK time\_entries  
  profit\_center\_id uuid FK profit\_centers  
  percent numeric(5,2) NOT NULL  
  billable boolean  
  \-- CONSTRAINT: sum of percent per time\_entry\_id \= 100 (enforced by nightly integrity job WF-008)

timer\_state   \-- one row per user, web start/stop only  
  user\_id uuid PK FK users  
  task\_id uuid FK tasks  
  started\_at timestamptz  
  accumulated\_seconds int DEFAULT 0  
  \-- midnight auto-split handled by WF-006; 12h auto-stop \+ flag handled server-side

goal\_items   \-- the daily plan; writes ordinary draft time\_entries on log  
  id uuid PK  
  user\_id uuid FK users  
  date date NOT NULL  
  task\_id uuid FK tasks              \-- null only for quick-adds (task created immediately after)  
  planned\_minutes int  
  sort\_order int  
  status text CHECK IN (planned, in\_progress, done, carried, dropped) DEFAULT 'planned'  
  carried\_from\_date date             \-- chains carry-over history  
  added\_by uuid FK users             \-- self or manager (push-planning)  
  removal\_reason text                \-- required when removing manager-pushed items  
  recurring\_template\_id uuid FK recurring\_templates  
  UNIQUE (user\_id, date, task\_id)

recurring\_templates   \-- recurring meetings v1 (ADR-015)  
  id uuid PK  
  user\_id uuid FK users              \-- null \= team-wide  
  title text  
  ticket\_id uuid FK tickets  
  task\_id uuid FK tasks  
  days\_of\_week int\[\]                 \-- 0=Sun, 1=Mon ... 6=Sat  
  default\_minutes int  
  activity\_type text  
  billable boolean DEFAULT false  
  is\_active boolean DEFAULT true

timesheets   \-- auto-created on first activity of the week  
  id uuid PK  
  user\_id uuid FK users  
  week\_start date NOT NULL  
  status text CHECK IN (draft, submitted, flagged, approved, billed) DEFAULT 'draft'  
  submitted\_at timestamptz  
  reviewed\_by uuid FK users  
  reviewed\_at timestamptz  
  review\_note text  
  approved\_at timestamptz  
  billed\_at timestamptz  
  UNIQUE (user\_id, week\_start)

\#\# Engagement models

hour\_blocks  
  id uuid PK  
  client\_id uuid FK clients  
  linked\_project\_ids uuid\[\]          \-- NULL \= all client projects eligible  
  total\_hours numeric(8,2)  
  rate numeric(12,2)  
  status text CHECK IN (pending\_payment, active, depleted, cancelled) DEFAULT 'pending\_payment'  
  activated\_at timestamptz           \-- set on invoice paid; FIFO drawdown key  
  depleted\_at timestamptz  
  alert\_thresholds int\[\] DEFAULT '{50,80,95,100}'  
  alerts\_sent int\[\] DEFAULT '{}'     \-- tracks which thresholds have fired; idempotency guard  
  invoice\_id uuid FK invoices  
  notes text  
  created\_by uuid FK users  
  created\_at timestamptz DEFAULT now()

hour\_block\_drawdowns  
  id uuid PK  
  hour\_block\_id uuid FK hour\_blocks  
  time\_entry\_id uuid FK time\_entries  
  hours\_drawn numeric(6,2)  
  drawn\_at timestamptz DEFAULT now()

kicare\_contracts  
  id uuid PK  
  client\_id uuid FK clients  
  project\_ids uuid\[\]  
  contract\_amount numeric(12,2)  
  start\_date date NOT NULL  
  end\_date date NOT NULL  
  scope\_definition text  
  renewal\_date date  
  \-- profitability \= contract\_amount \- (sum non-billable hours × client hourly\_rate)  
  \-- bucket scope: C-3 config flag kicare\_buckets\_counted \= 'a' | 'a\_b' in company\_config

work\_orders  
  id uuid PK  
  hour\_block\_id uuid FK hour\_blocks  
  client\_id uuid FK clients  
  work\_order\_no text UNIQUE  
  date\_from date  
  date\_to date  
  snapshot jsonb                     \-- point-in-time data for reproducible PDF  
  pdf\_path text  
  sent\_at timestamptz  
  sent\_to text\[\]  
  created\_by uuid FK users  
  created\_at timestamptz DEFAULT now()

\#\# Billing & invoicing

billing\_summaries  
  id uuid PK  
  ticket\_id uuid FK tickets UNIQUE  
  summary\_text text                  \-- client-facing  
  internal\_detail text               \-- accounting only  
  generated\_by text DEFAULT 'ai'  
  approved\_by uuid FK users  
  approved\_at timestamptz  
  status text CHECK IN (draft, approved, returned) DEFAULT 'draft'

invoices  
  id uuid PK  
  invoice\_no text UNIQUE NOT NULL    \-- prefix \+ counter, IMMUTABLE, never reused  
  client\_id uuid FK clients  
  status text CHECK IN (draft, sent, partial, paid, void) DEFAULT 'draft'  
  \-- overdue is DERIVED: due\_date \< today AND amount\_due \> 0 — not a stored status  
  currency text DEFAULT 'CAD'  
  subtotal numeric(12,2)  
  tax\_amount numeric(12,2) DEFAULT 0  
  tax\_label text  
  total numeric(12,2)  
  amount\_paid numeric(12,2) DEFAULT 0  
  amount\_due numeric(12,2) GENERATED ALWAYS AS (total \- amount\_paid) STORED  
  issue\_date date  
  due\_date date  
  portal\_token text UNIQUE  
  pdf\_path text  
  internal\_notes text  
  void\_at timestamptz  
  void\_by uuid FK users  
  void\_reason text  
  created\_by uuid FK users  
  created\_at timestamptz DEFAULT now()

invoice\_lines  
  id uuid PK  
  invoice\_id uuid FK invoices  
  type text CHECK IN (time\_entry, product, fixed, adjustment)  
  time\_entry\_id uuid FK time\_entries  
  product\_id uuid FK products  
  description text NOT NULL  
  qty numeric(10,2)  
  unit\_price numeric(12,2)  
  amount numeric(12,2) GENERATED ALWAYS AS (qty \* unit\_price) STORED  
  profit\_center\_id uuid FK profit\_centers  
  is\_included boolean DEFAULT true  
  sort\_order int  
  \-- adjustment type: amount will be negative (credit note); description required

payments  
  id uuid PK  
  invoice\_id uuid FK invoices  
  method text CHECK IN (credit\_card, ach, zelle, e\_transfer, cheque, manual)  
  amount numeric(12,2)  
  currency text DEFAULT 'CAD'  
  paid\_at timestamptz  
  cayan\_transaction\_id text UNIQUE   \-- idempotency key for webhook re-delivery  
  reference\_note text  
  recorded\_by uuid FK users  
  receipt\_sent\_at timestamptz  
  created\_at timestamptz DEFAULT now()

payment\_reminders  
  id uuid PK  
  invoice\_id uuid FK invoices  
  type text CHECK IN (due\_soon, due\_today, overdue\_7, overdue\_14, overdue\_30, manual)  
  sent\_at timestamptz DEFAULT now()  
  sent\_to text\[\]

\#\# Products & subscriptions

products  
  id uuid PK  
  name text  
  description text  
  category text CHECK IN (hosting, license, ssl, domain, other)  
  unit\_price numeric(12,2)  
  cost\_price numeric(12,2)           \-- ADMIN-ONLY, stripped from non-admin responses  
  billing\_cycle text CHECK IN (monthly, annual, one\_time)  
  profit\_center\_id uuid FK profit\_centers  
  is\_active boolean DEFAULT true

client\_subscriptions  
  id uuid PK  
  client\_id uuid FK clients  
  product\_id uuid FK products  
  qty numeric(8,2) DEFAULT 1  
  unit\_price\_override numeric(12,2)  \-- overrides product.unit\_price; pre-populated from client\_pricing  
  renewal\_date date  
  billing\_day\_override int           \-- overrides company\_config.monthly\_billing\_day  
  auto\_renew boolean DEFAULT true  
  auto\_send\_invoice boolean DEFAULT false  
  created\_at timestamptz DEFAULT now()

\#\# Operations & audit

approvals  
  id uuid PK  
  item\_type text CHECK IN (ticket, task, bug, time\_entry, billing\_summary, prebillable\_request)  
  item\_id uuid NOT NULL  
  reviewer\_id uuid FK users  
  decision text CHECK IN (approved, rejected, edited, merged, converted, returned)  
  notes text  
  created\_at timestamptz DEFAULT now()

notifications  
  id uuid PK  
  user\_id uuid FK users  
  type text  
  message text  
  severity text CHECK IN (info, warning, critical)  
  channel text CHECK IN (in\_app, email, both) DEFAULT 'both'  
  is\_read boolean DEFAULT false  
  created\_at timestamptz DEFAULT now()

expenses  
  id uuid PK  
  category text  
  amount numeric(12,2)  
  is\_pass\_through boolean DEFAULT false  
  date date  
  profit\_center\_id uuid FK profit\_centers

audit\_logs   \-- INSERT-ONLY: revoke UPDATE \+ DELETE at DB level  
  id uuid PK  
  entity\_type text  
  entity\_id uuid  
  action text  
  actor\_id uuid FK users  
  diff jsonb  
  created\_at timestamptz DEFAULT now()

report\_snapshots  
  id uuid PK  
  type text CHECK IN (billable\_nonbillable, profit\_margin, kicare, hosting\_margins)  
  date\_from date  
  date\_to date  
  filters jsonb  
  data\_snapshot jsonb  
  pdf\_path text  
  generated\_by uuid FK users  
  generated\_at timestamptz DEFAULT now()

mcp\_api\_keys  
  id uuid PK  
  name text  
  key\_hash text UNIQUE               \-- bcrypt, never stored plaintext  
  scope text CHECK IN (read\_only, manager, admin, billing)  
  created\_by uuid FK users  
  last\_used\_at timestamptz  
  expires\_at timestamptz  
  is\_active boolean DEFAULT true  
  created\_at timestamptz DEFAULT now()

mcp\_audit\_log  
  id uuid PK  
  key\_id uuid FK mcp\_api\_keys  
  tool text  
  params\_sanitized jsonb  
  result\_status text CHECK IN (success, error, forbidden)  
  called\_at timestamptz DEFAULT now()  
  ip\_address text  
  duration\_ms int

\#\# Rate resolution (invoice time, first match wins)

1\. project\_rates WHERE project\_id \= this project AND user\_id \= this user AND effective\_from \<= work\_date ORDER BY effective\_from DESC LIMIT 1  
2\. projects.default\_rate\_per\_hour  
3\. client\_pricing.hourly\_rate  
4\. users.billing\_rate\_per\_hour  
→ stamp result to time\_entries.rate\_applied (IMMUTABLE after set)

Cost rate mirrors:  
1\. project\_rates.cost\_rate\_per\_hour (same row as billing override)  
2\. users.cost\_rate\_per\_hour  
3\. resources.monthly\_rate / resources.capacity\_hours (true-margin model — finance sign-off required before v\_true\_margin ships)

\#\# Postgres views & RPCs (in /supabase/migrations — query via supabase-js RPC or .from(view))

v\_unbilled\_exposure       \-- credit exposure per client (sum approved billable not invoiced)  
v\_block\_burn              \-- hour block usage % \+ projected depletion date (trailing-3-week burn)  
v\_kicare\_profitability    \-- per-contract-period surplus/deficit (bucket config-driven)  
v\_hosting\_margins         \-- client × product margin $/%  
v\_billable\_by\_developer   \-- billable vs non-billable by dev, custom date range  
v\_executive\_kpis          \-- MATERIALISED; refreshed by Inngest WF-008 nightly  
v\_goal\_plan\_vs\_actual     \-- planned minutes vs logged minutes by user by date  
v\_true\_margin             \-- BLOCKED until C-10 finance sign-off

\#\# FM Sync field contract (WF-009 — DO NOT CHANGE without updating n8n workflow)

Ticket\_\_Web create:  
  ID\_Project     ← clients.fm\_client\_id  
  Description    ← tickets.title  
  Features       ← tickets.description  
  Ticket\_Type    ← billing type label ("Billable" / "Non-Billable")  
  TicketCategory ← category label (e.g. "Bug Fix")  
→ read back TicketID → store in tickets.fm\_ticket\_id

Activity script "Automate Activity Creation" JSON param:  
  TicketID      ← tickets.fm\_ticket\_id  
  Staff         ← users.email (must match Staff::Email\_ClickUp in FM)  
  Hours         ← time\_entries.duration\_minutes × 60000  (MILLISECONDS — FM script divides by 3600000\)  
  Notes         ← time\_entries.description  (maps to FM $Description)  
  Summary       ← tasks.title               (maps to FM $BillingNotes — intentional swap, do not fix)  
  Billable      ← "Billable" or "Non-Billable" (exact values)  
  Clickup\_Act   ← time\_entries.id (UUID reused as external dedup key in FM Activity::ClickUp\_Act)  
  Tags          ← comma-separated ticket tags

Dedup: FM script does exact-match find on Activity::ClickUp\_Act before creating. Re-delivery \= no-op.