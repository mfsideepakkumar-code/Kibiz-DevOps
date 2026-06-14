import { describe, expect, it } from "vitest";

import {
  canTransitionTicket,
  initialTaskStatus,
  initialTicketStatus,
  taskTransitions,
  ticketTransitions,
} from "./work-lifecycle";

describe("Gate 1 initial status (ADR-014)", () => {
  it("dev-created ticket enters the approval queue", () => {
    expect(initialTicketStatus(false)).toBe("pending_approval");
  });

  it("manager-created ticket is auto-approved", () => {
    expect(initialTicketStatus(true)).toBe("approved");
  });

  it("dev task under an approved ticket is auto-approved (no Gate 1)", () => {
    expect(initialTaskStatus(false, "approved")).toBe("approved");
    expect(initialTaskStatus(false, "in_progress")).toBe("approved");
  });

  it("dev task under an unapproved ticket enters the queue", () => {
    expect(initialTaskStatus(false, "draft")).toBe("pending_approval");
    expect(initialTaskStatus(false, "pending_approval")).toBe("pending_approval");
  });
});

describe("ticket transitions", () => {
  it("hides approve/reject from non-managers on a pending ticket", () => {
    const dev = ticketTransitions("pending_approval", false);
    expect(dev).toContain("draft"); // withdraw
    expect(dev).not.toContain("approved");
    expect(dev).not.toContain("rejected");
  });

  it("lets managers approve or reject a pending ticket", () => {
    const mgr = ticketTransitions("pending_approval", true);
    expect(mgr).toContain("approved");
    expect(mgr).toContain("rejected");
  });

  it("only managers can mark ready_to_bill / close", () => {
    expect(canTransitionTicket("done", "ready_to_bill", false)).toBe(false);
    expect(canTransitionTicket("done", "ready_to_bill", true)).toBe(true);
  });

  it("closed is terminal", () => {
    expect(ticketTransitions("closed", true)).toHaveLength(0);
  });
});

describe("task transitions", () => {
  it("a dev assignee can progress an approved task without approving", () => {
    const dev = taskTransitions("approved", false);
    expect(dev).toContain("in_progress");
    expect(dev).toContain("done");
    expect(dev).not.toContain("approved");
  });

  it("only managers can approve a pending task", () => {
    expect(taskTransitions("pending_approval", false)).not.toContain("approved");
    expect(taskTransitions("pending_approval", true)).toContain("approved");
  });
});
