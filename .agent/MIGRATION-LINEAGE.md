# MIGRATION-LINEAGE.md — append one line per migration
# FORMAT: [migration_id] | [tables touched] | [reason] | [date]
20260612160549_0001_identity_and_config | resources, users, company_config, profit_centers, categories | initial identity & config + singleton seed + category seed | 2026-06-12
20260612160550_0002_clients_and_pricing | clients, client_contacts, client_pricing, client_credit_policies | clients & pricing per schema.md | 2026-06-12
20260612160551_0003_projects_and_work_hierarchy | projects, sub_projects, project_rates, sprints, milestones, tickets, tasks, bugs | work hierarchy + composite (project_id, sub_project_id) FK | 2026-06-12
20260612160552_0004_time_and_activities | time_entries, splits, timer_state, recurring_templates, goal_items, timesheets | time & activities; billable_label generated column | 2026-06-12
20260612160553_0005_products_and_subscriptions | products, client_subscriptions | products before billing so invoice_lines can FK products | 2026-06-12
20260612160554_0006_billing_and_invoicing | billing_summaries, invoices, invoice_lines, payments, payment_reminders, time_entries | billing core + invoice_no_seq + deferred time_entries.invoice_id FK | 2026-06-12
20260612160555_0007_engagement_models | hour_blocks, hour_block_drawdowns, kicare_contracts, work_orders | engagement models (blocks client-level per ADR-017) | 2026-06-12
20260612160557_0008_operations_and_audit | approvals, notifications, expenses, audit_logs, report_snapshots, mcp_api_keys, mcp_audit_log + triggers on 10 audited tables | ops tables + audit triggers + append-only/immutable enforcement + INSERT-only revokes | 2026-06-12
20260612160558_0009_rls_enable | all 41 tables | RLS enabled everywhere, zero policies = default deny (policies in P1-03) | 2026-06-12
20260612160559_0010_views_and_rpcs | views: v_unbilled_exposure, v_block_burn, v_kicare_profitability, v_hosting_margins, v_billable_by_developer, v_goal_plan_vs_actual; matview v_executive_kpis; fns fn_resolve_rate, fn_refresh_executive_kpis | reporting views (security_invoker) + rate resolution RPC | 2026-06-12
20260612162852_0011_auth_rbac | all tables (policies), users (grants), v_hosting_prices, fns fn_current_role/fn_is_staff/fn_is_manager_up/handle_new_user | RBAC: RLS policies per security.md, column-level cost-field revokes, signup trigger, disabled client-portal policies (C-1) | 2026-06-12
20260612163544_0012_auth_hardening | users (trigger), fn_current_role | new signups inactive by default; inactive users denied by all policies; roles assigned explicitly server-side | 2026-06-12
