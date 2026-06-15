// Single source of truth for status → semantic colour (CLAUDE.md UI standard:
// one semantic palette; the same green means the same thing on every screen).
// Covers every lifecycle enum in schema.md. Unknown statuses render neutral.

export type StatusVariant = "success" | "warning" | "danger" | "info" | "neutral";

const STATUS_VARIANTS: Record<string, StatusVariant> = {
  // semantic levels (callers may pass a variant directly, e.g. risk severity)
  success: "success",
  warning: "warning",
  danger: "danger",
  info: "info",
  neutral: "neutral",

  // shared lifecycle
  draft: "neutral",
  submitted: "warning",
  pending_approval: "warning",
  approved: "success",
  rejected: "danger",
  in_progress: "info",
  blocked: "warning",
  done: "success",
  archived: "neutral",
  closed: "neutral",

  // time entries
  billed: "info",
  void: "danger",
  locked: "neutral",

  // tickets
  ready_to_bill: "info",

  // timesheets
  flagged: "warning",

  // invoices (overdue is DERIVED, passed explicitly by callers)
  sent: "info",
  partial: "warning",
  paid: "success",
  overdue: "danger",

  // hour blocks
  pending_payment: "warning",
  active: "success",
  depleted: "danger",
  cancelled: "danger",

  // projects / sprints / milestones
  on_hold: "warning",
  completed: "success",
  planned: "neutral",
  pending: "warning",

  // goal items
  carried: "warning",
  dropped: "danger",

  // bug triage
  merged: "info",
  converted: "info",

  // KiCare
  profitable: "success",
  at_risk: "warning",
  loss: "danger",

  // FM sync
  synced: "success",
  error: "danger",
  staff_mismatch: "danger",
};

export function statusVariant(status: string): StatusVariant {
  return STATUS_VARIANTS[status] ?? "neutral";
}

/** "pending_approval" → "Pending approval" */
export function statusLabel(status: string): string {
  const words = status.replaceAll("_", " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}
