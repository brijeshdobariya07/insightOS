// ---------------------------------------------------------------------------
// Context Builder — constructs the structured context payload sent with every
// AI Copilot request.  Follows ai-behavior-contract.md Section 3:
//   • Only pass necessary data
//   • Truncate large datasets
//   • Remove sensitive information
// ---------------------------------------------------------------------------

/**
 * Maximum number of table rows included in the context payload.
 * Keeps token usage predictable and prevents oversized requests.
 */
const MAX_TABLE_ROWS = 20;

/**
 * Field names that must never be sent to the AI backend.
 * Case-sensitive — matched against top-level keys of each table row.
 */
const SENSITIVE_FIELDS: ReadonlySet<string> = new Set([
  "email",
  "password",
  "token",
  "secret",
  "apiKey",
  "ssn",
  "creditCard",
]);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Input accepted by {@link buildCopilotContext}. */
export interface CopilotContextParams {
  /** Current page / route the user is viewing (e.g. "dashboard", "logs"). */
  currentPage: string;
  /** Aggregated metrics visible on the page (optional). */
  metricsSummary?: Record<string, unknown>;
  /** Snapshot of the visible data-table rows (optional, will be truncated). */
  tableSnapshot?: Record<string, unknown>[];
}

/** Structured context object sent alongside every copilot query. */
export interface CopilotContext {
  currentPage: string;
  visibleMetrics: Record<string, unknown> | null;
  tableSnapshot: Record<string, unknown>[] | null;
  tableSnapshotTruncated: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Strip sensitive fields from a single record.
 * Returns a shallow copy with the offending keys removed.
 */
function stripSensitiveFields(
  row: Record<string, unknown>,
): Record<string, unknown> {
  const cleaned: Record<string, unknown> = {};

  for (const key of Object.keys(row)) {
    if (!SENSITIVE_FIELDS.has(key)) {
      cleaned[key] = row[key];
    }
  }

  return cleaned;
}

/**
 * Sanitise and truncate a table snapshot.
 *
 * 1. Removes sensitive fields from every row.
 * 2. Caps the array at {@link MAX_TABLE_ROWS}.
 */
function sanitizeTableSnapshot(
  rows: Record<string, unknown>[],
): { rows: Record<string, unknown>[]; truncated: boolean } {
  const truncated = rows.length > MAX_TABLE_ROWS;
  const sliced = truncated ? rows.slice(0, MAX_TABLE_ROWS) : rows;
  const sanitized = sliced.map(stripSensitiveFields);

  return { rows: sanitized, truncated };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Build the structured context object that accompanies every AI Copilot
 * request.  The returned shape aligns with ai-behavior-contract.md Section 3
 * and is compatible with {@link sendCopilotQuery}'s `context` parameter
 * (`Record<string, unknown>`).
 *
 * @param params - Current page state to serialise into context.
 * @returns A clean, truncated, sensitivity-stripped context record.
 */
export function buildCopilotContext(
  params: CopilotContextParams,
): CopilotContext {
  const { currentPage, metricsSummary, tableSnapshot } = params;

  const table =
    tableSnapshot && tableSnapshot.length > 0
      ? sanitizeTableSnapshot(tableSnapshot)
      : null;

  return {
    currentPage,
    visibleMetrics: metricsSummary ?? null,
    tableSnapshot: table?.rows ?? null,
    tableSnapshotTruncated: table?.truncated ?? false,
  };
}
