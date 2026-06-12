-- 0005: products & subscriptions (schema.md §Products & subscriptions)
-- Ordered before billing so invoice_lines can FK products in 0006.

create table products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  category text check (category in ('hosting','license','ssl','domain','other')),
  unit_price numeric(12,2),
  cost_price numeric(12,2),
  billing_cycle text check (billing_cycle in ('monthly','annual','one_time')),
  profit_center_id uuid references profit_centers(id),
  is_active boolean not null default true
);

comment on column products.cost_price is 'ADMIN-ONLY — absent from non-admin API responses (security.md)';

create table client_subscriptions (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id),
  product_id uuid not null references products(id),
  qty numeric(8,2) not null default 1,
  unit_price_override numeric(12,2),
  renewal_date date,
  billing_day_override int,
  auto_renew boolean not null default true,
  auto_send_invoice boolean not null default false,
  created_at timestamptz not null default now()
);

comment on column client_subscriptions.unit_price_override is 'overrides product.unit_price; pre-populated from client_pricing';
comment on column client_subscriptions.billing_day_override is 'overrides company_config.monthly_billing_day (ADR-022)';

create index client_subscriptions_client_id_idx on client_subscriptions (client_id);
create index client_subscriptions_renewal_date_idx on client_subscriptions (renewal_date);
