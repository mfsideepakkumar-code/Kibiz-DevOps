-- 0012: auth hardening (P1-03 follow-up, same PR)
-- GoTrue merges app_metadata AFTER the auth.users insert, so the signup
-- trigger cannot trust raw_app_meta_data. And public signups (if enabled in
-- the dashboard) must never yield an active staff account. Defense in depth:
--   1) new users land INACTIVE with role 'developer' — an admin explicitly
--      assigns role + activates (scripts/create-user.mjs or User Management)
--   2) fn_current_role() returns NULL for inactive users → every RLS policy
--      denies them, even with a valid session token
-- ALSO REQUIRED (dashboard setting, not expressible in SQL): disable public
-- email signups before pilot. Tracked in TASKS.md under P1-03.

create or replace function fn_current_role() returns text
language sql stable security definer set search_path = public as $$
  select role from users where id = auth.uid() and is_active;
$$;

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, name, email, role, is_active)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    new.email,
    'developer',
    false
  )
  on conflict (email) do nothing;
  return new;
end;
$$;
