import { describe, expect, it } from "vitest";

import { addDays, mondayOf, recentWeeks, weekEnd } from "./week";

describe("mondayOf", () => {
  it("returns Monday for any weekday", () => {
    // 2026-06-15 is a Monday
    expect(mondayOf("2026-06-15")).toBe("2026-06-15");
    expect(mondayOf("2026-06-17")).toBe("2026-06-15"); // Wednesday
    expect(mondayOf("2026-06-21")).toBe("2026-06-15"); // Sunday
    expect(mondayOf("2026-06-14")).toBe("2026-06-08"); // Sunday → prior Monday
  });
});

describe("addDays / weekEnd", () => {
  it("adds days across month boundaries", () => {
    expect(addDays("2026-06-30", 1)).toBe("2026-07-01");
    expect(addDays("2026-06-01", -1)).toBe("2026-05-31");
  });
  it("weekEnd is Monday + 6 (Sunday)", () => {
    expect(weekEnd("2026-06-15")).toBe("2026-06-21");
  });
});

describe("recentWeeks", () => {
  it("returns N week-starts newest first", () => {
    expect(recentWeeks("2026-06-17", 3)).toEqual([
      "2026-06-15",
      "2026-06-08",
      "2026-06-01",
    ]);
  });
});
