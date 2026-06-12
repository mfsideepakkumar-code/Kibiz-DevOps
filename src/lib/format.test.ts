import { describe, expect, it } from "vitest";

import {
  EMPTY_VALUE,
  formatCurrency,
  formatDate,
  formatDuration,
  formatHours,
  formatPercent,
} from "./format";

describe("formatCurrency", () => {
  it("formats CAD by default", () => {
    expect(formatCurrency(1234.5)).toBe("$1,234.50");
  });

  it("accepts numeric strings (Postgres numeric arrives as string)", () => {
    expect(formatCurrency("99.9")).toBe("$99.90");
  });

  it("supports other currencies", () => {
    expect(formatCurrency(10, "USD")).toContain("10.00");
  });

  it("renders em dash for null/undefined/invalid", () => {
    expect(formatCurrency(null)).toBe(EMPTY_VALUE);
    expect(formatCurrency(undefined)).toBe(EMPTY_VALUE);
    expect(formatCurrency("not-a-number")).toBe(EMPTY_VALUE);
  });
});

describe("formatDate", () => {
  it("parses date-only strings as local dates (no timezone shift)", () => {
    expect(formatDate("2026-06-12")).toBe("Jun 12, 2026");
    expect(formatDate("2026-01-01")).toBe("Jan 1, 2026");
  });

  it("renders em dash for null", () => {
    expect(formatDate(null)).toBe(EMPTY_VALUE);
  });
});

describe("formatDuration", () => {
  it("formats raw minutes", () => {
    expect(formatDuration(90)).toBe("1h 30m");
    expect(formatDuration(45)).toBe("45m");
    expect(formatDuration(120)).toBe("2h");
    expect(formatDuration(0)).toBe("0m");
  });

  it("renders em dash for null", () => {
    expect(formatDuration(null)).toBe(EMPTY_VALUE);
  });
});

describe("formatHours", () => {
  it("converts minutes to decimal hours", () => {
    expect(formatHours(90)).toBe("1.50");
    expect(formatHours(30, 1)).toBe("0.5");
  });
});

describe("formatPercent", () => {
  it("formats with one decimal by default", () => {
    expect(formatPercent(82.46)).toBe("82.5%");
  });

  it("renders em dash for null", () => {
    expect(formatPercent(null)).toBe(EMPTY_VALUE);
  });
});
