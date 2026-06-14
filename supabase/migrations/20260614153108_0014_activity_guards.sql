-- 0014: time-entry (Activities) guards (P1-08)
-- · Period lock: a locked time entry rejects edits/deletes at the DB level
--   (security.md — reject at RPC level, not UI). The admin-override path
--   (void_reason + audit row) is a later task (period-lock management).
-- · Developers may delete their OWN draft entries (mistaken manual entries).
--   No DELETE policy existed before, so deletes were default-denied.

create or replace function fn_block_locked_time_entries() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  -- Service-role / background context (auth.uid() null) is exempt: the admin
  -- period-lock override (void_reason + audit row, a later task) runs there,
  -- as does unlocking a period. Every authenticated user — managers included —
  -- is blocked from editing or deleting a locked-period entry.
  if auth.uid() is null then
    return case when tg_op = 'DELETE' then old else new end;
  end if;
  if old.state = 'locked' then
    raise exception 'time entry is in a locked period; edits require an admin override';
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

create trigger block_locked_time_entries
  before update or delete on time_entries
  for each row execute function fn_block_locked_time_entries();

create policy time_entries_delete_own_draft on time_entries
  for delete to authenticated
  using (user_id = auth.uid() and state = 'draft');
