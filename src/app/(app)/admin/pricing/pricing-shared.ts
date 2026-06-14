import type { Tables } from "@/lib/database.types";

export type PricingRow = Tables<"client_pricing">;

// Per-field audit record appended to client_pricing.price_history (append-only,
// enforced by trigger in migration 0008). Shape matches schema.md exactly.
export type PriceHistoryEntry = {
  field: string;
  old_value: string | number | null;
  new_value: string | number | null;
  updated_at: string;
  updated_by: string | null;
};

// Pricing fields tracked in price_history. notes is freeform and not audited.
export const AUDITED_FIELDS = [
  "hourly_rate",
  "hosting_price",
  "hosting_cycle",
  "filemaker_license_price",
  "filemaker_license_cycle",
  "billing_increment",
] as const;

export type AuditedField = (typeof AUDITED_FIELDS)[number];

export const FIELD_LABELS: Record<string, string> = {
  hourly_rate: "Hourly rate",
  hosting_price: "Hosting price",
  hosting_cycle: "Hosting cycle",
  filemaker_license_price: "FileMaker license price",
  filemaker_license_cycle: "FileMaker license cycle",
  billing_increment: "Billing increment",
};

// N11 / spec: client pricing not reviewed in 90 days is stale.
export const STALE_DAYS = 90;

export function isStale(updatedAt: string | null | undefined): boolean {
  if (!updatedAt) return true;
  const updated = new Date(updatedAt).getTime();
  if (Number.isNaN(updated)) return true;
  const ageDays = (Date.now() - updated) / 86_400_000;
  return ageDays > STALE_DAYS;
}

export function parseHistory(value: unknown): PriceHistoryEntry[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (e): e is PriceHistoryEntry =>
      typeof e === "object" && e !== null && "field" in e,
  );
}
