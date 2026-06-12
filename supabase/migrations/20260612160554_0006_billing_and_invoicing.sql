-- 0006: billing & invoicing (schema.md §Billing & invoicing)
-- Also closes the deferred FK from time_entries.invoice_id (created in 0004).

create table billing_summaries (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null unique references tickets(id),
  summary_text text,
  internal_detail text,
  generated_by text not null default 'ai',
  approved_by uuid references users(id),
  approved_at timestamptz,
  status text not null default 'draft' check (status in ('draft','approved','returned'))
);

comment on column billing_summaries.summary_text is 'client-facing';
comment on column billing_summaries.internal_detail is 'accounting only';

create table invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_no text unique not null,
  client_id uuid not null references clients(id),
  status text not null default 'draft' check (status in ('draft','sent','partial','paid','void')),
  -- overdue is DERIVED: due_date < today AND amount_due > 0 (ADR-021) — never stored
  currency text not null default 'CAD',
  subtotal numeric(12,2),
  tax_amount numeric(12,2) not null default 0,
  tax_label text,
  total numeric(12,2),
  amount_paid numeric(12,2) not null default 0,
  amount_due numeric(12,2) generated always as (total - amount_paid) stored,
  issue_date date,
  due_date date,
  portal_token text unique,
  pdf_path text,
  internal_notes text,
  void_at timestamptz,
  void_by uuid references users(id),
  void_reason text,
  created_by uuid references users(id),
  created_at timestamptz not null default now()
);

comment on column invoices.invoice_no is 'prefix + counter, IMMUTABLE, never reused (trigger in 0008)';
comment on column invoices.portal_token is 'unique per invoice, never reused after paid/void';

create index invoices_client_id_idx on invoices (client_id);
create index invoices_status_idx on invoices (status);

-- invoice numbering: company_config.invoice_prefix + this counter (immutable, never reused)
create sequence invoice_no_seq;

create table invoice_lines (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references invoices(id),
  type text not null check (type in ('time_entry','product','fixed','adjustment')),
  time_entry_id uuid references time_entries(id),
  product_id uuid references products(id),
  description text not null,
  qty numeric(10,2),
  unit_price numeric(12,2),
  amount numeric(12,2) generated always as (qty * unit_price) stored,
  profit_center_id uuid references profit_centers(id),
  is_included boolean not null default true,
  sort_order int
  -- adjustment type: amount will be negative (credit note); description required
);

create index invoice_lines_invoice_id_idx on invoice_lines (invoice_id);

create table payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references invoices(id),
  method text not null check (method in ('credit_card','ach','zelle','e_transfer','cheque','manual')),
  amount numeric(12,2) not null,
  currency text not null default 'CAD',
  paid_at timestamptz,
  cayan_transaction_id text unique,
  reference_note text,
  recorded_by uuid references users(id),
  receipt_sent_at timestamptz,
  created_at timestamptz not null default now()
);

comment on column payments.cayan_transaction_id is 'idempotency key for webhook re-delivery — IMMUTABLE';

create table payment_reminders (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references invoices(id),
  type text not null check (type in ('due_soon','due_today','overdue_7','overdue_14','overdue_30','manual')),
  sent_at timestamptz not null default now(),
  sent_to text[]
);

comment on table payment_reminders is 'APPEND-ONLY (security.md)';

-- deferred FK from 0004: time_entries.invoice_id → invoices
alter table time_entries
  add constraint time_entries_invoice_id_fkey
  foreign key (invoice_id) references invoices(id);

create index time_entries_invoice_id_idx on time_entries (invoice_id);
