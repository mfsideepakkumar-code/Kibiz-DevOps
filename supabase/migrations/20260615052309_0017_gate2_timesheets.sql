-- 0017: Gate 2 (weekly timesheet submit/review) enablement (P1-11)
-- · Let a developer move their OWN draft/rejected entries to 'submitted'
--   (submit / resubmit). The 0011 update policy had no explicit WITH CHECK, so
--   it defaulted to USING and forbade 'submitted' as a resulting state.
-- · Gate 2 guard: a non-manager may only set a timesheet to draft/submitted;
--   approve/flag/bill are manager-only (mirrors the Gate 1 guard).

drop policy time_entries_update on time_entries;

create policy time_entries_update on time_entries for update to authenticated
  using (
    fn_current_role() in ('manager','admin')
    or (user_id = auth.uid() and state in ('draft','rejected'))
  )
  with check (
    fn_current_role() in ('manager','admin')
    or (user_id = auth.uid() and state in ('draft','rejected','submitted'))
  );

create or replace function fn_gate2_timesheet_guard() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return new; end if;     -- service role / background
  if fn_is_manager_up() then return new; end if;      -- managers review
  if new.status not in ('draft','submitted') then
    raise exception 'Gate 2: only managers can approve, flag, or bill a timesheet';
  end if;
  return new;
end;
$$;

create trigger gate2_timesheet before insert or update on timesheets
  for each row execute function fn_gate2_timesheet_guard();
