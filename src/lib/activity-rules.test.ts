import { describe, expect, it } from "vitest";

import {
  activityValidationError,
  isOwnerEditable,
  splitMinutes,
  toMinutes,
} from "./activity-rules";

describe("toMinutes / splitMinutes", () => {
  it("combines hours and minutes into raw minutes", () => {
    expect(toMinutes(2, 30)).toBe(150);
    expect(toMinutes(0, 45)).toBe(45);
    expect(toMinutes(1, 0)).toBe(60);
  });

  it("round-trips through splitMinutes", () => {
    expect(splitMinutes(150)).toEqual({ hours: 2, minutes: 30 });
    expect(splitMinutes(45)).toEqual({ hours: 0, minutes: 45 });
  });
});

describe("activityValidationError", () => {
  it("rejects under one minute", () => {
    expect(
      activityValidationError({
        durationMinutes: 0,
        billable: false,
        description: null,
        hasTask: true,
      }),
    ).toMatch(/at least 1 minute/);
  });

  it("requires a description for billable time", () => {
    expect(
      activityValidationError({
        durationMinutes: 60,
        billable: true,
        description: "",
        hasTask: true,
      }),
    ).toMatch(/billable/);
  });

  it("requires a description for project-level (no task) time", () => {
    expect(
      activityValidationError({
        durationMinutes: 60,
        billable: false,
        description: "   ",
        hasTask: false,
      }),
    ).toMatch(/without a task/);
  });

  it("accepts a valid non-billable task entry with no description", () => {
    expect(
      activityValidationError({
        durationMinutes: 30,
        billable: false,
        description: null,
        hasTask: true,
      }),
    ).toBeNull();
  });

  it("accepts a valid billable entry with a description", () => {
    expect(
      activityValidationError({
        durationMinutes: 90,
        billable: true,
        description: "Implemented webhook retry",
        hasTask: true,
      }),
    ).toBeNull();
  });
});

describe("isOwnerEditable", () => {
  it("allows draft and rejected only", () => {
    expect(isOwnerEditable("draft")).toBe(true);
    expect(isOwnerEditable("rejected")).toBe(true);
    expect(isOwnerEditable("submitted")).toBe(false);
    expect(isOwnerEditable("approved")).toBe(false);
    expect(isOwnerEditable("locked")).toBe(false);
  });
});
