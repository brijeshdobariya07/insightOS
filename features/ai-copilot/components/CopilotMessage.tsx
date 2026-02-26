"use client";

import { memo } from "react";
import type { CopilotMessage as CopilotMessageType } from "../store";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface CopilotMessageProps {
  readonly message: CopilotMessageType;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Renders a single chat bubble.
 *
 * - **User** messages are right-aligned with an indigo tint.
 * - **Assistant** messages are left-aligned with a neutral gray tint.
 */
const CopilotMessage = memo<CopilotMessageProps>(function CopilotMessage({
  message,
}) {
  const isUser = message.role === "user";

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

        {/* Message body — whitespace-pre-wrap preserves newlines from the LLM */}
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
      </div>
    </div>
  );
});

export { CopilotMessage };
export type { CopilotMessageProps };
