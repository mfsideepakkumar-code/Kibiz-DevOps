// Shared formatters — the ONLY place money, dates, and durations get
// formatted (CLAUDE.md UI standard: never hand-format inline).
// Money: numeric(12,2), default currency CAD (company_config.default_currency
// can override per call). Durations: raw integer minutes (schema.md).

/** Rendered for null/undefined values everywhere. */
export const EMPTY_VALUE = "—";

export function formatCurrency(
  amount: number | string | null | undefined,
  currency: string = "CAD",
): string {
  if (amount === null || amount === undefined || amount === "") {
    return EMPTY_VALUE;
  }
  const value = typeof amount === "string" ? Number(amount) : amount;
  if (Number.isNaN(value)) return EMPTY_VALUE;
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
  }).format(value);
}

/**
 * Dates arrive as date-only strings (work_date etc.) or timestamps.
 * Date-only strings are parsed as LOCAL dates — never via new Date("YYYY-MM-DD")
 * which shifts a day in negative-UTC timezones.
 */
function toDate(value: string | Date): Date {
  if (value instanceof Date) return value;
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (dateOnly) {
    return new Date(
      Number(dateOnly[1]),
      Number(dateOnly[2]) - 1,
      Number(dateOnly[3]),
    );
  }
  return new Date(value);
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return EMPTY_VALUE;
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) return EMPTY_VALUE;
  return new Intl.DateTimeFormat("en-CA", { dateStyle: "medium" }).format(date);
}

export function formatDateTime(
  value: string | Date | null | undefined,
): string {
  if (!value) return EMPTY_VALUE;
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) return EMPTY_VALUE;
  return new Intl.DateTimeFormat("en-CA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

/** Raw minutes → "1h 30m" (durations are stored as integer minutes). */
export function formatDuration(
  minutes: number | null | undefined,
): string {
  if (minutes === null || minutes === undefined || Number.isNaN(minutes)) {
    return EMPTY_VALUE;
  }
  const whole = Math.round(minutes);
  const h = Math.floor(whole / 60);
  const m = whole % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/** Raw minutes → decimal hours for billing-style tables, e.g. "1.50". */
export function formatHours(
  minutes: number | null | undefined,
  fractionDigits: number = 2,
): string {
  if (minutes === null || minutes === undefined || Number.isNaN(minutes)) {
    return EMPTY_VALUE;
  }
  return (minutes / 60).toFixed(fractionDigits);
}

export function formatPercent(
  value: number | null | undefined,
  fractionDigits: number = 1,
): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return EMPTY_VALUE;
  }
  return `${value.toFixed(fractionDigits)}%`;
}
