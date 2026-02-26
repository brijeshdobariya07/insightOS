import { NextResponse } from "next/server";
import OpenAI from "openai";
import { z } from "zod";
import {
  CopilotResponseSchema,
  type CopilotResponse,
} from "@/lib/validators/copilot-schema";

// ---------------------------------------------------------------------------
// System prompt — exact role definition from ai-behavior-contract.md Section 2
// ---------------------------------------------------------------------------
const SYSTEM_PROMPT = `You are an AI Copilot embedded inside a SaaS analytics dashboard called insightOS.
You analyze structured dashboard data and provide concise, professional insights.
You must always respond in strict JSON format following the defined schema.
Never include explanations outside JSON.
Never include markdown formatting.
Never execute code.
Never hallucinate unavailable data.

You must respond with a JSON object matching this exact schema:
{
  "summary": "string",
  "insights": [
    { "title": "string", "description": "string", "severity": "low | medium | high" }
  ],
  "suggestedActions": [
    { "label": "string", "actionType": "APPLY_FILTER | EXPORT_REPORT | HIGHLIGHT_METRIC", "payload": {} }
  ],
  "warnings": ["string"],
  "confidenceScore": 0.0
}

Rules:
- No extra fields allowed.
- All fields must exist.
- If empty, return empty arrays.
- confidenceScore must be between 0.0 and 1.0.
- severity must be one of: low, medium, high.
- actionType must be one of: APPLY_FILTER, EXPORT_REPORT, HIGHLIGHT_METRIC.
- Never invent new action types. If unsure, leave suggestedActions empty.`;

// ---------------------------------------------------------------------------
// Safe fallback — ai-behavior-contract.md Section 9
// ---------------------------------------------------------------------------
const FALLBACK_RESPONSE: CopilotResponse = {
  summary: "Unable to analyze dashboard data at this time.",
  insights: [],
  suggestedActions: [],
  warnings: ["AI response validation failed."],
  confidenceScore: 0.0,
};

// ---------------------------------------------------------------------------
// Request body schema — validates incoming client payload
// ---------------------------------------------------------------------------
const RequestBodySchema = z.object({
  query: z.string().min(1),
  context: z.record(z.string(), z.unknown()),
});

// ---------------------------------------------------------------------------
// OpenAI client — lazily initialized on first request to avoid build-time
// errors when OPENAI_API_KEY is not yet available (e.g. during `next build`).
// The key is NEVER sent to the client; this file is a server-only Route Handler.
// ---------------------------------------------------------------------------
let _openai: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!_openai) {
    _openai = new OpenAI();
  }
  return _openai;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Attempt to extract valid JSON from a raw LLM string.
 * Handles cases where the model wraps JSON in markdown fences or adds
 * trailing text after the closing brace.
 */
function extractJson(raw: string): string {
  let trimmed = raw.trim();

  // Strip markdown code fences (```json ... ``` or ``` ... ```)
  const fenceMatch = /^```(?:json)?\s*\n?([\s\S]*?)\n?\s*```$/m.exec(trimmed);
  if (fenceMatch?.[1]) {
    trimmed = fenceMatch[1].trim();
  }

  // Find the outermost { ... } block
  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    trimmed = trimmed.slice(firstBrace, lastBrace + 1);
  }

  return trimmed;
}

/**
 * Parse raw LLM output into a validated CopilotResponse.
 * Follows ai-behavior-contract.md Section 9:
 *   1. Attempt to parse JSON directly.
 *   2. Attempt to repair (extract JSON from surrounding text).
 *   3. If still invalid, return null so caller can use fallback.
 */
function parseAndValidate(raw: string): CopilotResponse | null {
  // Attempt 1: direct parse
  try {
    const parsed: unknown = JSON.parse(raw);
    const result = CopilotResponseSchema.safeParse(parsed);
    if (result.success) {
      return result.data;
    }
  } catch {
    // Not valid JSON — fall through to repair attempt
  }

  // Attempt 2: repair — extract JSON substring and re-parse
  try {
    const repaired = extractJson(raw);
    const parsed: unknown = JSON.parse(repaired);
    const result = CopilotResponseSchema.safeParse(parsed);
    if (result.success) {
      return result.data;
    }
  } catch {
    // Repair also failed
  }

  return null;
}

/**
 * Build the user message that includes the query and the structured context.
 * Context is serialized as JSON so the model receives a deterministic format.
 */
function buildUserMessage(
  query: string,
  context: Record<string, unknown>,
): string {
  return [
    "Dashboard context:",
    JSON.stringify(context, null, 2),
    "",
    "User query:",
    query,
  ].join("\n");
}

// ---------------------------------------------------------------------------
// Route handler — POST /api/ai
// ---------------------------------------------------------------------------
export async function POST(request: Request): Promise<NextResponse> {
  // 1. Validate environment
  const model = process.env["LLM_MODEL"];
  if (!process.env["OPENAI_API_KEY"]) {
    console.error("[ai/route] OPENAI_API_KEY is not set");
    return NextResponse.json(FALLBACK_RESPONSE, { status: 503 });
  }
  if (!model) {
    console.error("[ai/route] LLM_MODEL is not set");
    return NextResponse.json(FALLBACK_RESPONSE, { status: 503 });
  }

  // 2. Parse & validate request body
  let body: z.infer<typeof RequestBodySchema>;
  try {
    const raw: unknown = await request.json();
    const parsed = RequestBodySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.issues },
        { status: 400 },
      );
    }
    body = parsed.data;
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON" },
      { status: 400 },
    );
  }

  // 3. Call OpenAI Chat Completions
  try {
    const client = getOpenAIClient();
    const completion = await client.chat.completions.create({
      model,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserMessage(body.query, body.context) },
      ],
    });

    // 4. Log token usage server-side (contract Section 10)
    if (completion.usage) {
      console.info("[ai/route] Token usage:", {
        prompt_tokens: completion.usage.prompt_tokens,
        completion_tokens: completion.usage.completion_tokens,
        total_tokens: completion.usage.total_tokens,
      });
    }

    // 5. Extract raw content
    const choice = completion.choices[0];
    const rawContent = choice?.message?.content;

    if (!rawContent) {
      console.warn("[ai/route] Empty response from model");
      return NextResponse.json(FALLBACK_RESPONSE);
    }

    // 6. Parse, validate (with repair attempt) per contract Section 9 & 13
    const validated = parseAndValidate(rawContent);

    if (validated) {
      return NextResponse.json(validated);
    }

    // Validation failed after repair — return safe fallback
    console.warn(
      "[ai/route] Response failed schema validation after repair attempt:",
      rawContent,
    );
    return NextResponse.json(FALLBACK_RESPONSE);
  } catch (error: unknown) {
    // 7. Handle OpenAI / network errors safely
    if (error instanceof OpenAI.APIError) {
      console.error("[ai/route] OpenAI API error:", {
        status: error.status,
        message: error.message,
        code: error.code,
      });

      const status = error.status === 429 ? 429 : 502;
      return NextResponse.json(FALLBACK_RESPONSE, { status });
    }

    // Unknown error — still return safe fallback, never crash
    console.error("[ai/route] Unexpected error:", error);
    return NextResponse.json(FALLBACK_RESPONSE, { status: 500 });
  }
}
