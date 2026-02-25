"use client";

interface CopilotPanelPlaceholderProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

export function CopilotPanelPlaceholder({
  isOpen,
  onClose,
}: CopilotPanelPlaceholderProps) {
  return (
    <aside
      aria-label="AI Copilot panel"
      aria-hidden={!isOpen}
      className={`fixed right-0 top-0 z-50 flex h-screen w-80 flex-col border-l border-gray-800 bg-gray-950 transition-transform duration-300 ${
        isOpen ? "translate-x-0" : "translate-x-full"
      }`}
    >
      {/* Panel header */}
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-gray-800 px-4">
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

      {/* Placeholder body */}
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
        <p className="text-sm text-gray-500">
          AI Copilot will appear here.
        </p>
      </div>

      {/* Placeholder input area */}
      <div className="shrink-0 border-t border-gray-800 p-4">
        <div className="flex h-10 items-center rounded-lg border border-gray-800 bg-gray-900 px-3">
          <span className="text-sm text-gray-600">
            Ask the copilot...
          </span>
        </div>
      </div>
    </aside>
  );
}
