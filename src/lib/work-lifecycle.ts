// Work-item lifecycle: statuses + allowed transitions for tickets, tasks, and
// bugs. Mirrors the CHECK constraints in schema.md and the Gate 1 rules
// (ADR-014). The DB trigger fn_gate1_status_guard is the security backstop;
// this drives which transition buttons the UI offers.

export const TICKET_STATUSES = [
  "draft",
  "pending_approval",
  "approved",
  "in_progress",
  "blocked",
  "done",
  "ready_to_bill",
  "closed",
  "rejected",
] as const;
export type TicketStatus = (typeof TICKET_STATUSES)[number];

export const TASK_STATUSES = [
  "draft",
  "pending_approval",
  "approved",
  "in_progress",
  "blocked",
  "done",
  "archived",
] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const BUG_TRIAGE_STATUSES = [
  "pending",
  "approved",
  "merged",
  "converted",
  "rejected",
] as const;
export type BugTriageStatus = (typeof BUG_TRIAGE_STATUSES)[number];

// Transitions that require manager/admin (Gate 1 / governance). Used to gate
// the UI; enforced for real by the DB trigger.
export const MANAGER_ONLY_TICKET_TARGETS: TicketStatus[] = [
  "approved",
  "rejected",
  "ready_to_bill",
  "closed",
];
export const MANAGER_ONLY_TASK_TARGETS: TaskStatus[] = ["approved"];

const TICKET_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  draft: ["pending_approval"],
  pending_approval: ["approved", "rejected", "draft"],
  approved: ["in_progress", "blocked", "done", "closed"],
  in_progress: ["blocked", "done"],
  blocked: ["in_progress", "done"],
  done: ["ready_to_bill", "in_progress", "closed"],
  ready_to_bill: ["closed"],
  rejected: ["draft"],
  closed: [],
};

const TASK_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  draft: ["pending_approval"],
  pending_approval: ["approved", "draft"],
  approved: ["in_progress", "blocked", "done", "archived"],
  in_progress: ["blocked", "done"],
  blocked: ["in_progress", "done"],
  done: ["in_progress", "archived"],
  archived: [],
};

export function ticketTransitions(
  from: TicketStatus,
  isManager: boolean,
): TicketStatus[] {
  const all = TICKET_TRANSITIONS[from] ?? [];
  return isManager
    ? all
    : all.filter((s) => !MANAGER_ONLY_TICKET_TARGETS.includes(s));
}

export function taskTransitions(
  from: TaskStatus,
  isManager: boolean,
): TaskStatus[] {
  const all = TASK_TRANSITIONS[from] ?? [];
  return isManager
    ? all
    : all.filter((s) => !MANAGER_ONLY_TASK_TARGETS.includes(s));
}

export function canTransitionTicket(
  from: TicketStatus,
  to: TicketStatus,
  isManager: boolean,
): boolean {
  return ticketTransitions(from, isManager).includes(to);
}

export function canTransitionTask(
  from: TaskStatus,
  to: TaskStatus,
  isManager: boolean,
): boolean {
  return taskTransitions(from, isManager).includes(to);
}

// Gate 1 initial status for a newly created work item (ADR-014).
export function initialTicketStatus(isManager: boolean): TicketStatus {
  return isManager ? "approved" : "pending_approval";
}

// A dev task under an already-approved ticket is auto-approved; otherwise it
// enters Gate 1. Managers/admins always create approved.
export function initialTaskStatus(
  isManager: boolean,
  parentTicketStatus: TicketStatus,
): TaskStatus {
  if (isManager) return "approved";
  const parentApproved = (
    ["approved", "in_progress", "blocked", "done", "ready_to_bill"] as TicketStatus[]
  ).includes(parentTicketStatus);
  return parentApproved ? "approved" : "pending_approval";
}
