-- 0015: per-user daily capacity for the Goal Sheet / My Day (P1-10).
-- Named daily_capacity_hours to disambiguate from resources.capacity_hours,
-- which is MONTHLY capacity used for the effective-cost-rate calc.
-- Default 8h (stakeholder decision, 2026-06-15).

alter table users
  add column daily_capacity_hours numeric(4,2) not null default 8;

comment on column users.daily_capacity_hours is 'daily goal-sheet capacity target (hours); default 8';

-- users has column-level grants (migration 0011) — the new column must be
-- granted to authenticated to be readable (not a cost field; safe to expose).
grant select (daily_capacity_hours) on users to authenticated;
