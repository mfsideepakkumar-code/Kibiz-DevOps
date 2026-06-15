import "server-only";

import Anthropic from "@anthropic-ai/sdk";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  BILLING_SUMMARY_SYSTEM,
  buildBillingSummaryUserPrompt,
  type BillingSummaryContext,
} from "../../../prompts/billing-summary";

// AI model matrix: billing summaries run on the Claude API. Default model per
// the Claude API guidance; change here if finance picks a cheaper tier.
const BILLING_SUMMARY_MODEL = "claude-opus-4-8";

export class AiNotConfiguredError extends Error {
  constructor() {
    super("AI is not configured. Set ANTHROPIC_API_KEY to enable summaries.");
    this.name = "AiNotConfiguredError";
  }
}
export class AiRefusalError extends Error {
  constructor() {
    super("The AI declined to generate this summary. Write it manually.");
    this.name = "AiRefusalError";
  }
}

export function isAiConfigured(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

type Usage = {
  input_tokens?: number;
  output_tokens?: number;
  cache_read_input_tokens?: number | null;
  cache_creation_input_tokens?: number | null;
};

// Token usage is logged on every call (AI matrix). Best-effort, server-side.
async function logUsage(
  feature: string,
  model: string,
  status: "success" | "refusal" | "error",
  usage: Usage | null,
  userId: string | null,
) {
  try {
    const admin = createAdminClient();
    await admin.from("ai_usage_log").insert({
      user_id: userId,
      feature,
      model,
      status,
      input_tokens: usage?.input_tokens ?? 0,
      output_tokens: usage?.output_tokens ?? 0,
      cache_read_input_tokens: usage?.cache_read_input_tokens ?? 0,
      cache_creation_input_tokens: usage?.cache_creation_input_tokens ?? 0,
    });
  } catch {
    // Never let usage logging break the feature.
  }
}

export type BillingSummaryResult = {
  summary_text: string;
  internal_detail: string;
};

const SUMMARY_SCHEMA = {
  type: "object",
  properties: {
    summary_text: { type: "string" },
    internal_detail: { type: "string" },
  },
  required: ["summary_text", "internal_detail"],
  additionalProperties: false,
} as const;

export async function generateBillingSummary(
  ctx: BillingSummaryContext,
  userId: string | null,
): Promise<BillingSummaryResult> {
  if (!isAiConfigured()) throw new AiNotConfiguredError();
  const client = new Anthropic();

  let response: Anthropic.Message;
  try {
    response = await client.messages.create({
      model: BILLING_SUMMARY_MODEL,
      max_tokens: 1500,
      system: BILLING_SUMMARY_SYSTEM,
      output_config: { format: { type: "json_schema", schema: SUMMARY_SCHEMA } },
      messages: [{ role: "user", content: buildBillingSummaryUserPrompt(ctx) }],
    });
  } catch (err) {
    await logUsage("billing_summary", BILLING_SUMMARY_MODEL, "error", null, userId);
    throw err;
  }

  if (response.stop_reason === "refusal") {
    await logUsage("billing_summary", BILLING_SUMMARY_MODEL, "refusal", response.usage, userId);
    throw new AiRefusalError();
  }

  const textBlock = response.content.find((b) => b.type === "text");
  const raw = textBlock && textBlock.type === "text" ? textBlock.text : "";
  let parsed: BillingSummaryResult;
  try {
    parsed = JSON.parse(raw) as BillingSummaryResult;
  } catch {
    await logUsage("billing_summary", BILLING_SUMMARY_MODEL, "error", response.usage, userId);
    throw new Error("The AI returned an unparseable summary. Try again.");
  }

  await logUsage("billing_summary", BILLING_SUMMARY_MODEL, "success", response.usage, userId);
  return {
    summary_text: parsed.summary_text ?? "",
    internal_detail: parsed.internal_detail ?? "",
  };
}
