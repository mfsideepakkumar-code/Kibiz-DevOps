-- 0018: AI usage logging (P1-12). The AI matrix requires token usage logged on
-- every Claude API call. Inserts happen server-side via the service role (after
-- each call); admins can read. Not in the original schema.md — added here.

create table ai_usage_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  feature text not null,              -- e.g. 'billing_summary'
  model text not null,
  input_tokens int not null default 0,
  output_tokens int not null default 0,
  cache_read_input_tokens int not null default 0,
  cache_creation_input_tokens int not null default 0,
  status text not null default 'success' check (status in ('success','refusal','error')),
  created_at timestamptz not null default now()
);

create index ai_usage_log_created_idx on ai_usage_log (created_at);
create index ai_usage_log_feature_idx on ai_usage_log (feature);

alter table ai_usage_log enable row level security;

-- Admin read-only; inserts are server-side via the service role (bypasses RLS).
create policy ai_usage_log_admin_select on ai_usage_log for select to authenticated
  using (fn_current_role() = 'admin');
