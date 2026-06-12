-- 0004: time & activities (schema.md §Time & activities)
-- UI label for time_entries is "Activity" (ADR-018).
-- time_entries.invoice_id FK is added in 0006 (invoices table exists then).

create table time_entries (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references tasks(id),
  project_id uuid not null references projects(id),
  ticket_id uuid references tickets(id),
  user_id uuid not null references users(id),
  work_date date not null,
  duration_minutes int not null check (duration_minutes > 0),
  start_time timestamptz,
  end_time timestamptz,
  state text not null default 'draft' check (state in ('draft','submitted','approved','rejected','billed','void','locked')),
  billable boolean not null,
  -- FM contract (CLAUDE.md rule 8): exactly "Billable" / "Non-Billable".
  -- Generated from billable so the label can never drift.
  billable_label text generated always as (case when billable then 'Billable' else 'Non-Billable' end) stored,
  description text,
  activity_type text,
  rate_applied numeric(12,2),
  invoice_id uuid,
  edit_history jsonb[] not null default '{}',
  fm_synced_at timestamptz,
  fm_sync_status text not null default 'pending' check (fm_sync_status in ('pending','synced','error','staff_mismatch')),
  local_id uuid,
  created_at timestamptz not null default now(),
  -- descriptions required on billable entries (spec.md §TIME ENTRIES)
  constraint time_entries_billable_requires_description
    check (not billable or (description is not null and length(trim(description)) > 0)),
  -- project-level entries (task_id null) allowed only with a description
  constraint time_entries_project_level_requires_description
    check (task_id is not null or (description is not null and length(trim(description)) > 0))
);

comment on column time_entries.rate_applied is 'IMMUTABLE — stamped at invoice time only (trigger in 0008)';
comment on column time_entries.edit_history is 'APPEND-ONLY: {field, old_value, new_value, edited_by, edited_at} — enforced by trigger in 0008';
comment on column time_entries.local_id is 'client-generated for timer dedup';

create index time_entries_user_date_idx on time_entries (user_id, work_date);
create index time_entries_project_id_idx on time_entries (project_id);
create index time_entries_ticket_id_idx on time_entries (ticket_id);
create index time_entries_state_idx on time_entries (state);
create index time_entries_fm_sync_status_idx on time_entries (fm_sync_status);

-- profit-centre split, exception path only; AI-triggered.
-- sum(percent) per time_entry = 100 enforced by nightly integrity job WF-008.
create table splits (
  id uuid primary key default gen_random_uuid(),
  time_entry_id uuid not null references time_entries(id),
  profit_center_id uuid not null references profit_centers(id),
  percent numeric(5,2) not null,
  billable boolean
);

create index splits_time_entry_id_idx on splits (time_entry_id);

-- one row per user, web start/stop only (ADR-007)
create table timer_state (
  user_id uuid primary key references users(id),
  task_id uuid references tasks(id),
  started_at timestamptz,
  accumulated_seconds int not null default 0
);

-- recurring meetings v1 (ADR-015); user_id null = team-wide
create table recurring_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  title text not null,
  ticket_id uuid references tickets(id),
  task_id uuid references tasks(id),
  days_of_week int[] not null,
  default_minutes int,
  activity_type text,
  billable boolean not null default false,
  is_active boolean not null default true
);

comment on column recurring_templates.days_of_week is '0=Sun, 1=Mon ... 6=Sat';

-- the daily plan; writes ordinary draft time_entries on log
create table goal_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id),
  date date not null,
  task_id uuid references tasks(id),
  planned_minutes int,
  sort_order int,
  status text not null default 'planned' check (status in ('planned','in_progress','done','carried','dropped')),
  carried_from_date date,
  added_by uuid references users(id),
  removal_reason text,
  recurring_template_id uuid references recurring_templates(id),
  unique (user_id, date, task_id)
);

comment on column goal_items.task_id is 'null only for quick-adds (task created immediately after)';
comment on column goal_items.removal_reason is 'required when removing manager-pushed items';

create index goal_items_user_date_idx on goal_items (user_id, date);

-- auto-created on first activity of the week
create table timesheets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id),
  week_start date not null,
  status text not null default 'draft' check (status in ('draft','submitted','flagged','approved','billed')),
  submitted_at timestamptz,
  reviewed_by uuid references users(id),
  reviewed_at timestamptz,
  review_note text,
  approved_at timestamptz,
  billed_at timestamptz,
  unique (user_id, week_start)
);
