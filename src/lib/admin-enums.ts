// Enum option lists + display labels for the admin screens. CHECK-constraint
// values come straight from schema.md — keep them in sync with migrations.

export const ENGAGEMENT_MODELS = [
  "hour_block",
  "pay_as_billed",
  "kicare",
] as const;
export type EngagementModel = (typeof ENGAGEMENT_MODELS)[number];

export const ENGAGEMENT_MODEL_LABELS: Record<EngagementModel, string> = {
  hour_block: "Hour Block",
  pay_as_billed: "Pay as billed",
  kicare: "KiCare",
};

export const PROJECT_STATUSES = [
  "active",
  "on_hold",
  "completed",
  "archived",
] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const BILLING_CYCLES = ["monthly", "annual"] as const;

// schema.md: 'exact' | '6min' | '15min'
export const BILLING_INCREMENT_LABELS: Record<string, string> = {
  exact: "Exact (no rounding)",
  "6min": "6-minute increments",
  "15min": "15-minute increments",
};

export function engagementLabel(value: string | null | undefined): string {
  if (!value) return "—";
  return ENGAGEMENT_MODEL_LABELS[value as EngagementModel] ?? value;
}
