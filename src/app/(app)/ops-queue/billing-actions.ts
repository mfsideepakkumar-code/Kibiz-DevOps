"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  AiNotConfiguredError,
  AiRefusalError,
  generateBillingSummary,
} from "@/lib/ai/anthropic";
import type { BillingSummaryContext } from "../../../../prompts/billing-summary";

export type ActionResult = { ok: true; message?: string } | { ok: false; error: string };

const MANAGER_ROLES = ["manager", "admin"];

async function manager() {
  const user = await getCurrentUser();
  if (!user) return null;
  if (!MANAGER_ROLES.includes(user.role)) return null;
  return user;
}

function refresh() {
  revalidatePath("/ops-queue");
  revalidatePath("/tickets");
}

async function buildContext(
  supabase: Awaited<ReturnType<typeof createClient>>,
  ticketId: string,
): Promise<BillingSummaryContext | null> {
  const { data: ticket } = await supabase
    .from("tickets")
    .select(
      "title, description, projects(name, clients(name)), categories(name)",
    )
    .eq("id", ticketId)
    .single();
  if (!ticket) return null;

  const [{ data: tasks }, { data: entries }] = await Promise.all([
    supabase.from("tasks").select("title, status").eq("ticket_id", ticketId),
    supabase
      .from("time_entries")
      .select("duration_minutes, billable, description")
      .eq("ticket_id", ticketId)
      .neq("state", "void"),
  ]);

  const project = ticket.projects as
    | { name: string; clients: { name: string } | null }
    | null;
  const totalMinutes = (entries ?? []).reduce((n, e) => n + e.duration_minutes, 0);
  const billableMinutes = (entries ?? [])
    .filter((e) => e.billable)
    .reduce((n, e) => n + e.duration_minutes, 0);
  const entryNotes = Array.from(
    new Set(
      (entries ?? [])
        .map((e) => e.description?.trim())
        .filter((d): d is string => !!d),
    ),
  ).slice(0, 30);

  return {
    ticketTitle: ticket.title,
    ticketDescription: ticket.description,
    category: (ticket.categories as { name: string } | null)?.name ?? null,
    projectName: project?.name ?? null,
    clientName: project?.clients?.name ?? null,
    tasks: tasks ?? [],
    totalMinutes,
    billableMinutes,
    entryNotes,
  };
}

export async function generateBillingSummaryAction(
  ticketId: unknown,
): Promise<ActionResult> {
  const user = await manager();
  if (!user) return { ok: false, error: "Manager access required." };
  const parsed = z.string().uuid().safeParse(ticketId);
  if (!parsed.success) return { ok: false, error: "Invalid ticket." };

  const supabase = await createClient();
  const ctx = await buildContext(supabase, parsed.data);
  if (!ctx) return { ok: false, error: "Ticket not found." };

  let result;
  try {
    result = await generateBillingSummary(ctx, user.id);
  } catch (err) {
    if (err instanceof AiNotConfiguredError || err instanceof AiRefusalError) {
      return { ok: false, error: err.message };
    }
    return { ok: false, error: "AI summary failed. Try again or write it manually." };
  }

  const { error } = await supabase.from("billing_summaries").upsert(
    {
      ticket_id: parsed.data,
      summary_text: result.summary_text,
      internal_detail: result.internal_detail,
      generated_by: "ai",
      status: "draft",
    },
    { onConflict: "ticket_id" },
  );
  if (error) return { ok: false, error: error.message };
  refresh();
  return { ok: true, message: "Draft summary generated." };
}

const saveSchema = z.object({
  ticketId: z.string().uuid(),
  summary_text: z.string().trim().min(1, "Summary is required"),
  internal_detail: z.string().trim().nullable().optional(),
});

export async function saveBillingSummary(input: unknown): Promise<ActionResult> {
  const user = await manager();
  if (!user) return { ok: false, error: "Manager access required." };
  const parsed = saveSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const supabase = await createClient();
  const { error } = await supabase.from("billing_summaries").upsert(
    {
      ticket_id: parsed.data.ticketId,
      summary_text: parsed.data.summary_text,
      internal_detail: parsed.data.internal_detail ?? null,
      generated_by: "manual",
      status: "draft",
    },
    { onConflict: "ticket_id" },
  );
  if (error) return { ok: false, error: error.message };
  refresh();
  return { ok: true, message: "Summary saved." };
}

export async function approveBillingSummary(ticketId: unknown): Promise<ActionResult> {
  const user = await manager();
  if (!user) return { ok: false, error: "Manager access required." };
  const parsed = z.string().uuid().safeParse(ticketId);
  if (!parsed.success) return { ok: false, error: "Invalid ticket." };
  const supabase = await createClient();

  const { data: summary } = await supabase
    .from("billing_summaries")
    .select("id, summary_text")
    .eq("ticket_id", parsed.data)
    .maybeSingle();
  if (!summary?.summary_text?.trim()) {
    return { ok: false, error: "Generate or write a summary before approving." };
  }

  const now = new Date().toISOString();
  const { error: sErr } = await supabase
    .from("billing_summaries")
    .update({ status: "approved", approved_by: user.id, approved_at: now })
    .eq("ticket_id", parsed.data);
  if (sErr) return { ok: false, error: sErr.message };

  // Gate 3: ticket becomes Ready to bill (manager-only transition).
  const { error: tErr } = await supabase
    .from("tickets")
    .update({ status: "ready_to_bill", updated_at: now })
    .eq("id", parsed.data);
  if (tErr) return { ok: false, error: tErr.message };

  await supabase.from("approvals").insert({
    item_type: "billing_summary",
    item_id: summary.id,
    reviewer_id: user.id,
    decision: "approved",
  });
  refresh();
  return { ok: true, message: "Approved — ticket is ready to bill." };
}

export async function returnBillingSummary(
  ticketId: unknown,
  note: string,
): Promise<ActionResult> {
  const user = await manager();
  if (!user) return { ok: false, error: "Manager access required." };
  const parsed = z.string().uuid().safeParse(ticketId);
  if (!parsed.success) return { ok: false, error: "Invalid ticket." };
  if (!note.trim()) return { ok: false, error: "A reason is required." };
  const supabase = await createClient();

  const { data: summary } = await supabase
    .from("billing_summaries")
    .select("id")
    .eq("ticket_id", parsed.data)
    .maybeSingle();
  if (!summary) return { ok: false, error: "No summary to return." };

  const { error } = await supabase
    .from("billing_summaries")
    .update({ status: "returned" })
    .eq("ticket_id", parsed.data);
  if (error) return { ok: false, error: error.message };

  await supabase.from("approvals").insert({
    item_type: "billing_summary",
    item_id: summary.id,
    reviewer_id: user.id,
    decision: "returned",
    notes: note.trim(),
  });
  refresh();
  return { ok: true, message: "Summary returned." };
}
