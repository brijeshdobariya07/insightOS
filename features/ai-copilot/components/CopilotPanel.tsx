"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { useMetricsData } from "@/features/metrics";
import { useTableData } from "@/features/data-table";
import { useCopilotStore } from "../store";
import type { CopilotContextParams } from "../context-builder";
import { CopilotMessage } from "./CopilotMessage";
import { CopilotInput } from "./CopilotInput";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface CopilotPanelProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

// ---------------------------------------------------------------------------
// Loading indicator (three pulsing dots)
// ---------------------------------------------------------------------------

function LoadingIndicator() {
  return (
    <div className="flex justify-start" role="status" aria-label="Loading">
      <div className="flex items-center gap-1.5 rounded-xl rounded-bl-sm border border-gray-800 bg-gray-800/50 px-4 py-3">
        <span className="size-1.5 animate-pulse rounded-full bg-gray-400" />
        <span className="size-1.5 animate-pulse rounded-full bg-gray-400 [animation-delay:150ms]" />
        <span className="size-1.5 animate-pulse rounded-full bg-gray-400 [animation-delay:300ms]" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty state (shown when the conversation has no messages yet)
// ---------------------------------------------------------------------------

function EmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-gray-800/60">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-6 text-gray-500"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </div>

      <div className="space-y-1">
        <p className="text-sm font-medium text-gray-300">
          Ask anything about your data
        </p>
        <p className="text-xs text-gray-500">
          The copilot can surface insights, suggest filters, and export reports.
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// CopilotPanel
// ---------------------------------------------------------------------------

/**
 * Slide-out panel that contains the AI Copilot conversation.
 *
 * Structure (top → bottom):
 * 1. Header with title + clear / close buttons
 * 2. Scrollable message list (auto-scrolls on new messages)
 * 3. Input bar pinned at the bottom
 */
export function CopilotPanel({ isOpen, onClose }: CopilotPanelProps) {
  const messages = useCopilotStore((s) => s.messages);
  const isLoading = useCopilotStore((s) => s.isLoading);
  const clearSession = useCopilotStore((s) => s.clearSession);
  const lastResponse = useCopilotStore((s) => s.lastResponse);

  // ---- Dashboard context for the AI Copilot --------------------------------
  const { data: metricsData } = useMetricsData();
  const { filteredRows } = useTableData();

  const dashboardContext = useMemo<CopilotContextParams>(() => {
    const metrics = metricsData?.metrics;

    const metricsSummary: Record<string, unknown> | undefined = metrics
      ? Object.fromEntries(
          metrics.map((m) => [m.label, m.value] as const),
        )
      : undefined;

    const TABLE_SNAPSHOT_LIMIT = 10;

    const tableSnapshot: Record<string, unknown>[] | undefined =
      filteredRows.length > 0
        ? filteredRows
            .slice(0, TABLE_SNAPSHOT_LIMIT)
            .map<Record<string, unknown>>((row) => ({ ...row }))
        : undefined;

    return {
      currentPage: "dashboard",
      metricsSummary,
      tableSnapshot,
    };
  }, [metricsData?.metrics, filteredRows]);

  // ---- Auto-scroll to bottom on new messages / loading / response change ---
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollAreaRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages.length, isLoading, lastResponse]);

  // ---- Handlers -----------------------------------------------------------
  const handleClearSession = useCallback(() => {
    clearSession();
  }, [clearSession]);

  // ---- Derived state ------------------------------------------------------
  const hasMessages = messages.length > 0;

  // Find the index of the last assistant message so we can attach the
  // structured response to it (the store only tracks the most recent one).
  const lastAssistantIndex = (() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i]?.role === "assistant") return i;
    }
    return -1;
  })();

  return (
    <aside
      aria-label="AI Copilot panel"
      aria-hidden={!isOpen}
      className={`fixed right-0 top-0 z-50 flex h-screen w-80 flex-col border-l border-gray-800 bg-gray-950 transition-transform duration-300 ${
        isOpen ? "translate-x-0" : "translate-x-full"
      }`}
    >
      {/* ------------------------------------------------------------------ */}
      {/* Header                                                              */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-gray-800 px-4">
        {/* Title */}
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-indigo-600/15">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-4 text-indigo-400"
            >
              <path d="M12 2a4 4 0 0 1 4 4v1a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V6a4 4 0 0 1 4-4z" />
              <path d="M9 8v1a3 3 0 0 0 6 0V8" />
              <path d="M12 12v4" />
              <path d="M8 20h8" />
              <path d="M12 16v4" />
            </svg>
          </span>
          <span className="text-sm font-semibold text-white">AI Copilot</span>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1">
          {/* Clear session */}
          {hasMessages && (
            <button
              type="button"
              onClick={handleClearSession}
              aria-label="Clear conversation"
              title="Clear conversation"
              className="flex size-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-800/60 hover:text-gray-200"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-4"
              >
                <path d="M3 6h18" />
                <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                <path d="M10 11v6" />
                <path d="M14 11v6" />
              </svg>
            </button>
          )}

          {/* Close panel */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close AI Copilot panel"
            className="flex size-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-800/60 hover:text-gray-200"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-4"
            >
              <path d="M18 6L6 18" />
              <path d="M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Message area                                                        */}
      {/* ------------------------------------------------------------------ */}
      {hasMessages ? (
        <div
          ref={scrollAreaRef}
          className="flex-1 space-y-3 overflow-y-auto overscroll-contain px-3 py-4"
          role="list"
          aria-label="Copilot conversation"
        >
          {messages.map((msg, index) => (
            <CopilotMessage
              key={msg.id}
              message={msg}
              structuredResponse={
                index === lastAssistantIndex ? lastResponse : null
              }
            />
          ))}

          {isLoading && <LoadingIndicator />}
        </div>
      ) : (
        <EmptyState />
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Input                                                               */}
      {/* ------------------------------------------------------------------ */}
      <CopilotInput context={dashboardContext} />
    </aside>
  );
}

export type { CopilotPanelProps };
