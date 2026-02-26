"use client";

import { useCallback, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import type { CopilotResponse } from "@/lib/validators/copilot-schema";
import { buildCopilotContext, type CopilotContextParams } from "../context-builder";
import { useCopilotStore } from "../store";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface CopilotInputProps {
  /** Dashboard context injected by the parent panel. */
  readonly context: CopilotContextParams;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Generate a reasonably unique id without pulling in a library. */
function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ---------------------------------------------------------------------------
// NDJSON streaming infrastructure
// ---------------------------------------------------------------------------

/**
 * Discriminated union for newline-delimited JSON events received from POST /api/ai.
 * Must stay in sync with the route's `StreamEvent` type.
 *
 * - `token` — incremental content delta from the model.
 * - `done`  — final validated (or fallback) CopilotResponse.
 */
type StreamEvent =
  | { readonly type: "token"; readonly content: string }
  | { readonly type: "done"; readonly payload: CopilotResponse };

/**
 * Imperatively update a single message's content in the Zustand store.
 * Uses `setState` directly so no store-level action is needed.
 */
function updateMessageContent(id: string, content: string): void {
  useCopilotStore.setState((state) => ({
    messages: state.messages.map((msg) =>
      msg.id === id ? { ...msg, content } : msg,
    ),
  }));
}

/**
 * Try to parse a single NDJSON line into a typed StreamEvent.
 * Returns `null` for blank lines or malformed payloads.
 */
function tryParseStreamEvent(line: string): StreamEvent | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  try {
    return JSON.parse(trimmed) as StreamEvent;
  } catch {
    return null;
  }
}

/**
 * Read an NDJSON ReadableStream to completion, updating the assistant message
 * as tokens arrive and dispatching the validated response when done.
 *
 * Extracted as a standalone async function to keep the submit handler flat.
 */
async function consumeStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  messageId: string,
  onValidatedResponse: (response: CopilotResponse) => void,
): Promise<void> {
  const decoder = new TextDecoder();
  let buffer = "";
  let accumulated = "";

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // NDJSON: each event is a single JSON object terminated by `\n`
    const lines = buffer.split("\n");
    // The last segment is either incomplete or empty — retain as buffer
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const event = tryParseStreamEvent(line);
      if (!event) continue;

      switch (event.type) {
        case "token":
          accumulated += event.content;
          updateMessageContent(messageId, accumulated);
          break;

        case "done":
          // Replace raw streamed text with the clean summary;
          // the full structured response is dispatched for rendering.
          updateMessageContent(messageId, event.payload.summary);
          onValidatedResponse(event.payload);
          break;
      }
    }
  }
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
export function CopilotInput({ context }: CopilotInputProps) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const addMessage = useCopilotStore((s) => s.addMessage);
  const isLoading = useCopilotStore((s) => s.isLoading);
  const setLoading = useCopilotStore((s) => s.setLoading);
  const setLastResponse = useCopilotStore((s) => s.setLastResponse);

  /**
   * Stream the copilot response from the backend, updating the assistant
   * message progressively as tokens arrive.  Once the stream completes the
   * validated (or fallback) CopilotResponse is dispatched to the store for
   * structured rendering.
   */
  const submitQuery = useCallback(
    async (query: string): Promise<void> => {
      setLoading(true);

      // 1. Add a placeholder assistant message that will be updated in-place.
      const messageId = uid();
      addMessage({ id: messageId, role: "assistant", content: "" });

      try {
        // 2. Build context and fetch the streaming endpoint.
        const builtContext = buildCopilotContext(context);
        const response = await fetch("/api/ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query, context: { ...builtContext } }),
        });

        if (!response.ok || !response.body) {
          updateMessageContent(messageId, "Something went wrong.");
          return;
        }

        // 3. Consume the NDJSON stream, updating the message as tokens arrive.
        const reader = response.body.getReader();
        await consumeStream(reader, messageId, setLastResponse);
      } catch {
        updateMessageContent(messageId, "Something went wrong.");
      } finally {
        setLoading(false);
      }
    },
    [addMessage, setLoading, setLastResponse, context],
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
