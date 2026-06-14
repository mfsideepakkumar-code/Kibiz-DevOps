"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  canTransitionTask,
  canTransitionTicket,
  initialTaskStatus,
  initialTicketStatus,
  type TaskStatus,
  type TicketStatus,
} from "@/lib/work-lifecycle";

export type ActionResult =
  | { ok: true; id?: string }
  | { ok: false; error: string };

const MANAGER_ROLES = ["manager", "admin"];

async function actor() {
  const user = await getCurrentUser();
  if (!user) return null;
  return { ...user, isManager: MANAGER_ROLES.includes(user.role) };
}

function refresh() {
  revalidatePath("/tickets");
  revalidatePath("/ops-queue");
}

const optionalText = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : v))
  .nullable()
  .optional();

// ── Tickets ──────────────────────────────────────────────────────────────────
const ticketSchema = z.object({
  project_id: z.string().uuid("Project is required"),
  sub_project_id: z
    .union([z.string().uuid(), z.literal("")])
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional(),
  title: z.string().trim().min(1, "Title is required"),
  description: optionalText,
  category_id: z.string().uuid("Category is required"),
  profit_center_id: z
    .union([z.string().uuid(), z.literal("")])
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional(),
  priority: z.enum(["p0", "p1", "p2", "p3"]).nullable().optional(),
  billing_type: z.enum(["billable", "non_billable"]).nullable().optional(),
});

export async function createTicket(input: unknown): Promise<ActionResult> {
  const user = await actor();
  if (!user) return { ok: false, error: "Not signed in." };

  const parsed = ticketSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tickets")
    .insert({
      ...parsed.data,
      status: initialTicketStatus(user.isManager),
      created_by: user.id,
    })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };
  refresh();
  return { ok: true, id: data.id };
}

export async function setTicketStatus(
  ticketId: string,
  to: TicketStatus,
): Promise<ActionResult> {
  const user = await actor();
  if (!user) return { ok: false, error: "Not signed in." };

  const supabase = await createClient();
  const { data: ticket, error: readError } = await supabase
    .from("tickets")
    .select("status")
    .eq("id", ticketId)
    .single();
  if (readError || !ticket) return { ok: false, error: "Ticket not found." };

  const from = ticket.status as TicketStatus;
  if (!canTransitionTicket(from, to, user.isManager)) {
    return { ok: false, error: `Cannot move ticket from ${from} to ${to}.` };
  }

  const { error } = await supabase
    .from("tickets")
    .update({ status: to, updated_at: new Date().toISOString() })
    .eq("id", ticketId);
  if (error) return { ok: false, error: error.message };

  // Governance transitions are recorded in the approvals audit trail.
  if (user.isManager && (to === "approved" || to === "rejected")) {
    await supabase.from("approvals").insert({
      item_type: "ticket",
      item_id: ticketId,
      reviewer_id: user.id,
      decision: to === "approved" ? "approved" : "rejected",
    });
  }
  refresh();
  return { ok: true };
}

// ── Tasks ────────────────────────────────────────────────────────────────────
const taskSchema = z.object({
  ticket_id: z.string().uuid(),
  title: z.string().trim().min(1, "Title is required"),
  description: optionalText,
  assignee_id: z
    .union([z.string().uuid(), z.literal("")])
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional(),
  priority: z.enum(["p0", "p1", "p2", "p3"]).nullable().optional(),
  estimated_hours: z
    .union([z.number(), z.string()])
    .transform((v) => (v === "" || v == null ? null : Number(v)))
    .refine((v) => v === null || !Number.isNaN(v), "Must be a number")
    .nullable()
    .optional(),
});

export async function createTask(input: unknown): Promise<ActionResult> {
  const user = await actor();
  if (!user) return { ok: false, error: "Not signed in." };

  const parsed = taskSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const supabase = await createClient();

  const { data: ticket, error: readError } = await supabase
    .from("tickets")
    .select("status")
    .eq("id", parsed.data.ticket_id)
    .single();
  if (readError || !ticket) return { ok: false, error: "Parent ticket not found." };

  const { error } = await supabase.from("tasks").insert({
    ...parsed.data,
    status: initialTaskStatus(user.isManager, ticket.status as TicketStatus),
    created_by: user.id,
  });
  if (error) return { ok: false, error: error.message };
  refresh();
  return { ok: true };
}

export async function setTaskStatus(
  taskId: string,
  to: TaskStatus,
): Promise<ActionResult> {
  const user = await actor();
  if (!user) return { ok: false, error: "Not signed in." };

  const supabase = await createClient();
  const { data: task, error: readError } = await supabase
    .from("tasks")
    .select("status")
    .eq("id", taskId)
    .single();
  if (readError || !task) return { ok: false, error: "Task not found." };

  const from = task.status as TaskStatus;
  if (!canTransitionTask(from, to, user.isManager)) {
    return { ok: false, error: `Cannot move task from ${from} to ${to}.` };
  }

  const { error } = await supabase.from("tasks").update({ status: to }).eq("id", taskId);
  if (error) return { ok: false, error: error.message };

  if (user.isManager && to === "approved") {
    await supabase.from("approvals").insert({
      item_type: "task",
      item_id: taskId,
      reviewer_id: user.id,
      decision: "approved",
    });
  }
  refresh();
  return { ok: true };
}

// ── Bugs ─────────────────────────────────────────────────────────────────────
const bugSchema = z.object({
  project_id: z.string().uuid("Project is required"),
  title: z.string().trim().min(1, "Title is required"),
  description: optionalText,
});

export async function createBug(input: unknown): Promise<ActionResult> {
  const user = await actor();
  if (!user) return { ok: false, error: "Not signed in." };

  const parsed = bugSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const supabase = await createClient();
  // All bugs enter pending triage (Gate 1); managers triage from the queue.
  const { error } = await supabase.from("bugs").insert({
    ...parsed.data,
    triage_status: "pending",
    reporter_id: user.id,
  });
  if (error) return { ok: false, error: error.message };
  refresh();
  return { ok: true };
}

// ── Gate 1 approval queue actions (manager/admin) ────────────────────────────
export async function approveTicket(ticketId: string): Promise<ActionResult> {
  return setTicketStatus(ticketId, "approved");
}

export async function rejectTicket(
  ticketId: string,
  note: string,
): Promise<ActionResult> {
  const user = await actor();
  if (!user) return { ok: false, error: "Not signed in." };
  if (!user.isManager) return { ok: false, error: "Manager access required." };
  if (!note.trim()) return { ok: false, error: "A reason is required to reject." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("tickets")
    .update({ status: "rejected", updated_at: new Date().toISOString() })
    .eq("id", ticketId);
  if (error) return { ok: false, error: error.message };
  await supabase.from("approvals").insert({
    item_type: "ticket",
    item_id: ticketId,
    reviewer_id: user.id,
    decision: "rejected",
    notes: note.trim(),
  });
  refresh();
  return { ok: true };
}

export async function approveTask(taskId: string): Promise<ActionResult> {
  return setTaskStatus(taskId, "approved");
}

// Tasks have no 'rejected' state — a returned task goes back to draft for rework.
export async function returnTask(
  taskId: string,
  note: string,
): Promise<ActionResult> {
  const user = await actor();
  if (!user) return { ok: false, error: "Not signed in." };
  if (!user.isManager) return { ok: false, error: "Manager access required." };
  if (!note.trim()) return { ok: false, error: "A reason is required." };

  const supabase = await createClient();
  const { error } = await supabase.from("tasks").update({ status: "draft" }).eq("id", taskId);
  if (error) return { ok: false, error: error.message };
  await supabase.from("approvals").insert({
    item_type: "task",
    item_id: taskId,
    reviewer_id: user.id,
    decision: "returned",
    notes: note.trim(),
  });
  refresh();
  return { ok: true };
}

export async function triageBug(
  bugId: string,
  decision: "approved" | "rejected",
  note?: string,
): Promise<ActionResult> {
  const user = await actor();
  if (!user) return { ok: false, error: "Not signed in." };
  if (!user.isManager) return { ok: false, error: "Manager access required." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("bugs")
    .update({ triage_status: decision })
    .eq("id", bugId);
  if (error) return { ok: false, error: error.message };
  await supabase.from("approvals").insert({
    item_type: "bug",
    item_id: bugId,
    reviewer_id: user.id,
    decision,
    notes: note?.trim() || null,
  });
  refresh();
  return { ok: true };
}
