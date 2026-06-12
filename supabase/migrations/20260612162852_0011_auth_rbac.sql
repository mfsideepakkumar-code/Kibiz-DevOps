-- 0011: Auth & RBAC (P1-03)
-- · auth.users → public.users signup trigger (role from app_metadata only —
--   user-settable user_metadata can never grant a role)
-- · fn_current_role() helper for all policies
-- · RLS policies per security.md (silence = deny; project_lead scoping is an
--   OPEN QUESTION in TASKS.md — treated as developer until membership model
--   is defined)
-- · Column-level protection: cost fields revoked from `authenticated` entirely;
--   admin reads them server-side via the service role after a role check
-- · Client-portal policies WRITTEN BUT DISABLED at the end (C-1 hard block)

-- ─────────────────────────────────────────────────────────────────────────────
-- Role helper. SECURITY DEFINER so it can read users regardless of RLS.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function fn_current_role() returns text
language sql stable security definer set search_path = public as $$
  select role from users where id = auth.uid();
$$;

create or replace function fn_is_staff() returns boolean
language sql stable as $$
  select fn_current_role() in ('developer','project_lead','manager','executive','admin');
$$;

create or replace function fn_is_manager_up() returns boolean
language sql stable as $$
  select fn_current_role() in ('manager','executive','admin');
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Signup trigger: every auth user gets a public.users row, id-aligned with
-- auth.uid(). Role comes from raw_app_meta_data (server-controlled); default
-- 'developer'. Admins are created via the service-role admin API.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_app_meta_data ->> 'role', 'developer')
  )
  on conflict (email) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─────────────────────────────────────────────────────────────────────────────
-- Column-level protection (security.md: ABSENT, not null, for non-admins).
-- All app users share the `authenticated` Postgres role, so cost columns are
-- revoked from it outright. Admin screens read them server-side with the
-- service role (which keeps full grants) after a server-side role check.
-- ─────────────────────────────────────────────────────────────────────────────

revoke select, insert, update on users from authenticated;
grant select (id, name, email, role, resource_id, billing_rate_per_hour, is_active, fm_email)
  on users to authenticated;
grant update (name) on users to authenticated;

revoke select, insert, update on project_rates from authenticated;
grant select (id, project_id, user_id, billing_rate_per_hour, effective_from)
  on project_rates to authenticated;

revoke select, insert, update on products from authenticated;
grant select (id, name, description, category, unit_price, billing_cycle, profit_center_id, is_active)
  on products to authenticated;

-- Non-admin access path for hosting data: price only, no cost/margin
-- (v_hosting_margins selects products.cost_price, which non-admins can no
-- longer read — admins query the full view server-side via service role).
create view v_hosting_prices
with (security_invoker = true) as
select
  c.id as client_id,
  c.name as client_name,
  pr.id as product_id,
  pr.name as product_name,
  pr.category,
  cs.qty,
  coalesce(cs.unit_price_override, pr.unit_price) as price,
  cs.renewal_date
from client_subscriptions cs
join clients c on c.id = cs.client_id
join products pr on pr.id = cs.product_id;

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS policies (TO authenticated). service_role bypasses RLS.
-- ─────────────────────────────────────────────────────────────────────────────

-- users: directory readable by staff; own-row name updates only
create policy users_select on users for select to authenticated
  using (fn_is_staff());
create policy users_update_own on users for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- resources: executive + admin only (monthly_rate lives here)
create policy resources_select on resources for select to authenticated
  using (fn_current_role() in ('executive','admin'));

-- company_config: readable app-wide (branding, deadlines); admin edits
create policy company_config_select on company_config for select to authenticated
  using (fn_is_staff());
create policy company_config_update on company_config for update to authenticated
  using (fn_current_role() = 'admin') with check (fn_current_role() = 'admin');

-- reference data: readable by staff; mutations via service role only
create policy profit_centers_select on profit_centers for select to authenticated
  using (fn_is_staff());
create policy categories_select on categories for select to authenticated
  using (fn_is_staff());

-- clients & contacts: manager and above
create policy clients_select on clients for select to authenticated
  using (fn_is_manager_up());
create policy clients_write on clients for all to authenticated
  using (fn_current_role() in ('manager','admin')) with check (fn_current_role() in ('manager','admin'));
create policy client_contacts_select on client_contacts for select to authenticated
  using (fn_is_manager_up());
create policy client_contacts_write on client_contacts for all to authenticated
  using (fn_current_role() in ('manager','admin')) with check (fn_current_role() in ('manager','admin'));

-- client_pricing: ADMIN ONLY (security.md — admin-only screen)
create policy client_pricing_admin on client_pricing for all to authenticated
  using (fn_current_role() = 'admin') with check (fn_current_role() = 'admin');

-- client_credit_policies: manager+ read; admin write
create policy client_credit_policies_select on client_credit_policies for select to authenticated
  using (fn_is_manager_up());
create policy client_credit_policies_write on client_credit_policies for all to authenticated
  using (fn_current_role() = 'admin') with check (fn_current_role() = 'admin');

-- projects hierarchy: staff read (devs pick from approved tickets, ADR-014);
-- manager/admin write
create policy projects_select on projects for select to authenticated
  using (fn_is_staff());
create policy projects_write on projects for all to authenticated
  using (fn_current_role() in ('manager','admin')) with check (fn_current_role() in ('manager','admin'));
create policy sub_projects_select on sub_projects for select to authenticated
  using (fn_is_staff());
create policy sub_projects_write on sub_projects for all to authenticated
  using (fn_current_role() in ('manager','admin')) with check (fn_current_role() in ('manager','admin'));
create policy sprints_select on sprints for select to authenticated
  using (fn_is_staff());
create policy sprints_write on sprints for all to authenticated
  using (fn_current_role() in ('manager','admin')) with check (fn_current_role() in ('manager','admin'));
create policy milestones_select on milestones for select to authenticated
  using (fn_is_staff());
create policy milestones_write on milestones for all to authenticated
  using (fn_current_role() in ('manager','admin')) with check (fn_current_role() in ('manager','admin'));

-- project_rates: manager+ read (cost column already revoked); admin write
create policy project_rates_select on project_rates for select to authenticated
  using (fn_is_manager_up());

-- tickets/tasks/bugs: staff read; devs create their own (Gate 1 queue, P1-07
-- enforces state transitions); manager/admin full write
create policy tickets_select on tickets for select to authenticated
  using (fn_is_staff());
create policy tickets_insert on tickets for insert to authenticated
  with check (fn_is_staff() and created_by = auth.uid());
create policy tickets_update on tickets for update to authenticated
  using (fn_current_role() in ('manager','admin')
         or (created_by = auth.uid() and status in ('draft','pending_approval')));
create policy tasks_select on tasks for select to authenticated
  using (fn_is_staff());
create policy tasks_insert on tasks for insert to authenticated
  with check (fn_is_staff() and created_by = auth.uid());
create policy tasks_update on tasks for update to authenticated
  using (fn_current_role() in ('manager','admin')
         or assignee_id = auth.uid()
         or (created_by = auth.uid() and status in ('draft','pending_approval')));
create policy bugs_select on bugs for select to authenticated
  using (fn_is_staff());
create policy bugs_insert on bugs for insert to authenticated
  with check (fn_is_staff() and reporter_id = auth.uid());
create policy bugs_update on bugs for update to authenticated
  using (fn_current_role() in ('manager','admin'));

-- time_entries (security.md row policies; project_lead = developer for now,
-- see OPEN QUESTION in TASKS.md)
create policy time_entries_select on time_entries for select to authenticated
  using (user_id = auth.uid() or fn_is_manager_up());
create policy time_entries_insert on time_entries for insert to authenticated
  with check (user_id = auth.uid() and fn_is_staff());
create policy time_entries_update on time_entries for update to authenticated
  using (fn_current_role() in ('manager','admin')
         or (user_id = auth.uid() and state in ('draft','rejected')));

-- splits: visible/editable with the parent entry's rights
create policy splits_select on splits for select to authenticated
  using (exists (select 1 from time_entries te where te.id = time_entry_id
                 and (te.user_id = auth.uid() or fn_is_manager_up())));
create policy splits_write on splits for all to authenticated
  using (exists (select 1 from time_entries te where te.id = time_entry_id
                 and (fn_current_role() in ('manager','admin')
                      or (te.user_id = auth.uid() and te.state in ('draft','rejected')))))
  with check (exists (select 1 from time_entries te where te.id = time_entry_id
                 and (fn_current_role() in ('manager','admin')
                      or (te.user_id = auth.uid() and te.state in ('draft','rejected')))));

-- timer_state: own row; managers can see who is running
create policy timer_state_own on timer_state for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy timer_state_manager_select on timer_state for select to authenticated
  using (fn_is_manager_up());

-- goal_items: own; managers read all + push-planning inserts
create policy goal_items_own on goal_items for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid() or added_by = auth.uid());
create policy goal_items_manager_select on goal_items for select to authenticated
  using (fn_is_manager_up());
create policy goal_items_manager_insert on goal_items for insert to authenticated
  with check (fn_current_role() in ('manager','admin') and added_by = auth.uid());

-- recurring_templates: own + team-wide visible; manager/admin manage
create policy recurring_templates_select on recurring_templates for select to authenticated
  using (user_id = auth.uid() or user_id is null or fn_is_manager_up());
create policy recurring_templates_write on recurring_templates for all to authenticated
  using (fn_current_role() in ('manager','admin')) with check (fn_current_role() in ('manager','admin'));

-- timesheets: own lifecycle; manager review (Gate 2 transitions enforced in P1-11)
create policy timesheets_select on timesheets for select to authenticated
  using (user_id = auth.uid() or fn_is_manager_up());
create policy timesheets_insert on timesheets for insert to authenticated
  with check (user_id = auth.uid());
create policy timesheets_update on timesheets for update to authenticated
  using (user_id = auth.uid() or fn_current_role() in ('manager','admin'));

-- client_subscriptions: manager+ read; admin write
create policy client_subscriptions_select on client_subscriptions for select to authenticated
  using (fn_is_manager_up());
create policy client_subscriptions_write on client_subscriptions for all to authenticated
  using (fn_current_role() = 'admin') with check (fn_current_role() = 'admin');

-- billing & invoicing: manager+ read; manager/admin write (void rules in P2)
create policy billing_summaries_select on billing_summaries for select to authenticated
  using (fn_is_manager_up());
create policy billing_summaries_write on billing_summaries for all to authenticated
  using (fn_current_role() in ('manager','admin')) with check (fn_current_role() in ('manager','admin'));
create policy invoices_select on invoices for select to authenticated
  using (fn_is_manager_up());
create policy invoices_write on invoices for all to authenticated
  using (fn_current_role() in ('manager','admin')) with check (fn_current_role() in ('manager','admin'));
create policy invoice_lines_select on invoice_lines for select to authenticated
  using (fn_is_manager_up());
create policy invoice_lines_write on invoice_lines for all to authenticated
  using (fn_current_role() in ('manager','admin')) with check (fn_current_role() in ('manager','admin'));
create policy payments_select on payments for select to authenticated
  using (fn_is_manager_up());
create policy payments_write on payments for insert to authenticated
  with check (fn_current_role() = 'admin');
create policy payment_reminders_select on payment_reminders for select to authenticated
  using (fn_is_manager_up());
create policy payment_reminders_insert on payment_reminders for insert to authenticated
  with check (fn_current_role() in ('manager','admin'));

-- engagement models: manager+ read; manager/admin write
create policy hour_blocks_select on hour_blocks for select to authenticated
  using (fn_is_manager_up());
create policy hour_blocks_write on hour_blocks for all to authenticated
  using (fn_current_role() in ('manager','admin')) with check (fn_current_role() in ('manager','admin'));
create policy hour_block_drawdowns_select on hour_block_drawdowns for select to authenticated
  using (fn_is_manager_up());
create policy kicare_contracts_select on kicare_contracts for select to authenticated
  using (fn_is_manager_up());
create policy kicare_contracts_write on kicare_contracts for all to authenticated
  using (fn_current_role() in ('manager','admin')) with check (fn_current_role() in ('manager','admin'));
create policy work_orders_select on work_orders for select to authenticated
  using (fn_is_manager_up());
create policy work_orders_write on work_orders for all to authenticated
  using (fn_current_role() in ('manager','admin')) with check (fn_current_role() in ('manager','admin'));

-- approvals: manager/admin write; manager+ read
create policy approvals_select on approvals for select to authenticated
  using (fn_is_manager_up());
create policy approvals_insert on approvals for insert to authenticated
  with check (fn_current_role() in ('manager','admin') and reviewer_id = auth.uid());

-- notifications: own only; inserts come from workflows via service role
create policy notifications_select on notifications for select to authenticated
  using (user_id = auth.uid());
create policy notifications_update_own on notifications for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- expenses: admin write, executive read
create policy expenses_select on expenses for select to authenticated
  using (fn_current_role() in ('executive','admin'));
create policy expenses_write on expenses for all to authenticated
  using (fn_current_role() = 'admin') with check (fn_current_role() = 'admin');

-- audit_logs: admin read (INSERT only via security-definer triggers)
create policy audit_logs_select on audit_logs for select to authenticated
  using (fn_current_role() = 'admin');

-- report_snapshots: profit_margin = admin only; others exec + admin
create policy report_snapshots_select on report_snapshots for select to authenticated
  using (fn_current_role() = 'admin'
         or (fn_current_role() = 'executive' and type <> 'profit_margin'));
create policy report_snapshots_write on report_snapshots for insert to authenticated
  with check (fn_current_role() in ('executive','admin'));

-- MCP: admin only (Phase 3 server enforces scopes separately)
create policy mcp_api_keys_admin on mcp_api_keys for all to authenticated
  using (fn_current_role() = 'admin') with check (fn_current_role() = 'admin');
create policy mcp_audit_log_select on mcp_audit_log for select to authenticated
  using (fn_current_role() = 'admin');

-- ─────────────────────────────────────────────────────────────────────────────
-- CLIENT PORTAL POLICIES — WRITTEN BUT DISABLED (C-1 hard block).
-- Do NOT uncomment until DECISIONS.md resolves C-1. Conditions per security.md:
-- has_portal_access = true AND client scoping via JWT claim.
-- ─────────────────────────────────────────────────────────────────────────────
-- create policy client_portal_invoices on invoices for select to authenticated
--   using (fn_current_role() = 'client'
--          and client_id = (auth.jwt() -> 'app_metadata' ->> 'client_id')::uuid);
-- create policy client_portal_hour_blocks on hour_blocks for select to authenticated
--   using (fn_current_role() = 'client'
--          and client_id = (auth.jwt() -> 'app_metadata' ->> 'client_id')::uuid);
-- create policy client_portal_work_orders on work_orders for select to authenticated
--   using (fn_current_role() = 'client'
--          and client_id = (auth.jwt() -> 'app_metadata' ->> 'client_id')::uuid);
-- create policy client_portal_projects on projects for select to authenticated
--   using (fn_current_role() = 'client'
--          and client_id = (auth.jwt() -> 'app_metadata' ->> 'client_id')::uuid);
