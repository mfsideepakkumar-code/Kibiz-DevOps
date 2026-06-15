"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { mondayOf, weekEnd } from "@/lib/week";

export type ActionResult = { ok: true; message?: string } | { ok: false; error: string };

const MANAGER_ROLES = ["manager", "admin"];
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

function refresh() {
  revalidatePath("/timesheets");
  revalidatePath("/timesheet-review");
}

// Developer submits (or resubmits) their week: draft + rejected entries → submitted.
export async function submitTimesheet(weekStartInput: unknown): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Not signed in." };
  const parsed = dateSchema.safeParse(weekStartInput);
  if (!parsed.success) return { ok: false, error: "Invalid week." };
  const weekStart = mondayOf(parsed.data);
  const end = weekEnd(weekStart);
  const supabase = await createClient();

  // Move the week's editable entries to submitted (RLS: own draft/rejected → submitted).
  const { data: moved, error: moveError } = await supabase
    .from("time_entries")
    .update({ state: "submitted" })
    .eq("user_id", user.id)
    .gte("work_date", weekStart)
    .lte("work_date", end)
    .in("state", ["draft", "rejected"])
    .select("id");
  if (moveError) return { ok: false, error: moveError.message };

  // Need at least one entry in the week (submitted now, or already submitted).
  const { count } = await supabase
    .from("time_entries")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("work_date", weekStart)
    .lte("work_date", end)
    .in("state", ["submitted", "approved"]);
  if (!count) {
    return { ok: false, error: "No time logged this week to submit." };
  }

  const { error: tsError } = await supabase
    .from("timesheets")
    .upsert(
      {
        user_id: user.id,
        week_start: weekStart,
        status: "submitted",
        submitted_at: new Date().toISOString(),
      },
      { onConflict: "user_id,week_start" },
    );
  if (tsError) return { ok: false, error: tsError.message };

  refresh();
  return {
    ok: true,
    message: moved?.length
      ? `Submitted ${moved.length} ${moved.length === 1 ? "entry" : "entries"}.`
      : "Timesheet resubmitted.",
  };
}

async function loadTimesheet(
  supabase: Awaited<ReturnType<typeof createClient>>,
  id: string,
) {
  const { data } = await supabase
    .from("timesheets")
    .select("id, user_id, week_start")
    .eq("id", id)
    .single();
  return data;
}

// Manager approves the whole week: submitted entries → approved (billing-eligible).
export async function approveTimesheet(timesheetId: unknown): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Not signed in." };
  if (!MANAGER_ROLES.includes(user.role)) {
    return { ok: false, error: "Manager access required." };
  }
  const parsed = z.string().uuid().safeParse(timesheetId);
  if (!parsed.success) return { ok: false, error: "Invalid timesheet." };

  const supabase = await createClient();
  const ts = await loadTimesheet(supabase, parsed.data);
  if (!ts) return { ok: false, error: "Timesheet not found." };
  const end = weekEnd(ts.week_start);

  const { error: entriesError } = await supabase
    .from("time_entries")
    .update({ state: "approved" })
    .eq("user_id", ts.user_id)
    .gte("work_date", ts.week_start)
    .lte("work_date", end)
    .eq("state", "submitted");
  if (entriesError) return { ok: false, error: entriesError.message };

  const now = new Date().toISOString();
  const { error: tsError } = await supabase
    .from("timesheets")
    .update({
      status: "approved",
      reviewed_by: user.id,
      reviewed_at: now,
      approved_at: now,
    })
    .eq("id", ts.id);
  if (tsError) return { ok: false, error: tsError.message };

  refresh();
  return { ok: true, message: "Timesheet approved." };
}

// Manager flags specific entries back to the developer with a reason.
const flagSchema = z.object({
  timesheetId: z.string().uuid(),
  entryIds: z.array(z.string().uuid()).min(1, "Select at least one entry to flag"),
  note: z.string().trim().min(1, "A reason is required"),
});

export async function flagTimesheet(input: unknown): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Not signed in." };
  if (!MANAGER_ROLES.includes(user.role)) {
    return { ok: false, error: "Manager access required." };
  }
  const parsed = flagSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const { timesheetId, entryIds, note } = parsed.data;

  const supabase = await createClient();
  const ts = await loadTimesheet(supabase, timesheetId);
  if (!ts) return { ok: false, error: "Timesheet not found." };

  // Reject the selected submitted entries (constrained to this timesheet's owner).
  const { data: flagged, error: entriesError } = await supabase
    .from("time_entries")
    .update({ state: "rejected" })
    .in("id", entryIds)
    .eq("user_id", ts.user_id)
    .eq("state", "submitted")
    .select("id");
  if (entriesError) return { ok: false, error: entriesError.message };
  if (!flagged?.length) {
    return { ok: false, error: "No matching submitted entries to flag." };
  }

  // Per-entry audit trail (Gate 2).
  await supabase.from("approvals").insert(
    flagged.map((e) => ({
      item_type: "time_entry" as const,
      item_id: e.id,
      reviewer_id: user.id,
      decision: "rejected" as const,
      notes: note,
    })),
  );

  const now = new Date().toISOString();
  const { error: tsError } = await supabase
    .from("timesheets")
    .update({
      status: "flagged",
      review_note: note,
      reviewed_by: user.id,
      reviewed_at: now,
    })
    .eq("id", ts.id);
  if (tsError) return { ok: false, error: tsError.message };

  refresh();
  return { ok: true, message: `Flagged ${flagged.length} entr${flagged.length === 1 ? "y" : "ies"}.` };
}
