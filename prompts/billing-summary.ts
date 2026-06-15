// Billing summary prompt (Gate 3). Lives in /prompts/ per CLAUDE.md.
// CHANGES TO THIS PROMPT must run `npm run evals` (P1-14 harness) and may not
// merge on a >2-point regression. No eval baseline exists yet (P1-14 pending),
// so this is the v1 baseline.
//
// Two outputs (schema.md billing_summaries): summary_text is CLIENT-FACING;
// internal_detail is ACCOUNTING-ONLY. The client summary must never leak
// internal rates, costs, margins, or developer names.

export type BillingSummaryContext = {
  ticketTitle: string;
  ticketDescription: string | null;
  category: string | null;
  projectName: string | null;
  clientName: string | null;
  tasks: { title: string; status: string }[];
  totalMinutes: number;
  billableMinutes: number;
  entryNotes: string[];
};

export const BILLING_SUMMARY_SYSTEM = `You write billing summaries for a software/IT services company (KiBiz).
You produce two things from the work record of a single ticket:

1. summary_text — CLIENT-FACING. A concise, professional summary of the work
   delivered, written for the client who is paying the invoice. Plain business
   English, 2–5 sentences. Describe outcomes and value, not internal process.
   NEVER include: internal hourly rates, costs, margins, developer or staff
   names, internal tooling chatter, or apologies. Do not invent work that is
   not supported by the provided tasks and notes.

2. internal_detail — ACCOUNTING-ONLY. A short factual note for the billing team:
   what was done, the billable vs non-billable time split, and anything that
   affects how this should be billed. This is never shown to the client.

Ground every statement in the provided ticket, tasks, and notes. If the record
is thin, keep the summary short rather than embellishing. Do not fabricate work
items.`;

export function buildBillingSummaryUserPrompt(ctx: BillingSummaryContext): string {
  const hrs = (m: number) => (m / 60).toFixed(2);
  const taskLines = ctx.tasks.length
    ? ctx.tasks.map((t) => `- ${t.title} (${t.status})`).join("\n")
    : "- (no tasks recorded)";
  const noteLines = ctx.entryNotes.length
    ? ctx.entryNotes.map((n) => `- ${n}`).join("\n")
    : "- (no activity notes recorded)";

  return `Ticket: ${ctx.ticketTitle}
Category: ${ctx.category ?? "n/a"}
Client: ${ctx.clientName ?? "n/a"}
Project: ${ctx.projectName ?? "n/a"}

Description:
${ctx.ticketDescription?.trim() || "(none)"}

Tasks:
${taskLines}

Activity notes:
${noteLines}

Time: ${hrs(ctx.totalMinutes)}h total, of which ${hrs(ctx.billableMinutes)}h billable.

Write the client-facing summary_text and the accounting-only internal_detail.`;
}
