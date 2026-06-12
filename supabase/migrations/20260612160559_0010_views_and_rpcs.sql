-- 0010: views & RPCs (schema.md §Postgres views & RPCs)
-- All plain views use security_invoker so RLS of the querying user applies
-- (security.md: field protection enforced in view/RPC definitions, not UI).
-- v_true_margin is NOT created — BLOCKED until C-10 finance sign-off.

-- ─────────────────────────────────────────────────────────────────────────────
-- Rate resolution (schema.md §Rate resolution — first match wins).
-- Used for exposure estimates now; stamps time_entries.rate_applied at invoice
-- time in Phase 2 (immutable after set).
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function fn_resolve_rate(p_project_id uuid, p_user_id uuid, p_work_date date)
returns numeric
language sql stable set search_path = public as $$
  select coalesce(
    (select pr.billing_rate_per_hour
       from project_rates pr
      where pr.project_id = p_project_id
        and pr.user_id = p_user_id
        and pr.effective_from <= p_work_date
        and pr.billing_rate_per_hour is not null
      order by pr.effective_from desc
      limit 1),
    (select p.default_rate_per_hour from projects p where p.id = p_project_id),
    (select cp.hourly_rate
       from client_pricing cp
       join projects p on p.client_id = cp.client_id
      where p.id = p_project_id),
    (select u.billing_rate_per_hour from users u where u.id = p_user_id)
  );
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- v_unbilled_exposure — credit exposure per client:
-- sum of APPROVED + BILLABLE time not yet invoiced, valued via rate resolution.
-- ─────────────────────────────────────────────────────────────────────────────

create view v_unbilled_exposure
with (security_invoker = true) as
select
  c.id as client_id,
  c.name as client_name,
  ccp.credit_limit,
  coalesce(sum(te.duration_minutes), 0) as unbilled_minutes,
  round(coalesce(sum(
    (te.duration_minutes / 60.0) * coalesce(fn_resolve_rate(te.project_id, te.user_id, te.work_date), 0)
  ), 0)::numeric, 2) as unbilled_amount,
  case
    when ccp.credit_limit is null or ccp.credit_limit = 0 then null
    else round((coalesce(sum(
      (te.duration_minutes / 60.0) * coalesce(fn_resolve_rate(te.project_id, te.user_id, te.work_date), 0)
    ), 0) / ccp.credit_limit * 100)::numeric, 1)
  end as exposure_percent
from clients c
left join client_credit_policies ccp on ccp.client_id = c.id
left join projects p on p.client_id = c.id
left join time_entries te
  on te.project_id = p.id
 and te.state = 'approved'
 and te.billable = true
 and te.invoice_id is null
group by c.id, c.name, ccp.credit_limit;

-- ─────────────────────────────────────────────────────────────────────────────
-- v_block_burn — hour block usage % + projected depletion date
-- (trailing-3-week average burn rate; date meaningful from 80%+ per spec).
-- ─────────────────────────────────────────────────────────────────────────────

create view v_block_burn
with (security_invoker = true) as
with burn as (
  select
    hb.id as hour_block_id,
    coalesce(sum(d.hours_drawn), 0) as used_hours,
    coalesce(sum(d.hours_drawn) filter (where d.drawn_at >= now() - interval '21 days'), 0) / 3.0 as weekly_burn
  from hour_blocks hb
  left join hour_block_drawdowns d on d.hour_block_id = hb.id
  group by hb.id
)
select
  hb.id as hour_block_id,
  hb.client_id,
  hb.status,
  hb.total_hours,
  b.used_hours,
  round((hb.total_hours - b.used_hours)::numeric, 2) as remaining_hours,
  case when hb.total_hours > 0
       then round((b.used_hours / hb.total_hours * 100)::numeric, 1)
  end as used_percent,
  round(b.weekly_burn::numeric, 2) as trailing_3wk_weekly_burn,
  case when b.weekly_burn > 0 and hb.total_hours > b.used_hours
       then current_date + (ceil((hb.total_hours - b.used_hours) / b.weekly_burn) * 7)::int
  end as projected_depletion_date,
  hb.alert_thresholds,
  hb.alerts_sent,
  hb.activated_at
from hour_blocks hb
join burn b on b.hour_block_id = hb.id;

-- ─────────────────────────────────────────────────────────────────────────────
-- v_kicare_profitability — per-contract surplus/deficit (ADR-019).
-- surplus = contract_amount − (non_billable_hours × client_pricing.hourly_rate)
-- Bucket scope reads company_config.kicare_buckets_counted (C-3). Until the
-- KiCare scope classification ships (P2-03) there is no bucket-a marker, so
-- both settings count all non-billable hours (the 'a_b' behaviour).
-- ─────────────────────────────────────────────────────────────────────────────

create view v_kicare_profitability
with (security_invoker = true) as
with nb as (
  select
    kc.id as contract_id,
    coalesce(sum(te.duration_minutes), 0) / 60.0 as non_billable_hours
  from kicare_contracts kc
  left join projects p
    on p.client_id = kc.client_id
   and (kc.project_ids is null or p.id = any (kc.project_ids))
  left join time_entries te
    on te.project_id = p.id
   and te.billable = false
   and te.state in ('approved','billed','locked')
   and te.work_date between kc.start_date and kc.end_date
  group by kc.id
)
select
  kc.id as contract_id,
  kc.client_id,
  c.name as client_name,
  kc.contract_amount,
  kc.start_date,
  kc.end_date,
  kc.renewal_date,
  round(nb.non_billable_hours::numeric, 2) as non_billable_hours,
  cp.hourly_rate,
  round((kc.contract_amount - nb.non_billable_hours * coalesce(cp.hourly_rate, 0))::numeric, 2) as surplus,
  case
    when kc.contract_amount - nb.non_billable_hours * coalesce(cp.hourly_rate, 0) < 0 then 'loss'
    when kc.contract_amount - nb.non_billable_hours * coalesce(cp.hourly_rate, 0) <= kc.contract_amount * 0.2 then 'at_risk'
    else 'profitable'
  end as status
from kicare_contracts kc
join clients c on c.id = kc.client_id
left join client_pricing cp on cp.client_id = kc.client_id
join nb on nb.contract_id = kc.id;

-- ─────────────────────────────────────────────────────────────────────────────
-- v_hosting_margins — client × product margin $/%.
-- cost_price / margin / margin_percent are ADMIN-ONLY; P1-03 ships the
-- non-admin access path without those columns (security.md).
-- ─────────────────────────────────────────────────────────────────────────────

create view v_hosting_margins
with (security_invoker = true) as
select
  c.id as client_id,
  c.name as client_name,
  pr.id as product_id,
  pr.name as product_name,
  pr.category,
  cs.qty,
  coalesce(cs.unit_price_override, pr.unit_price) as price,
  pr.cost_price,
  round((coalesce(cs.unit_price_override, pr.unit_price) - pr.cost_price)::numeric, 2) as margin,
  case when coalesce(cs.unit_price_override, pr.unit_price) > 0
       then round(((coalesce(cs.unit_price_override, pr.unit_price) - pr.cost_price)
                   / coalesce(cs.unit_price_override, pr.unit_price) * 100)::numeric, 1)
  end as margin_percent,
  cs.renewal_date
from client_subscriptions cs
join clients c on c.id = cs.client_id
join products pr on pr.id = cs.product_id;

-- ─────────────────────────────────────────────────────────────────────────────
-- v_billable_by_developer — billable vs non-billable by dev, by day and state;
-- consumers aggregate over their own date range.
-- ─────────────────────────────────────────────────────────────────────────────

create view v_billable_by_developer
with (security_invoker = true) as
select
  te.user_id,
  u.name as user_name,
  te.work_date,
  te.state,
  te.billable,
  sum(te.duration_minutes) as minutes,
  round(sum(te.duration_minutes) / 60.0, 2) as hours
from time_entries te
join users u on u.id = te.user_id
group by te.user_id, u.name, te.work_date, te.state, te.billable;

-- ─────────────────────────────────────────────────────────────────────────────
-- v_goal_plan_vs_actual — planned minutes vs logged minutes by user by date
-- ─────────────────────────────────────────────────────────────────────────────

create view v_goal_plan_vs_actual
with (security_invoker = true) as
with planned as (
  select gi.user_id, gi.date, sum(gi.planned_minutes) as planned_minutes
  from goal_items gi
  where gi.status <> 'dropped'
  group by gi.user_id, gi.date
),
actual as (
  select te.user_id, te.work_date as date, sum(te.duration_minutes) as actual_minutes
  from time_entries te
  where te.state <> 'void'
  group by te.user_id, te.work_date
)
select
  coalesce(p.user_id, a.user_id) as user_id,
  coalesce(p.date, a.date) as date,
  coalesce(p.planned_minutes, 0) as planned_minutes,
  coalesce(a.actual_minutes, 0) as actual_minutes
from planned p
full outer join actual a on a.user_id = p.user_id and a.date = p.date;

-- ─────────────────────────────────────────────────────────────────────────────
-- v_executive_kpis — MATERIALIZED; refreshed nightly by WF-008.
-- Contains only metrics with confirmed formulas. Utilisation and idle-cost
-- KPIs are PENDING OQ-1 (do not build the formulas until resolved).
-- Materialized views cannot use security_invoker → access revoked from API
-- roles; served server-side (service role) to exec/admin only.
-- ─────────────────────────────────────────────────────────────────────────────

create materialized view v_executive_kpis as
select
  now() as refreshed_at,
  (select count(*) from projects where status = 'active') as active_projects,
  (select count(*) from clients where is_active) as active_clients,
  (select coalesce(sum(total), 0) from invoices
    where status <> 'void' and issue_date >= current_date - 30) as revenue_invoiced_30d,
  (select coalesce(sum(amount_due), 0) from invoices
    where status in ('sent','partial')) as outstanding_receivables,
  (select coalesce(sum(duration_minutes), 0) / 60.0 from time_entries
    where state in ('approved','billed','locked') and billable
      and work_date >= current_date - 30) as billable_hours_30d,
  (select coalesce(sum(duration_minutes), 0) / 60.0 from time_entries
    where state in ('approved','billed','locked')
      and work_date >= current_date - 30) as total_approved_hours_30d;

create unique index v_executive_kpis_singleton on v_executive_kpis ((true));

revoke all on v_executive_kpis from anon, authenticated;

-- RPC for WF-008 nightly refresh (service role)
create or replace function fn_refresh_executive_kpis() returns void
language sql security definer set search_path = public as $$
  refresh materialized view concurrently v_executive_kpis;
$$;

revoke execute on function fn_refresh_executive_kpis() from anon, authenticated;
