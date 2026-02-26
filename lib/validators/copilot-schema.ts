import { z } from "zod";

/**
 * Severity levels for copilot insights.
 * Must match ai-behavior-contract.md Section 4.
 */
const SeveritySchema = z.enum(["low", "medium", "high"]);

/**
 * Allowed action types the AI copilot may suggest.
 * Must match ai-behavior-contract.md Section 5.
 * AI must never invent new action types.
 */
const ActionTypeSchema = z.enum([
  "APPLY_FILTER",
  "EXPORT_REPORT",
  "HIGHLIGHT_METRIC",
]);

/**
 * A single insight returned by the AI copilot.
 * No extra fields allowed (.strict()).
 */
const InsightSchema = z
  .object({
    title: z.string(),
    description: z.string(),
    severity: SeveritySchema,
  })
  .strict();

/**
 * A single suggested action returned by the AI copilot.
 * payload is an open record for action-specific data
 * (e.g. { filterKey, filterValue } for APPLY_FILTER).
 * No extra fields allowed (.strict()).
 */
const SuggestedActionSchema = z
  .object({
    label: z.string(),
    actionType: ActionTypeSchema,
    payload: z.record(z.string(), z.unknown()),
  })
  .strict();

/**
 * Complete AI Copilot response schema.
 *
 * Enforces the strict output contract defined in ai-behavior-contract.md:
 * - All fields must exist (no optional fields).
 * - No extra fields allowed (.strict()).
 * - confidenceScore must be between 0.0 and 1.0.
 * - Empty arrays are valid for insights, suggestedActions, and warnings.
 */
export const CopilotResponseSchema = z
  .object({
    summary: z.string(),
    insights: z.array(InsightSchema),
    suggestedActions: z.array(SuggestedActionSchema),
    warnings: z.array(z.string()),
    confidenceScore: z.number().min(0).max(1),
  })
  .strict();

/**
 * TypeScript type inferred from CopilotResponseSchema.
 * Use this as the canonical type for validated AI copilot responses.
 */
export type CopilotResponse = z.infer<typeof CopilotResponseSchema>;
