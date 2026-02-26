"use client";

import { useCallback, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { buildCopilotContext } from "../context-builder";
import { sendCopilotQuery } from "../services/copilot-api";
import { useCopilotStore } from "../store";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Generate a reasonably unique id without pulling in a library. */
function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Chat input bar for the AI Copilot panel.
 *
 * On submit the component:
 * 1. Pushes a `user` message into the Zustand store.
 * 2. Clears the local input field.
 * 3. Builds dashboard context and calls the copilot API.
 * 4. Pushes the assistant response (or an error message) into the store.
 */
export function CopilotInput() {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const addMessage = useCopilotStore((s) => s.addMessage);
  const isLoading = useCopilotStore((s) => s.isLoading);
  const setLoading = useCopilotStore((s) => s.setLoading);
  const setLastResponse = useCopilotStore((s) => s.setLastResponse);

  /**
   * Send the user query to the copilot backend and push the assistant
   * response into the store.  Loading state is managed here so the UI
   * reflects in-flight status.
   */
  const submitQuery = useCallback(
    async (query: string): Promise<void> => {
      setLoading(true);

      try {
        const context = buildCopilotContext({ currentPage: "dashboard" });
        const response = await sendCopilotQuery(query, { ...context });

        addMessage({ id: uid(), role: "assistant", content: response.summary });
        setLastResponse(response);
      } catch {
        addMessage({
          id: uid(),
          role: "assistant",
          content: "Something went wrong.",
        });
      } finally {
        setLoading(false);
      }
    },
    [addMessage, setLoading, setLastResponse],
  );

  const handleSubmit = useCallback(
    (e?: FormEvent) => {
      e?.preventDefault();

      const trimmed = value.trim();
      if (trimmed.length === 0 || isLoading) return;

      addMessage({ id: uid(), role: "user", content: trimmed });
      setValue("");

      // Re-focus after React re-render
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });

      void submitQuery(trimmed);
    },
    [value, isLoading, addMessage, submitQuery],
  );

  /** Submit on Enter (without Shift). Shift+Enter inserts a newline. */
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit],
  );

  const isEmpty = value.trim().length === 0;

  return (
    <form
      onSubmit={handleSubmit}
      className="shrink-0 border-t border-gray-800 p-3"
    >
      <div className="flex items-end gap-2 rounded-lg border border-gray-800 bg-gray-900 p-1.5 transition-colors focus-within:border-indigo-500/50">
        {/* Multi-line textarea that auto-grows (max 5 rows via CSS) */}
        <textarea
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask the copilot..."
          disabled={isLoading}
          rows={1}
          className="max-h-[7.5rem] min-h-[2.25rem] flex-1 resize-none bg-transparent px-2 py-1.5 text-sm leading-snug text-gray-100 placeholder-gray-500 outline-none disabled:opacity-50"
        />

        {/* Send button */}
        <button
          type="submit"
          disabled={isEmpty || isLoading}
          aria-label="Send message"
          className="flex size-8 shrink-0 items-center justify-center rounded-md bg-indigo-600 text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-4"
          >
            <path d="M5 12h14" />
            <path d="M12 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <p className="mt-1.5 px-1 text-[11px] text-gray-600">
        Press Enter to send &middot; Shift+Enter for a new line
      </p>
    </form>
  );
}
