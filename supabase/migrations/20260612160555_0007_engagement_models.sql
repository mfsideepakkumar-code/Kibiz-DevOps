-- 0007: engagement models (schema.md §Engagement models)
-- Hour blocks are CLIENT-level (ADR-017) — not part of the ticket hierarchy.

create table hour_blocks (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id),
  linked_project_ids uuid[],
  total_hours numeric(8,2) not null,
  rate numeric(12,2),
  status text not null default 'pending_payment' check (status in ('pending_payment','active','depleted','cancelled')),
  activated_at timestamptz,
  depleted_at timestamptz,
  alert_thresholds int[] not null default '{50,80,95,100}',
  alerts_sent int[] not null default '{}',
  invoice_id uuid references invoices(id),
  notes text,
  created_by uuid references users(id),
  created_at timestamptz not null default now()
);

comment on column hour_blocks.linked_project_ids is 'NULL = all client projects eligible';
comment on column hour_blocks.activated_at is 'set on invoice paid (ADR-023); FIFO drawdown key';
comment on column hour_blocks.alerts_sent is 'APPEND-ONLY idempotency guard for WF-001 threshold alerts';

create index hour_blocks_client_id_idx on hour_blocks (client_id);
create index hour_blocks_status_idx on hour_blocks (status);

create table hour_block_drawdowns (
  id uuid primary key default gen_random_uuid(),
  hour_block_id uuid not null references hour_blocks(id),
  time_entry_id uuid not null references time_entries(id),
  hours_drawn numeric(6,2) not null,
  drawn_at timestamptz not null default now()
);

create index hour_block_drawdowns_block_idx on hour_block_drawdowns (hour_block_id);
create index hour_block_drawdowns_entry_idx on hour_block_drawdowns (time_entry_id);

create table kicare_contracts (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id),
  project_ids uuid[],
  contract_amount numeric(12,2) not null,
  start_date date not null,
  end_date date not null,
  scope_definition text,
  renewal_date date
  -- profitability = contract_amount − (sum non-billable hours × client hourly_rate)
  -- bucket scope: company_config.kicare_buckets_counted = 'a' | 'a_b' (C-3, ADR-019)
);

create index kicare_contracts_client_id_idx on kicare_contracts (client_id);

create table work_orders (
  id uuid primary key default gen_random_uuid(),
  hour_block_id uuid references hour_blocks(id),
  client_id uuid not null references clients(id),
  work_order_no text unique,
  date_from date,
  date_to date,
  snapshot jsonb,
  pdf_path text,
  sent_at timestamptz,
  sent_to text[],
  created_by uuid references users(id),
  created_at timestamptz not null default now()
);

comment on column work_orders.snapshot is 'point-in-time data for reproducible PDF';
