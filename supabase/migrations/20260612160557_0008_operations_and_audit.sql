-- 0008: operations & audit (schema.md §Operations & audit)
-- Plus DB-level enforcement (CLAUDE.md + security.md):
--   · audit triggers writing to audit_logs (database-level, not application-level)
--   · audit_logs INSERT-only (UPDATE/DELETE revoked)
--   · append-only array columns (price_history, edit_history, alerts_sent)
--   · immutable-once-set columns (rate_applied, invoice_no, cayan_transaction_id)

create table approvals (
  id uuid primary key default gen_random_uuid(),
  item_type text not null check (item_type in ('ticket','task','bug','time_entry','billing_summary','prebillable_request')),
  item_id uuid not null,
  reviewer_id uuid references users(id),
  decision text check (decision in ('approved','rejected','edited','merged','converted','returned')),
  notes text,
  created_at timestamptz not null default now()
);

create index approvals_item_idx on approvals (item_type, item_id);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id),
  type text not null,
  message text not null,
  severity text not null default 'info' check (severity in ('info','warning','critical')),
  channel text not null default 'both' check (channel in ('in_app','email','both')),
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index notifications_user_unread_idx on notifications (user_id, is_read);

create table expenses (
  id uuid primary key default gen_random_uuid(),
  category text,
  amount numeric(12,2) not null,
  is_pass_through boolean not null default false,
  date date,
  profit_center_id uuid references profit_centers(id)
);

create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid,
  action text not null,
  actor_id uuid references users(id),
  diff jsonb,
  created_at timestamptz not null default now()
);

comment on table audit_logs is 'INSERT-ONLY — UPDATE/DELETE revoked at DB level (security.md)';

create index audit_logs_entity_idx on audit_logs (entity_type, entity_id);

-- INSERT-only: revoke from every API-facing role including service_role
revoke update, delete on audit_logs from anon, authenticated, service_role;

create table report_snapshots (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('billable_nonbillable','profit_margin','kicare','hosting_margins')),
  date_from date,
  date_to date,
  filters jsonb,
  data_snapshot jsonb,
  pdf_path text,
  generated_by uuid references users(id),
  generated_at timestamptz not null default now()
);

comment on table report_snapshots is 'type = profit_margin rows are ADMIN-ONLY (security.md)';

create table mcp_api_keys (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  key_hash text unique not null,
  scope text not null check (scope in ('read_only','manager','admin','billing')),
  created_by uuid references users(id),
  last_used_at timestamptz,
  expires_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

comment on column mcp_api_keys.key_hash is 'bcrypt — plaintext shown once on creation, never stored';

create table mcp_audit_log (
  id uuid primary key default gen_random_uuid(),
  key_id uuid references mcp_api_keys(id),
  tool text not null,
  params_sanitized jsonb,
  result_status text check (result_status in ('success','error','forbidden')),
  called_at timestamptz not null default now(),
  ip_address text,
  duration_ms int
);

comment on table mcp_audit_log is 'APPEND-ONLY (security.md)';

revoke update, delete on mcp_audit_log from anon, authenticated, service_role;
revoke update, delete on payment_reminders from anon, authenticated, service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- Audit trigger: writes every INSERT/UPDATE/DELETE on audited tables to
-- audit_logs. SECURITY DEFINER (owner bypasses audit_logs RLS).
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function fn_audit() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_row jsonb;
  v_diff jsonb;
  v_entity_id uuid;
begin
  if tg_op = 'INSERT' then
    v_row := to_jsonb(new);
    v_diff := v_row;
  elsif tg_op = 'UPDATE' then
    v_row := to_jsonb(new);
    select jsonb_object_agg(n.key, jsonb_build_object('old', o.value, 'new', n.value))
      into v_diff
      from jsonb_each(to_jsonb(old)) o
      join jsonb_each(to_jsonb(new)) n on n.key = o.key
     where o.value is distinct from n.value;
  else
    v_row := to_jsonb(old);
    v_diff := v_row;
  end if;

  -- audited tables key on id, client_id, or user_id
  v_entity_id := coalesce(
    nullif(v_row ->> 'id', '')::uuid,
    nullif(v_row ->> 'client_id', '')::uuid,
    nullif(v_row ->> 'user_id', '')::uuid
  );

  insert into audit_logs (entity_type, entity_id, action, actor_id, diff)
  values (tg_table_name, v_entity_id, tg_op, auth.uid(), v_diff);

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

-- Audited tables (CLAUDE.md security rules: "e.g., client_pricing, time_entries"
-- — extended to every finance-bearing table)
create trigger audit_client_pricing       after insert or update or delete on client_pricing       for each row execute function fn_audit();
create trigger audit_time_entries         after insert or update or delete on time_entries         for each row execute function fn_audit();
create trigger audit_invoices             after insert or update or delete on invoices             for each row execute function fn_audit();
create trigger audit_payments             after insert or update or delete on payments             for each row execute function fn_audit();
create trigger audit_hour_blocks          after insert or update or delete on hour_blocks          for each row execute function fn_audit();
create trigger audit_tickets              after insert or update or delete on tickets              for each row execute function fn_audit();
create trigger audit_users                after insert or update or delete on users                for each row execute function fn_audit();
create trigger audit_client_credit_policies after insert or update or delete on client_credit_policies for each row execute function fn_audit();
create trigger audit_products             after insert or update or delete on products             for each row execute function fn_audit();
create trigger audit_kicare_contracts    after insert or update or delete on kicare_contracts    for each row execute function fn_audit();

-- ─────────────────────────────────────────────────────────────────────────────
-- Append-only arrays: existing elements may never change or be removed.
-- Usage: trigger argument = column name.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function fn_enforce_append_only() returns trigger
language plpgsql as $$
declare
  col text := tg_argv[0];
  o jsonb := to_jsonb(old) -> col;
  n jsonb := to_jsonb(new) -> col;
  i int;
begin
  if o is null or o = 'null'::jsonb then
    return new;
  end if;
  if n is null or n = 'null'::jsonb
     or jsonb_array_length(n) < jsonb_array_length(o) then
    raise exception '%.% is append-only — elements may not be removed', tg_table_name, col;
  end if;
  for i in 0 .. jsonb_array_length(o) - 1 loop
    if (n -> i) is distinct from (o -> i) then
      raise exception '%.% is append-only — existing elements may not change', tg_table_name, col;
    end if;
  end loop;
  return new;
end;
$$;

create trigger append_only_price_history before update on client_pricing
  for each row execute function fn_enforce_append_only('price_history');
create trigger append_only_edit_history before update on time_entries
  for each row execute function fn_enforce_append_only('edit_history');
create trigger append_only_alerts_sent before update on hour_blocks
  for each row execute function fn_enforce_append_only('alerts_sent');

-- ─────────────────────────────────────────────────────────────────────────────
-- Immutable-once-set columns (security.md §Audit & immutability)
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function fn_enforce_immutable() returns trigger
language plpgsql as $$
declare
  col text := tg_argv[0];
  o jsonb := to_jsonb(old) -> col;
  n jsonb := to_jsonb(new) -> col;
begin
  if o is not null and o <> 'null'::jsonb and n is distinct from o then
    raise exception '%.% is immutable once set', tg_table_name, col;
  end if;
  return new;
end;
$$;

create trigger immutable_rate_applied before update on time_entries
  for each row execute function fn_enforce_immutable('rate_applied');
create trigger immutable_invoice_no before update on invoices
  for each row execute function fn_enforce_immutable('invoice_no');
create trigger immutable_cayan_transaction_id before update on payments
  for each row execute function fn_enforce_immutable('cayan_transaction_id');
