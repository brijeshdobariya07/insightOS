import "./globals.css";
import {QueryProvider} from "@/lib/providers/QueryProvider";
import type {ReactNode} from "react";

export const metadata = {
  title: "insightOS",
  description: "AI Copilot for SaaS Dashboard"
};

export default function RootLayout({children}: {children: ReactNode})
{
  return (
    <html lang="en">
      <body className="bg-gray-950 text-gray-100 min-h-screen">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
