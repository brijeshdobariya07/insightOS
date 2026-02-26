import type { CopilotResponse } from "@/lib/validators/copilot-schema";

/**
 * Shape of the error body returned by POST /api/ai on non-200 responses.
 */
interface ApiErrorBody {
  error: string;
  details?: unknown;
}

/**
 * Send a natural-language query with dashboard context to the AI Copilot
 * backend and return the validated response.
 *
 * @param query   - The user's natural-language question.
 * @param context - Structured dashboard context (active page, filters, metrics, etc.).
 * @returns A validated {@link CopilotResponse} from the server.
 * @throws {Error} On network failures, non-200 status codes, or unparseable responses.
 */
export async function sendCopilotQuery(
  query: string,
  context: Record<string, unknown>,
): Promise<CopilotResponse> {
  const response = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, context }),
  });

  if (!response.ok) {
    let message = `Copilot request failed (${String(response.status)})`;

    try {
      const body: ApiErrorBody = (await response.json()) as ApiErrorBody;
      if (body.error) {
        message = body.error;
      }
    } catch {
      // Response body was not valid JSON — use the default message.
    }

    throw new Error(message);
  }

  const data: CopilotResponse = (await response.json()) as CopilotResponse;
  return data;
}
