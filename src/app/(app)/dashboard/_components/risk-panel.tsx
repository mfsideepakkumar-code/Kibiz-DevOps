import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/kit/data-state";
import { StatusBadge } from "@/components/kit/status-badge";
import {
  EMPTY_VALUE,
  formatCurrency,
  formatDate,
  formatHours,
  formatPercent,
} from "@/lib/format";

export type ExposureRisk = {
  client_id: string | null;
  client_name: string | null;
  exposure_percent: number | null;
  unbilled_amount: number | null;
  credit_limit: number | null;
};
export type BlockRisk = {
  hour_block_id: string;
  client_name: string | null;
  used_percent: number | null;
  remaining_hours: number | null;
  projected_depletion_date: string | null;
};
export type KicareRisk = {
  contract_id: string;
  client_name: string | null;
  status: string | null;
  end_date: string | null;
};

function severity(percent: number | null): "danger" | "warning" {
  return percent !== null && percent >= 90 ? "danger" : "warning";
}

export function RiskPanel({
  exposure,
  blocks,
  kicare,
}: {
  exposure: ExposureRisk[];
  blocks: BlockRisk[];
  kicare: KicareRisk[];
}) {
  const total = exposure.length + blocks.length + kicare.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Risk panel
          {total > 0 ? (
            <StatusBadge status="warning" label={`${total} flagged`} />
          ) : null}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {total === 0 ? (
          <EmptyState
            title="No active risk signals"
            description="Credit exposure, hour-block depletion, and KiCare contract health are all within thresholds."
          />
        ) : null}

        {exposure.length > 0 ? (
          <section className="space-y-2">
            <h3 className="text-sm font-medium">Credit exposure ≥ 70%</h3>
            <ul className="space-y-1">
              {exposure.map((e) => (
                <li
                  key={e.client_id ?? e.client_name ?? "?"}
                  className="flex items-center justify-between gap-4 rounded-md border px-3 py-2 text-sm"
                >
                  <span className="min-w-0 truncate">
                    {e.client_name ?? EMPTY_VALUE}
                  </span>
                  <span className="flex shrink-0 items-center gap-3 tabular-nums">
                    <span className="text-muted-foreground">
                      {formatCurrency(e.unbilled_amount)} / {formatCurrency(e.credit_limit)}
                    </span>
                    <StatusBadge
                      status={severity(e.exposure_percent)}
                      label={formatPercent(e.exposure_percent)}
                    />
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {blocks.length > 0 ? (
          <section className="space-y-2">
            <h3 className="text-sm font-medium">Hour blocks ≥ 80% used</h3>
            <ul className="space-y-1">
              {blocks.map((b) => (
                <li
                  key={b.hour_block_id}
                  className="flex items-center justify-between gap-4 rounded-md border px-3 py-2 text-sm"
                >
                  <span className="min-w-0 truncate">
                    {b.client_name ?? EMPTY_VALUE}
                  </span>
                  <span className="flex shrink-0 items-center gap-3 tabular-nums">
                    <span className="text-muted-foreground">
                      {formatHours(
                        b.remaining_hours === null ? null : b.remaining_hours * 60,
                      )}
                      h left · depletes {formatDate(b.projected_depletion_date)}
                    </span>
                    <StatusBadge
                      status={severity(b.used_percent)}
                      label={formatPercent(b.used_percent)}
                    />
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {kicare.length > 0 ? (
          <section className="space-y-2">
            <h3 className="text-sm font-medium">KiCare contracts at risk</h3>
            <ul className="space-y-1">
              {kicare.map((k) => (
                <li
                  key={k.contract_id}
                  className="flex items-center justify-between gap-4 rounded-md border px-3 py-2 text-sm"
                >
                  <span className="min-w-0 truncate">
                    {k.client_name ?? EMPTY_VALUE}
                  </span>
                  <span className="flex shrink-0 items-center gap-3">
                    <span className="text-muted-foreground tabular-nums">
                      ends {formatDate(k.end_date)}
                    </span>
                    <StatusBadge status={k.status ?? "at_risk"} />
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </CardContent>
    </Card>
  );
}
