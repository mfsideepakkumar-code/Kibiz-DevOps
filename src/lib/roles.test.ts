import { describe, expect, it } from "vitest";

import { isRole, roleLandingPath, ROLES } from "./roles";

describe("roleLandingPath", () => {
  it("routes each role to its PRD landing", () => {
    expect(roleLandingPath("developer")).toBe("/my-day");
    expect(roleLandingPath("project_lead")).toBe("/my-day");
    expect(roleLandingPath("manager")).toBe("/ops-queue");
    expect(roleLandingPath("executive")).toBe("/dashboard");
    expect(roleLandingPath("admin")).toBe("/admin");
  });

  it("keeps client role off app surfaces (C-1)", () => {
    expect(roleLandingPath("client")).toBe("/portal-unavailable");
  });

  it("has a landing for every role", () => {
    for (const role of ROLES) {
      expect(roleLandingPath(role)).toMatch(/^\//);
    }
  });
});

describe("isRole", () => {
  it("accepts known roles and rejects unknown values", () => {
    expect(isRole("admin")).toBe(true);
    expect(isRole("superuser")).toBe(false);
    expect(isRole(null)).toBe(false);
  });
});
