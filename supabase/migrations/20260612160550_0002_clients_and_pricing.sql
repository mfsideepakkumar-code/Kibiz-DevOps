-- 0002: clients & pricing (schema.md §Clients & pricing)

create table clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  engagement_model text check (engagement_model in ('hour_block','pay_as_billed','kicare')),
  industry text,
  is_active boolean not null default true,
  fm_client_id text
);

comment on column clients.fm_client_id is '"KiClient ID" in FM; seeds ID_Project in Ticket__Web sync (WF-009)';

create table client_contacts (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id),
  name text not null,
  email text,
  phone text,
  is_primary boolean not null default false,
  receives_invoices boolean not null default false,
  receives_reports boolean not null default false,
  has_portal_access boolean not null default false
);

comment on column client_contacts.has_portal_access is 'INERT until C-1 resolved (client portal hard block)';

create index client_contacts_client_id_idx on client_contacts (client_id);

-- 1:1 with clients, admin-only edit
create table client_pricing (
  client_id uuid primary key references clients(id),
  hourly_rate numeric(12,2),
  hosting_price numeric(12,2),
  hosting_cycle text check (hosting_cycle in ('monthly','annual')),
  filemaker_license_price numeric(12,2),
  filemaker_license_cycle text check (filemaker_license_cycle in ('monthly','annual')),
  billing_increment text not null default 'exact' check (billing_increment in ('exact','6min','15min')),
  notes text,
  updated_at timestamptz not null default now(),
  updated_by uuid references users(id),
  price_history jsonb[] not null default '{}'
);

comment on column client_pricing.price_history is 'APPEND-ONLY: {field, old_value, new_value, updated_at, updated_by} — enforced by trigger in 0008';

create table client_credit_policies (
  client_id uuid primary key references clients(id),
  credit_limit numeric(12,2),
  alert_thresholds int[] not null default '{70,90,100}'
  -- current_exposure is DERIVED via v_unbilled_exposure view, not stored
);
