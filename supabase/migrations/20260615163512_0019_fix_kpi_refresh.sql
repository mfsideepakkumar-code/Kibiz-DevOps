-- 0019: fix fn_refresh_executive_kpis (P1-13).
-- v_executive_kpis' only unique index is on the expression ((true)), which does
-- NOT satisfy REFRESH MATERIALIZED VIEW CONCURRENTLY (Postgres requires a unique
-- index over column names, not an expression). The 0010 refresh function
-- therefore always failed with "cannot refresh materialized view concurrently".
-- This matview is a single-row, nightly/manual KPI snapshot, so a plain refresh
-- (brief exclusive lock during recompute) is correct and sufficient. WF-008
-- (P1-15) and the dashboard Refresh action both call this function.

create or replace function fn_refresh_executive_kpis() returns void
language sql security definer set search_path = public as $$
  refresh materialized view v_executive_kpis;
$$;

revoke execute on function fn_refresh_executive_kpis() from anon, authenticated;
