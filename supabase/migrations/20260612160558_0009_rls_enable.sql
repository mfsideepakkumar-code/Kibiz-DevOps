-- 0009: enable Row Level Security on EVERY table (security.md: no exceptions).
-- No policies yet = default deny for anon/authenticated. The service-role key
-- (server-side only) bypasses RLS. Granular role policies ship with P1-03
-- (Auth & RBAC); client-portal policies are written-but-DISABLED there (C-1).

alter table resources              enable row level security;
alter table users                  enable row level security;
alter table company_config         enable row level security;
alter table profit_centers         enable row level security;
alter table categories             enable row level security;
alter table clients                enable row level security;
alter table client_contacts        enable row level security;
alter table client_pricing         enable row level security;
alter table client_credit_policies enable row level security;
alter table projects               enable row level security;
alter table sub_projects           enable row level security;
alter table project_rates          enable row level security;
alter table sprints                enable row level security;
alter table milestones             enable row level security;
alter table tickets                enable row level security;
alter table tasks                  enable row level security;
alter table bugs                   enable row level security;
alter table time_entries           enable row level security;
alter table splits                 enable row level security;
alter table timer_state            enable row level security;
alter table recurring_templates    enable row level security;
alter table goal_items             enable row level security;
alter table timesheets             enable row level security;
alter table products               enable row level security;
alter table client_subscriptions   enable row level security;
alter table billing_summaries      enable row level security;
alter table invoices               enable row level security;
alter table invoice_lines          enable row level security;
alter table payments               enable row level security;
alter table payment_reminders      enable row level security;
alter table hour_blocks            enable row level security;
alter table hour_block_drawdowns   enable row level security;
alter table kicare_contracts       enable row level security;
alter table work_orders            enable row level security;
alter table approvals              enable row level security;
alter table notifications          enable row level security;
alter table expenses               enable row level security;
alter table audit_logs             enable row level security;
alter table report_snapshots       enable row level security;
alter table mcp_api_keys           enable row level security;
alter table mcp_audit_log          enable row level security;
