"use client";

import { memo, useCallback } from "react";
import type { CopilotMessage as CopilotMessageType } from "../store";
import type { CopilotResponse } from "@/lib/validators/copilot-schema";
import { dispatchCopilotAction } from "../action-dispatcher";
import { useTableData } from "@/features/data-table";
import type { TableStatus } from "@/features/data-table";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface CopilotMessageProps {
  readonly message: CopilotMessageType;
  /** Structured AI response — passed only to the most recent assistant message. */
  readonly structuredResponse?: CopilotResponse | null;
}

// ---------------------------------------------------------------------------
// Filter-value validator
// ---------------------------------------------------------------------------

/** The complete set of values accepted by `setStatusFilter`. */
const VALID_STATUS_FILTERS: ReadonlySet<string> = new Set<string>([
  "all",
  "active",
  "pending",
  "error",
]);

/** Type-guard: returns `true` when `value` is a valid status filter. */
function isValidStatusFilter(
  value: string,
): value is TableStatus | "all" {
  return VALID_STATUS_FILTERS.has(value);
}

// ---------------------------------------------------------------------------
// Severity helpers
// ---------------------------------------------------------------------------

type Severity = "low" | "medium" | "high";

const SEVERITY_STYLES: Record<Severity, string> = {
  low: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
  medium: "border-amber-500/20 bg-amber-500/10 text-amber-400",
  high: "border-red-500/20 bg-red-500/10 text-red-400",
} as const;

// ---------------------------------------------------------------------------
// Sub-components (private — not exported)
// ---------------------------------------------------------------------------

/** Pill-shaped severity indicator. */
function SeverityBadge({ severity }: { readonly severity: Severity }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${SEVERITY_STYLES[severity]}`}
    >
      {severity}
    </span>
  );
}

/** A single insight row with title, description, and severity badge. */
function InsightCard({
  title,
  description,
  severity,
}: {
  readonly title: string;
  readonly description: string;
  readonly severity: Severity;
}) {
  return (
    <li className="rounded-lg border border-gray-700/50 bg-gray-800/30 px-3 py-2.5">
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-gray-100">{title}</span>
        <SeverityBadge severity={severity} />
      </div>
      <p className="text-xs leading-relaxed text-gray-400">{description}</p>
    </li>
  );
}

/** Interactive button for a suggested copilot action. */
function ActionButton({
  label,
  onExecute,
}: {
  readonly label: string;
  readonly onExecute: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onExecute}
      className="cursor-pointer rounded-md border border-indigo-500/25 bg-indigo-500/5 px-2.5 py-1.5 text-[11px] font-medium text-indigo-300 transition-colors hover:bg-indigo-500/10"
    >
      {label}
    </button>
  );
}

/** Amber-styled warnings list. */
function WarningsList({ warnings }: { readonly warnings: readonly string[] }) {
  if (warnings.length === 0) return null;

  return (
    <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2">
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-amber-400">
        Warnings
      </p>
      <ul className="space-y-1">
        {warnings.map((warning) => (
          <li key={warning} className="text-xs leading-relaxed text-amber-300/80">
            &bull; {warning}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Small confidence score pill. */
function ConfidenceBadge({ score }: { readonly score: number }) {
  const percentage = Math.round(score * 100);
  const colorClass =
    score >= 0.8
      ? "text-emerald-400 border-emerald-500/20 bg-emerald-500/5"
      : score >= 0.5
        ? "text-amber-400 border-amber-500/20 bg-amber-500/5"
        : "text-red-400 border-red-500/20 bg-red-500/5";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${colorClass}`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 16 16"
        fill="currentColor"
        className="size-2.5"
        aria-hidden="true"
      >
        <circle cx="8" cy="8" r="8" />
      </svg>
      {String(percentage)}% confidence
    </span>
  );
}

// ---------------------------------------------------------------------------
// Structured assistant response body
// ---------------------------------------------------------------------------

/** Full structured rendering of a validated AI copilot response. */
function StructuredResponseBody({
  response,
}: {
  readonly response: CopilotResponse;
}) {
  const { setStatusFilter } = useTableData();

  /**
   * Wraps the narrowly-typed `setStatusFilter` (which accepts
   * `TableStatus | "all"`) so it satisfies the dispatcher's generic
   * `(value: string) => void` contract.  Invalid values are silently
   * ignored — the LLM may produce arbitrary strings.
   */
  const safeSetStatusFilter = useCallback(
    (value: string): void => {
      if (isValidStatusFilter(value)) {
        setStatusFilter(value);
      }
    },
    [setStatusFilter],
  );

  const handleActionClick = useCallback(
    (action: CopilotResponse["suggestedActions"][number]) => {
      dispatchCopilotAction({
        action: {
          actionType: action.actionType,
          payload: action.payload,
        },
        tableControls: { setStatusFilter: safeSetStatusFilter },
        metricControls: {},
      });
    },
    [safeSetStatusFilter],
  );

  const hasInsights = response.insights.length > 0;
  const hasActions = response.suggestedActions.length > 0;
  const hasWarnings = response.warnings.length > 0;

  return (
    <div className="mt-1.5 space-y-3">
      {/* ---- Summary ---------------------------------------------------- */}
      <div>
        <h4 className="mb-0.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
          Summary
        </h4>
        <p className="text-sm font-medium leading-relaxed text-gray-100">
          {response.summary}
        </p>
      </div>

      {/* ---- Insights --------------------------------------------------- */}
      {hasInsights && (
        <div>
          <h4 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
            Insights
          </h4>
          <ul className="space-y-2">
            {response.insights.map((insight) => (
              <InsightCard
                key={`${insight.title}-${insight.severity}`}
                title={insight.title}
                description={insight.description}
                severity={insight.severity}
              />
            ))}
          </ul>
        </div>
      )}

      {/* ---- Suggested actions ------------------------------------------ */}
      {hasActions && (
        <div>
          <h4 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
            Suggested Actions
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {response.suggestedActions.map((action) => (
              <ActionButton
                key={action.label}
                label={action.label}
                onExecute={() => handleActionClick(action)}
              />
            ))}
          </div>
        </div>
      )}

      {/* ---- Warnings --------------------------------------------------- */}
      {hasWarnings && <WarningsList warnings={response.warnings} />}

      {/* ---- Confidence score ------------------------------------------- */}
      <div className="flex justify-end pt-0.5">
        <ConfidenceBadge score={response.confidenceScore} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Renders a single chat bubble.
 *
 * - **User** messages are right-aligned with an indigo tint.
 * - **Assistant** messages are left-aligned with a neutral gray tint.
 * - When `structuredResponse` is provided on an assistant message the
 *   component renders the full structured layout (summary, insights,
 *   suggested actions, warnings, confidence score) instead of plain text.
 */
const CopilotMessage = memo<CopilotMessageProps>(function CopilotMessage({
  message,
  structuredResponse,
}) {
  const isUser = message.role === "user";
  const isAssistant = message.role === "assistant";
  const showStructured =
    isAssistant && structuredResponse != null;

  return (
    <div
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
      role="listitem"
    >
      <div
        className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed ${
          isUser
            ? "rounded-br-sm bg-indigo-600/20 text-indigo-100"
            : "rounded-bl-sm border border-gray-800 bg-gray-800/50 text-gray-200"
        }`}
      >
        {/* Role label — visually subtle, useful for screen-readers & scannability */}
        <span
          className={`mb-1 block text-[11px] font-medium uppercase tracking-wide ${
            isUser ? "text-indigo-400/70" : "text-gray-500"
          }`}
        >
          {isUser ? "You" : "Copilot"}
        </span>

        {/* Message body — structured or plain text */}
        {showStructured ? (
          <StructuredResponseBody response={structuredResponse} />
        ) : (
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        )}
      </div>
    </div>
  );
});

export { CopilotMessage };
export type { CopilotMessageProps };
