-- 0001: identity & configuration (schema.md §Identity & configuration)
-- resources → users (FK), company_config singleton, profit_centers, categories

create table resources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text,
  monthly_rate numeric(12,2),
  capacity_hours numeric(6,2)
);

comment on column resources.monthly_rate is 'executive + admin only (security.md field-level protection)';

create table users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text unique not null,
  role text not null check (role in ('developer','project_lead','manager','executive','admin','client')),
  resource_id uuid references resources(id),
  billing_rate_per_hour numeric(12,2),
  cost_rate_per_hour numeric(12,2),
  is_active boolean not null default true,
  fm_email text
);

comment on column users.cost_rate_per_hour is 'ADMIN-READ ONLY — must be ABSENT from all non-admin API responses (security.md)';
comment on column users.fm_email is 'must match Staff::Email_ClickUp in FileMaker for WF-009';

create table company_config (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  logo_url text,
  address text,
  phone text,
  email text,
  website text,
  default_currency text not null default 'CAD',
  default_payment_terms_days int not null default 30,
  invoice_prefix text not null default 'KB-',
  tax_label text,
  tax_rate numeric(5,4),
  fiscal_year_start text,
  work_week_start text not null default 'monday',
  billable_target_percent int not null default 80,
  profit_margin_target int not null default 40,
  timesheet_submit_deadline text,
  timesheet_review_deadline text,
  daily_digest_time text not null default '18:00',
  monthly_billing_day int not null default 1,
  reminder_schedule jsonb,
  -- ADR-019 / C-3: KiCare bucket scope flag. Finance must confirm before Phase 2.
  kicare_buckets_counted text not null default 'a_b' check (kicare_buckets_counted in ('a','a_b'))
);

-- SINGLETON: exactly one row, enforced at the DB level
create unique index company_config_singleton on company_config ((true));

-- Seed on first deploy (schema.md). Values are editable defaults; real values
-- pending stakeholder input (prd.md §6).
insert into company_config (company_name) values ('KiBiz');

create table profit_centers (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  is_active boolean not null default true
);

create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  default_billable boolean
);

-- Category list is specified in schema.md. default_billable left NULL pending
-- finance confirmation (never guess on finance logic — CLAUDE.md rule 3).
insert into categories (name) values
  ('new_feature'), ('support'), ('bug_fix'), ('change_request'),
  ('testing_qa'), ('research'), ('meeting_client'), ('meeting_internal'), ('admin');
