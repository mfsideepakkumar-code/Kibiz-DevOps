import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/kit/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/kit/data-state";
import {
  EMPTY_VALUE,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatHours,
} from "@/lib/format";
import { addDays, mondayOf, recentWeeks, todayUtc } from "@/lib/week";

import { KpiCard } from "./_components/kpi-card";
import { RefreshKpisButton } from "./_components/refresh-button";
import {
  RiskPanel,
  type BlockRisk,
  type ExposureRisk,
  type KicareRisk,
} from "./_components/risk-panel";
import {
  BillableMixChart,
  BillableTrendChart,
  type DevMix,
  type WeekPoint,
} from "./_components/dashboard-charts";

export const metadata = { title: "Executive Dashboard · KiBiz" };

const TREND_WEEKS = 12;
const EXPOSURE_THRESHOLD = 70;
const BLOCK_THRESHOLD = 80;
const hrs = (v: number | null) => formatHours(v == null ? null : v * 60, 1);

export default async function DashboardPage() {
  await requireRole("executive", "admin");

  const today = todayUtc();
  const cutoff30 = addDays(today, -30);
  const weeksAsc = recentWeeks(today, TREND_WEEKS).reverse();
  const trendCutoff = weeksAsc[0];

  // Materialized KPIs: access is revoked from API roles, so read via the
  // service role after the server-side exec/admin gate above.
  const admin = createAdminClient();
  const { data: kpis } = await admin
    .from("v_executive_kpis")
    .select("*")
    .maybeSingle();

  // Operational views are security_invoker — read under the caller's own RLS.
  const supabase = await createClient();
  const [
    { data: exposureRows },
    { data: blockRows },
    { data: kicareRows },
    { data: devRows },
    { data: clientRows },
  ] = await Promise.all([
    supabase
      .from("v_unbilled_exposure")
      .select("client_id, client_name, exposure_percent, unbilled_amount, credit_limit"),
    supabase
      .from("v_block_burn")
      .select("hour_block_id, client_id, used_percent, remaining_hours, projected_depletion_date"),
    supabase
      .from("v_kicare_profitability")
      .select("contract_id, client_name, status, end_date"),
    supabase
      .from("v_billable_by_developer")
      .select("user_name, billable, minutes, state, work_date")
      .gte("work_date", trendCutoff),
    supabase.from("clients").select("id, name"),
  ]);

  const clientName = new Map(
    (clientRows ?? []).map((c) => [c.id, c.name as string]),
  );

  const exposure: ExposureRisk[] = (exposureRows ?? [])
    .filter((e) => (e.exposure_percent ?? 0) >= EXPOSURE_THRESHOLD)
    .sort((a, b) => (b.exposure_percent ?? 0) - (a.exposure_percent ?? 0));

  const blocks: BlockRisk[] = (blockRows ?? [])
    .filter((b) => (b.used_percent ?? 0) >= BLOCK_THRESHOLD)
    .sort((a, b) => (b.used_percent ?? 0) - (a.used_percent ?? 0))
    .map((b) => ({
      hour_block_id: b.hour_block_id as string,
      client_name: b.client_id ? (clientName.get(b.client_id) ?? null) : null,
      used_percent: b.used_percent,
      remaining_hours: b.remaining_hours,
      projected_depletion_date: b.projected_depletion_date,
    }));

  const kicare: KicareRisk[] = (kicareRows ?? [])
    .filter((k) => k.status === "loss" || k.status === "at_risk")
    .map((k) => ({
      contract_id: k.contract_id as string,
      client_name: k.client_name,
      status: k.status,
      end_date: k.end_date,
    }));

  // Productivity: aggregate v_billable_by_developer (exclude void entries).
  const counted = (devRows ?? []).filter((r) => r.state !== "void");

  const mixByDev = new Map<string, { billable: number; nonBillable: number }>();
  const trendByWeek = new Map<string, number>(weeksAsc.map((w) => [w, 0]));

  for (const r of counted) {
    const minutes = r.minutes ?? 0;
    if (r.work_date && r.work_date >= cutoff30) {
      const name = r.user_name ?? "Unknown";
      const cur = mixByDev.get(name) ?? { billable: 0, nonBillable: 0 };
      if (r.billable) cur.billable += minutes;
      else cur.nonBillable += minutes;
      mixByDev.set(name, cur);
    }
    if (r.billable && r.work_date) {
      const wk = mondayOf(r.work_date);
      if (trendByWeek.has(wk)) trendByWeek.set(wk, (trendByWeek.get(wk) ?? 0) + minutes);
    }
  }

  const devMix: DevMix[] = Array.from(mixByDev.entries())
    .map(([name, m]) => ({
      name,
      billable: +(m.billable / 60).toFixed(2),
      nonBillable: +(m.nonBillable / 60).toFixed(2),
    }))
    .sort((a, b) => b.billable + b.nonBillable - (a.billable + a.nonBillable));

  const trend: WeekPoint[] = weeksAsc.map((w) => ({
    week: formatDate(w),
    billable: +((trendByWeek.get(w) ?? 0) / 60).toFixed(2),
  }));

  const k = kpis ?? null;

  return (
    <div>
      <PageHeader
        title="Executive Dashboard"
        description={
          k?.refreshed_at
            ? `KPIs as of ${formatDateTime(k.refreshed_at)}`
            : "KPIs not yet computed"
        }
        actions={<RefreshKpisButton />}
      />

      {/* The six headline KPIs (spec). Cost & Margin % await true-margin sign-off
          (C-10); Utilisation & Idle Cost await OQ-1 formulas — shown as pending
          rather than computed from a guessed formula. */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard
          label="Revenue (30d)"
          value={formatCurrency(k?.revenue_invoiced_30d)}
          hint="Invoiced, last 30 days"
        />
        <KpiCard label="Cost (30d)" pending hint="Pending true-cost sign-off (C-10)" />
        <KpiCard label="Margin %" pending hint="Pending true-margin sign-off (C-10)" />
        <KpiCard label="Utilisation" pending hint="Pending OQ-1 formula" />
        <KpiCard label="Idle Cost" pending hint="Pending OQ-1 formula" />
        <KpiCard
          label="Active Projects"
          value={String(k?.active_projects ?? 0)}
          hint={`${k?.active_clients ?? 0} active clients`}
        />
      </div>

      {/* Confirmed-formula operational metrics (v_executive_kpis). */}
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard
          label="Outstanding receivables"
          value={formatCurrency(k?.outstanding_receivables)}
          hint="Sent + partially paid invoices"
        />
        <KpiCard
          label="Billable hours (30d)"
          value={`${hrs(k?.billable_hours_30d ?? null)}h`}
          hint="Approved / billed / locked"
        />
        <KpiCard
          label="Approved hours (30d)"
          value={`${hrs(k?.total_approved_hours_30d ?? null)}h`}
          hint="All approved time"
        />
      </div>

      <div className="mt-6">
        <RiskPanel exposure={exposure} blocks={blocks} kicare={kicare} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Billable mix by developer (30d)</CardTitle>
          </CardHeader>
          <CardContent>
            {devMix.length === 0 ? (
              <EmptyState
                title="No time logged"
                description="Approved and draft activity from the last 30 days appears here."
              />
            ) : (
              <BillableMixChart data={devMix} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Billable hours trend ({TREND_WEEKS} weeks)</CardTitle>
          </CardHeader>
          <CardContent>
            {trend.every((t) => t.billable === 0) ? (
              <EmptyState
                title="No billable hours yet"
                description="Weekly billable totals appear here as time is logged."
              />
            ) : (
              <BillableTrendChart data={trend} />
            )}
          </CardContent>
        </Card>
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        {EMPTY_VALUE} on a KPI means its formula is not yet signed off. Cost,
        margin, utilisation, and idle-cost metrics are intentionally not computed
        until C-10 / OQ-1 are resolved.
      </p>
    </div>
  );
}
