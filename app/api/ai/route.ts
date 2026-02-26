import {type CopilotResponse, CopilotResponseSchema} from "@/lib/validators/copilot-schema";
import {NextResponse} from "next/server";
import type {ChatCompletionChunk} from "openai/resources/chat/completions";
import OpenAI from "openai";
import {z} from "zod";

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
  confidenceScore: 0.0
};

// ---------------------------------------------------------------------------
// Request body schema — validates incoming client payload
// ---------------------------------------------------------------------------
const RequestBodySchema = z.object({
  query: z.string().min(1),
  context: z.record(z.string(), z.unknown())
});

// ---------------------------------------------------------------------------
// OpenAI client — lazily initialized on first request to avoid build-time
// errors when OPENAI_API_KEY is not yet available (e.g. during `next build`).
// The key is NEVER sent to the client; this file is a server-only Route Handler.
// ---------------------------------------------------------------------------
let _openai: OpenAI | null = null;

function getOpenAIClient(): OpenAI
{
  if(!_openai)
  {
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
function extractJson(raw: string): string
{
  let trimmed = raw.trim();

  // Strip markdown code fences (```json ... ``` or ``` ... ```)
  const fenceMatch = /^```(?:json)?\s*\n?([\s\S]*?)\n?\s*```$/m.exec(trimmed);
  if(fenceMatch?.[1])
  {
    trimmed = fenceMatch[1].trim();
  }

  // Find the outermost { ... } block
  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if(firstBrace !== -1 && lastBrace > firstBrace)
  {
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
function parseAndValidate(raw: string): CopilotResponse | null
{
  // Attempt 1: direct parse
  try
  {
    const parsed: unknown = JSON.parse(raw);
    const result = CopilotResponseSchema.safeParse(parsed);
    if(result.success)
    {
      return result.data;
    }
  }
  catch
  {
    // Not valid JSON — fall through to repair attempt
  }

  // Attempt 2: repair — extract JSON substring and re-parse
  try
  {
    const repaired = extractJson(raw);
    const parsed: unknown = JSON.parse(repaired);
    const result = CopilotResponseSchema.safeParse(parsed);
    if(result.success)
    {
      return result.data;
    }
  }
  catch
  {
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
  context: Record<string, unknown>
): string
{
  return [
    "Dashboard context:",
    JSON.stringify(context, null, 2),
    "",
    "User query:",
    query
  ].join("\n");
}

// ---------------------------------------------------------------------------
// Streaming — JSON-line event types and encoder
// ---------------------------------------------------------------------------

/**
 * Discriminated union for newline-delimited JSON events streamed to the client.
 *
 * - `token` — incremental content delta from the model.
 * - `done`  — final CopilotResponse after the stream completes.
 *             Contains either the Zod-validated response or FALLBACK_RESPONSE
 *             when validation fails (contract Section 9).
 */
type StreamEvent =
  | { readonly type: "token"; readonly content: string }
  | { readonly type: "done"; readonly payload: CopilotResponse };

const encoder = new TextEncoder();

/** Encode a StreamEvent as a UTF-8 JSON line (NDJSON). */
function encodeLine(event: StreamEvent): Uint8Array
{
  return encoder.encode(JSON.stringify(event) + "\n");
}

// ---------------------------------------------------------------------------
// Route handler — POST /api/ai
// ---------------------------------------------------------------------------
export async function POST(request: Request): Promise<Response>
{
  // 1. Validate environment
  const model = process.env["LLM_MODEL"];
  if(!process.env["OPENAI_API_KEY"])
  {
    console.error("[ai/route] OPENAI_API_KEY is not set");
    return NextResponse.json(FALLBACK_RESPONSE, {status: 503});
  }
  if(!model)
  {
    console.error("[ai/route] LLM_MODEL is not set");
    return NextResponse.json(FALLBACK_RESPONSE, {status: 503});
  }

  // 2. Parse & validate request body
  let body: z.infer<typeof RequestBodySchema>;
  try
  {
    const raw: unknown = await request.json();
    const parsed = RequestBodySchema.safeParse(raw);
    if(!parsed.success)
    {
      return NextResponse.json(
        {
          error: "Invalid request body",
          details: parsed.error.issues
        },
        {status: 400}
      );
    }
    body = parsed.data;
  }
  catch
  {
    return NextResponse.json(
      {error: "Request body must be valid JSON"},
      {status: 400}
    );
  }

  // 3. Open streaming connection to OpenAI Chat Completions
  try
  {
    const client = getOpenAIClient();

    // We must capture the stream reference outside the ReadableStream closure
    // so we can detect OpenAI API errors (auth, rate-limit) eagerly before
    // committing to the streaming Response.
    const openaiStream = await client.chat.completions.create({
      model,
      response_format: {type: "json_object"},
      stream: true,
      stream_options: {include_usage: true},
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT
        },
        {
          role: "user",
          content: buildUserMessage(body.query, body.context)
        }
      ]
    });

    // 4. Build ReadableStream that proxies OpenAI chunks as JSON-line events
    const readable = new ReadableStream<Uint8Array>({
      async start(controller: ReadableStreamDefaultController<Uint8Array>)
      {
        let fullContent = "";

        try
        {
          for await(const chunk of openaiStream as AsyncIterable<ChatCompletionChunk>)
          {
            // 4a. Log token usage when available (final chunk, contract Section 10)
            if(chunk.usage)
            {
              console.info("[ai/route] Token usage:", {
                prompt_tokens: chunk.usage.prompt_tokens,
                completion_tokens: chunk.usage.completion_tokens,
                total_tokens: chunk.usage.total_tokens
              });
            }

            // 4b. Extract delta content and stream to client
            const delta: string | null | undefined = chunk.choices[0]?.delta?.content;
            if(delta)
            {
              fullContent += delta;
              controller.enqueue(encodeLine({type: "token", content: delta}));
            }
          }

          // 5. Stream complete — validate full content per contract Section 9 & 13
          if(!fullContent)
          {
            console.warn("[ai/route] Empty response from model");
            controller.enqueue(encodeLine({type: "done", payload: FALLBACK_RESPONSE}));
            controller.close();
            return;
          }

          const validated = parseAndValidate(fullContent);

          if(validated)
          {
            controller.enqueue(encodeLine({type: "done", payload: validated}));
          }
          else
          {
            // Validation failed after repair — send safe fallback
            console.warn(
              "[ai/route] Response failed schema validation after repair attempt:",
              fullContent
            );
            controller.enqueue(encodeLine({type: "done", payload: FALLBACK_RESPONSE}));
          }
        }
        catch(streamError: unknown)
        {
          // Handle errors during stream iteration
          if(streamError instanceof OpenAI.APIError)
          {
            console.error("[ai/route] OpenAI API error during stream:", {
              status: streamError.status,
              message: streamError.message,
              code: streamError.code
            });
          }
          else
          {
            console.error("[ai/route] Unexpected error during stream:", streamError);
          }

          // Always send fallback so the client has a safe response to render
          controller.enqueue(encodeLine({type: "done", payload: FALLBACK_RESPONSE}));
        }

        controller.close();
      }
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive"
      }
    });
  }
  catch(error: unknown)
  {
    // 6. Handle errors that occur before the stream starts (auth, network, etc.)
    if(error instanceof OpenAI.APIError)
    {
      console.error("[ai/route] OpenAI API error:", {
        status: error.status,
        message: error.message,
        code: error.code
      });

      const status = error.status === 429 ? 429 : 502;
      return NextResponse.json(FALLBACK_RESPONSE, {status});
    }

    // Unknown error — still return safe fallback, never crash
    console.error("[ai/route] Unexpected error:", error);
    return NextResponse.json(FALLBACK_RESPONSE, {status: 500});
  }
}
