"use client";

import {CopilotPanel} from "@/features/ai-copilot/components/CopilotPanel";
import {type ReactNode, useCallback, useState} from "react";
import {Header} from "./Header";
import {Sidebar} from "./Sidebar";

interface DashboardLayoutProps
{
  readonly children: ReactNode;
}

export function DashboardLayout({children}: DashboardLayoutProps)
{
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);

  const handleToggleSidebar = useCallback(() =>
  {
    setIsSidebarCollapsed((prev) => !prev);
  }, []);

  const handleToggleCopilot = useCallback(() =>
  {
    setIsCopilotOpen((prev) => !prev);
  }, []);

  const handleCloseCopilot = useCallback(() =>
  {
    setIsCopilotOpen(false);
  }, []);

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Sidebar */}
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleSidebar}
      />

      {/* Main area — shifts based on sidebar width */}
      <div
        className={`flex min-h-screen flex-col transition-all duration-300 ${
          isSidebarCollapsed ? "ml-16" : "ml-60"
        } ${isCopilotOpen ? "mr-80" : ""}`}
      >
        {/* Header */}
        <Header
          onToggleCopilot={handleToggleCopilot}
          isCopilotOpen={isCopilotOpen}
        />

        {/* Main content */}
        <main className="flex-1 p-6">{children}</main>
      </div>

      {/* AI Copilot panel */}
      <CopilotPanel
        isOpen={isCopilotOpen}
        onClose={handleCloseCopilot}
      />
    </div>
  );
}
