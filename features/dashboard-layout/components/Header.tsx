"use client";

interface HeaderProps {
  readonly onToggleCopilot: () => void;
  readonly isCopilotOpen: boolean;
}

export function Header({ onToggleCopilot, isCopilotOpen }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-gray-800 bg-gray-950/80 px-6 backdrop-blur-sm">
      {/* Left — page context area */}
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-semibold text-white">Dashboard</h1>
      </div>

      {/* Right — actions */}
      <div className="flex items-center gap-2">
        {/* Search trigger */}
        <button
          type="button"
          aria-label="Search"
          className="flex size-9 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-800/60 hover:text-gray-200"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-5"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
        </button>

        {/* Notifications */}
        <button
          type="button"
          aria-label="Notifications"
          className="flex size-9 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-800/60 hover:text-gray-200"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-5"
          >
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </button>

        {/* Divider */}
        <div className="mx-1 h-6 w-px bg-gray-800" />

        {/* AI Copilot toggle */}
        <button
          type="button"
          onClick={onToggleCopilot}
          aria-label={isCopilotOpen ? "Close AI Copilot" : "Open AI Copilot"}
          aria-pressed={isCopilotOpen}
          className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            isCopilotOpen
              ? "bg-indigo-600/15 text-indigo-400"
              : "text-gray-400 hover:bg-gray-800/60 hover:text-gray-200"
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-5"
          >
            <path d="M12 2a4 4 0 0 1 4 4v1a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V6a4 4 0 0 1 4-4z" />
            <path d="M9 8v1a3 3 0 0 0 6 0V8" />
            <path d="M12 12v4" />
            <path d="M8 20h8" />
            <path d="M12 16v4" />
          </svg>
          <span className="hidden sm:inline">AI Copilot</span>
        </button>

        {/* Divider */}
        <div className="mx-1 h-6 w-px bg-gray-800" />

        {/* User avatar placeholder */}
        <button
          type="button"
          aria-label="User menu"
          className="flex size-8 items-center justify-center rounded-full bg-gray-800 text-xs font-medium text-gray-300 transition-colors hover:bg-gray-700"
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
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </button>
      </div>
    </header>
  );
}
