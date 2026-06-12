import { describe, expect, it } from "vitest";

import { statusLabel, statusVariant } from "./status-variant";

describe("statusVariant", () => {
  it("maps approval lifecycle consistently", () => {
    expect(statusVariant("approved")).toBe("success");
    expect(statusVariant("pending_approval")).toBe("warning");
    expect(statusVariant("rejected")).toBe("danger");
    expect(statusVariant("draft")).toBe("neutral");
  });

  it("maps invoice statuses (overdue is passed explicitly — derived, ADR-021)", () => {
    expect(statusVariant("paid")).toBe("success");
    expect(statusVariant("partial")).toBe("warning");
    expect(statusVariant("overdue")).toBe("danger");
    expect(statusVariant("void")).toBe("danger");
  });

  it("maps KiCare and FM sync states", () => {
    expect(statusVariant("profitable")).toBe("success");
    expect(statusVariant("at_risk")).toBe("warning");
    expect(statusVariant("loss")).toBe("danger");
    expect(statusVariant("staff_mismatch")).toBe("danger");
  });

  it("falls back to neutral for unknown statuses", () => {
    expect(statusVariant("some_future_state")).toBe("neutral");
  });
});

describe("statusLabel", () => {
  it("humanizes snake_case", () => {
    expect(statusLabel("pending_approval")).toBe("Pending approval");
    expect(statusLabel("ready_to_bill")).toBe("Ready to bill");
  });
});
