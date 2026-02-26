// ---------------------------------------------------------------------------
// Action Dispatcher — executes copilot-suggested actions against the host UI
// controls.  Pure logic module — no React imports, no side-effects beyond the
// control callbacks it receives and the metrics Zustand store.
//
// Action types are the closed enum defined in ai-behavior-contract.md §5:
//   APPLY_FILTER · EXPORT_REPORT · HIGHLIGHT_METRIC
// ---------------------------------------------------------------------------

import { useMetricsStore } from "@/features/metrics/store";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** The closed set of action types the AI copilot may suggest. */
type CopilotActionType = "APPLY_FILTER" | "EXPORT_REPORT" | "HIGHLIGHT_METRIC";

/** A validated copilot action with its open payload. */
interface CopilotAction {
  readonly actionType: CopilotActionType;
  readonly payload: Record<string, unknown>;
}

/** Callbacks the host page exposes for data-table manipulation. */
interface TableControls {
  readonly setStatusFilter: (value: string) => void;
}

/** Callbacks the host page exposes for metric highlighting. */
interface MetricControls {
  readonly highlightMetric?: ((key: string) => void) | undefined;
}

/** Parameters accepted by {@link dispatchCopilotAction}. */
export interface DispatchCopilotActionParams {
  readonly action: CopilotAction;
  readonly tableControls: TableControls;
  readonly metricControls: MetricControls;
}

/** Structured result returned by the dispatcher. */
export interface DispatchResult {
  readonly success: boolean;
  readonly actionType: CopilotActionType;
  readonly error?: string | undefined;
}

// ---------------------------------------------------------------------------
// Payload validators
// ---------------------------------------------------------------------------

/**
 * Safely extract a `string` value from a `Record<string, unknown>` at the
 * given key.  Returns `undefined` if the key is missing or not a string.
 */
function extractString(
  payload: Record<string, unknown>,
  key: string,
): string | undefined {
  const value: unknown = payload[key];
  return typeof value === "string" ? value : undefined;
}

// ---------------------------------------------------------------------------
// Per-action handlers
// ---------------------------------------------------------------------------

function handleApplyFilter(
  payload: Record<string, unknown>,
  tableControls: TableControls,
): DispatchResult {
  const filterValue = extractString(payload, "filterValue");

  if (filterValue === undefined) {
    return {
      success: false,
      actionType: "APPLY_FILTER",
      error:
        'APPLY_FILTER requires a "filterValue" string in the action payload.',
    };
  }

  tableControls.setStatusFilter(filterValue);

  return { success: true, actionType: "APPLY_FILTER" };
}

function handleExportReport(): DispatchResult {
  // Placeholder — wire to a real export service when available.
  console.info("Report exported");

  return { success: true, actionType: "EXPORT_REPORT" };
}

function handleHighlightMetric(
  payload: Record<string, unknown>,
  metricControls: MetricControls,
): DispatchResult {
  const raw = extractString(payload, "metricKey");

  if (raw === undefined) {
    return {
      success: false,
      actionType: "HIGHLIGHT_METRIC",
      error:
        'HIGHLIGHT_METRIC requires a "metricKey" string in the action payload.',
    };
  }

  const metricKey = raw.trim();

  if (metricKey.length === 0) {
    return {
      success: false,
      actionType: "HIGHLIGHT_METRIC",
      error:
        'HIGHLIGHT_METRIC "metricKey" must be a non-empty string.',
    };
  }

  // Prefer the injected callback when provided; fall back to the Zustand store
  // so highlighting works even when the host page does not wire a callback.
  const highlight =
    metricControls.highlightMetric ??
    useMetricsStore.getState().setHighlightedMetric;

  highlight(metricKey);

  return { success: true, actionType: "HIGHLIGHT_METRIC" };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Dispatch a copilot-suggested action to the appropriate host-page control.
 *
 * Each action type validates its own payload requirements **before** invoking
 * any callback.  Unknown or malformed payloads produce a safe failure result
 * rather than throwing, keeping the UI stable regardless of LLM output quality.
 *
 * @param params - The action, table controls, and metric controls.
 * @returns A {@link DispatchResult} describing success or a typed error.
 */
export function dispatchCopilotAction(
  params: DispatchCopilotActionParams,
): DispatchResult {
  const { action, tableControls, metricControls } = params;

  switch (action.actionType) {
    case "APPLY_FILTER":
      return handleApplyFilter(action.payload, tableControls);

    case "EXPORT_REPORT":
      return handleExportReport();

    case "HIGHLIGHT_METRIC":
      return handleHighlightMetric(action.payload, metricControls);

    default: {
      // Exhaustiveness check — if the closed enum is ever widened the
      // compiler will flag this assignment as an error.
      const _exhaustive: never = action.actionType;
      return {
        success: false,
        actionType: _exhaustive,
        error: `Unknown action type: ${String(action.actionType)}`,
      };
    }
  }
}
