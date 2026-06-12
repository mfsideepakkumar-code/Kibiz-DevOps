-- 0003: projects & work hierarchy (schema.md §Projects & work hierarchy)
-- Includes the composite FK (CLAUDE.md rule 9): tickets carrying a
-- sub_project_id must reference a sub_project belonging to the same project.

create table projects (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id),
  name text not null,
  status text not null default 'active' check (status in ('active','on_hold','completed','archived')),
  sow_hours numeric(8,2),
  default_rate_per_hour numeric(12,2),
  default_profit_center_id uuid references profit_centers(id),
  is_internal boolean not null default false
);

create index projects_client_id_idx on projects (client_id);

-- OPTIONAL level, aka SOW (ADR-017). Do NOT add fields beyond schema.md (C-11).
create table sub_projects (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id),
  name text not null,
  sow_hours numeric(8,2),
  status text not null default 'active' check (status in ('active','on_hold','completed','archived')),
  start_date date,
  end_date date,
  notes text,
  -- target for the composite FK from tickets (hierarchical integrity)
  unique (project_id, id)
);

-- per-developer per-project overrides, multiple rows allowed
create table project_rates (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id),
  user_id uuid not null references users(id),
  billing_rate_per_hour numeric(12,2),
  cost_rate_per_hour numeric(12,2),
  effective_from date not null
);

comment on column project_rates.cost_rate_per_hour is 'ADMIN-READ ONLY — absent from non-admin API responses (security.md)';

create index project_rates_lookup_idx on project_rates (project_id, user_id, effective_from desc);

create table sprints (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id),
  name text not null,
  status text not null default 'planned' check (status in ('planned','active','completed')),
  start_date date,
  end_date date,
  goal text
);

create table milestones (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id),
  name text not null,
  description text,
  target_date date,
  target_hours numeric(8,2),
  status text not null default 'pending' check (status in ('pending','in_progress','completed')),
  completed_at timestamptz
);

-- billing unit
create table tickets (
  id uuid primary key default gen_random_uuid(),
  ticket_no text unique,
  project_id uuid not null references projects(id),
  sub_project_id uuid references sub_projects(id),
  title text not null,
  description text,
  status text not null default 'draft' check (status in ('draft','pending_approval','approved','in_progress','blocked','done','ready_to_bill','closed','rejected')),
  priority text check (priority in ('p0','p1','p2','p3')),
  escalation_level int not null default 0,
  category_id uuid not null references categories(id),
  profit_center_id uuid references profit_centers(id),
  billing_type text check (billing_type in ('billable','non_billable')),
  fm_ticket_id text,
  created_by uuid references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- composite FK: a ticket's sub_project must belong to the ticket's project
  constraint tickets_sub_project_same_project_fk
    foreign key (project_id, sub_project_id) references sub_projects (project_id, id)
);

comment on column tickets.fm_ticket_id is 'FM-generated TicketID, written back by WF-009 on ticket approval';

create index tickets_project_id_idx on tickets (project_id);
create index tickets_status_idx on tickets (status);

-- execution unit (formerly subtask — ADR-013/018)
create table tasks (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references tickets(id),
  title text not null,
  description text,
  assignee_id uuid references users(id),
  status text not null default 'draft' check (status in ('draft','pending_approval','approved','in_progress','blocked','done','archived')),
  priority text check (priority in ('p0','p1','p2','p3')),
  estimated_hours numeric(6,2),
  sprint_id uuid references sprints(id),
  milestone_id uuid references milestones(id),
  activity_type text check (activity_type in ('CLIENTBILLABLE','CLIENTNONBILLABLE','INTERNALPRODUCTRD','PMMANAGEMENT','SALESBD','INNOVATIONRD','OPERATIONSADMIN','LEARNING')),
  created_by uuid references users(id),
  created_at timestamptz not null default now()
);

create index tasks_ticket_id_idx on tasks (ticket_id);
create index tasks_assignee_id_idx on tasks (assignee_id);

create table bugs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id),
  title text not null,
  description text,
  reporter_id uuid references users(id),
  triage_status text not null default 'pending' check (triage_status in ('pending','approved','merged','converted','rejected')),
  converted_to_type text check (converted_to_type in ('ticket','task')),
  converted_to_id uuid,
  duplicate_of_id uuid references tickets(id),
  created_at timestamptz not null default now()
);
