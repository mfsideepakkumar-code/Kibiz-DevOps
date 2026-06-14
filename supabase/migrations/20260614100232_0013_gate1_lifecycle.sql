-- 0013: Gate 1 + work-item lifecycle enforcement (P1-07)
-- · Auto human-readable ticket numbers (TKT-0001…)
-- · DB-level Gate 1 guard so dev-created work can never self-approve, even if
--   the API is called directly (RLS already restricts rows; this restricts the
--   STATUS values a non-manager may set). ADR-014 carve-out: a developer task
--   created under an already-approved ticket may be inserted as 'approved'.

-- ── Ticket numbering ─────────────────────────────────────────────────────────
create sequence if not exists ticket_no_seq;

create or replace function fn_set_ticket_no() returns trigger
language plpgsql as $$
begin
  if new.ticket_no is null then
    new.ticket_no := 'TKT-' || lpad(nextval('ticket_no_seq')::text, 4, '0');
  end if;
  return new;
end;
$$;

create trigger set_ticket_no before insert on tickets
  for each row execute function fn_set_ticket_no();

-- ── Gate 1 status guard (tickets, tasks, bugs) ───────────────────────────────
-- Runs for every writer. Service-role / background writes (auth.uid() null) and
-- managers/admins are unrestricted here (their own RLS still applies).
create or replace function fn_gate1_status_guard() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return new; end if;   -- service role / Inngest / triggers
  if fn_is_manager_up() then return new; end if;    -- managers + admins approve

  -- Non-manager (developer / project_lead) rules below.
  if tg_table_name = 'tickets' then
    if tg_op = 'INSERT' and new.status not in ('draft','pending_approval') then
      raise exception 'Gate 1: developers may only create tickets as draft or pending_approval';
    end if;
    if tg_op = 'UPDATE' and new.status is distinct from old.status
       and new.status in ('approved','rejected','ready_to_bill','closed') then
      raise exception 'Gate 1: only managers can approve, reject, close, or mark a ticket ready to bill';
    end if;

  elsif tg_table_name = 'tasks' then
    if tg_op = 'INSERT' then
      if new.status not in ('draft','pending_approval','approved') then
        raise exception 'Gate 1: developers may only create tasks as draft, pending_approval, or (under an approved ticket) approved';
      end if;
      -- ADR-014: auto-approved task is allowed ONLY under an already-approved ticket
      if new.status = 'approved'
         and not exists (
           select 1 from tickets t
           where t.id = new.ticket_id
             and t.status in ('approved','in_progress','blocked','done','ready_to_bill')
         ) then
        raise exception 'Gate 1: a task may be auto-approved only under an approved ticket';
      end if;
    end if;
    if tg_op = 'UPDATE' and new.status is distinct from old.status
       and new.status = 'approved' then
      raise exception 'Gate 1: only managers can approve tasks';
    end if;

  elsif tg_table_name = 'bugs' then
    if tg_op = 'INSERT' and new.triage_status <> 'pending' then
      raise exception 'Gate 1: developers report bugs as pending triage only';
    end if;
    if tg_op = 'UPDATE' and new.triage_status is distinct from old.triage_status then
      raise exception 'Gate 1: only managers can triage bugs';
    end if;
  end if;

  return new;
end;
$$;

create trigger gate1_tickets before insert or update on tickets
  for each row execute function fn_gate1_status_guard();
create trigger gate1_tasks before insert or update on tasks
  for each row execute function fn_gate1_status_guard();
create trigger gate1_bugs before insert or update on bugs
  for each row execute function fn_gate1_status_guard();
