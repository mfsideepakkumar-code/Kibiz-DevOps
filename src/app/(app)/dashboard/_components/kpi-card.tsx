import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// A single executive KPI tile. `pending` renders a blocked metric (formula not
// yet confirmed) without inventing a number — see the dashboard page for which
// KPIs are gated on OQ-1 / C-10.
export function KpiCard({
  label,
  value,
  hint,
  pending,
}: {
  label: string;
  value?: string;
  hint?: string;
  pending?: boolean;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {pending ? (
          <>
            <p className="text-2xl font-medium text-muted-foreground">—</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {hint ?? "Pending formula sign-off"}
            </p>
          </>
        ) : (
          <>
            <p className="text-2xl font-medium tabular-nums">{value}</p>
            {hint ? (
              <p className={cn("mt-1 text-xs text-muted-foreground")}>{hint}</p>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}
