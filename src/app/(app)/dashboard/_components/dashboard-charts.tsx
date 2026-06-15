"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type DevMix = {
  name: string;
  billable: number;
  nonBillable: number;
};
export type WeekPoint = {
  week: string;
  billable: number;
};

const AXIS = "var(--muted-foreground)";
const GRID = "var(--border)";

const tooltipStyle = {
  background: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius)",
  fontSize: "0.75rem",
} as const;

const hours = (v: unknown) => `${Number(v).toFixed(1)}h`;

// Billable vs non-billable hours per developer (last 30 days), stacked.
export function BillableMixChart({ data }: { data: DevMix[] }) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(160, data.length * 38)}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
        <CartesianGrid horizontal={false} stroke={GRID} />
        <XAxis
          type="number"
          stroke={AXIS}
          fontSize={12}
          tickFormatter={(v) => `${v}h`}
        />
        <YAxis
          type="category"
          dataKey="name"
          stroke={AXIS}
          fontSize={12}
          width={120}
        />
        <Tooltip contentStyle={tooltipStyle} formatter={(v) => hours(v)} />
        <Legend wrapperStyle={{ fontSize: "0.75rem" }} />
        <Bar
          dataKey="billable"
          name="Billable"
          stackId="h"
          fill="var(--success)"
          radius={[0, 0, 0, 0]}
        />
        <Bar
          dataKey="nonBillable"
          name="Non-Billable"
          stackId="h"
          fill="var(--muted-foreground)"
          radius={[0, 2, 2, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

// Weekly billable-hours trend (trailing weeks).
export function BillableTrendChart({ data }: { data: WeekPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ left: 8, right: 16, top: 8 }}>
        <CartesianGrid stroke={GRID} />
        <XAxis dataKey="week" stroke={AXIS} fontSize={12} />
        <YAxis stroke={AXIS} fontSize={12} tickFormatter={(v) => `${v}h`} />
        <Tooltip contentStyle={tooltipStyle} formatter={(v) => hours(v)} />
        <Line
          type="monotone"
          dataKey="billable"
          name="Billable hours"
          stroke="var(--primary)"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
