import { memo } from "react";
import type { TableRowItem, TableStatus } from "../types";

interface StatusBadgeConfig {
  readonly text: string;
  readonly className: string;
}

const STATUS_BADGE_MAP: Record<TableStatus, StatusBadgeConfig> = {
  active: {
    text: "Active",
    className:
      "bg-emerald-400/10 text-emerald-400 ring-emerald-400/30",
  },
  pending: {
    text: "Pending",
    className:
      "bg-yellow-400/10 text-yellow-400 ring-yellow-400/30",
  },
  error: {
    text: "Error",
    className:
      "bg-red-400/10 text-red-400 ring-red-400/30",
  },
} as const;

function formatRevenue(revenue: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(revenue);
}

function formatDate(isoDate: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(isoDate));
}

interface TableRowProps {
  readonly item: TableRowItem;
}

const TableRow = memo<TableRowProps>(function TableRow({ item }) {
  const badge = STATUS_BADGE_MAP[item.status];

  return (
    <div
      className={
        "flex items-center border-b border-gray-800/50 px-4 py-3 " +
        "text-sm text-gray-300 transition-colors duration-150 " +
        "hover:bg-gray-800/40"
      }
      role="row"
    >
      {/* User */}
      <div className="w-[20%] shrink-0 truncate px-2 font-medium text-gray-100">
        {item.user}
      </div>

      {/* Email */}
      <div className="w-[25%] shrink-0 truncate px-2 text-gray-400">
        {item.email}
      </div>

      {/* Revenue */}
      <div className="w-[15%] shrink-0 px-2 font-mono text-gray-200">
        {formatRevenue(item.revenue)}
      </div>

      {/* Status */}
      <div className="w-[15%] shrink-0 px-2">
        <span
          className={
            "inline-flex items-center rounded-full px-2.5 py-0.5 " +
            "text-xs font-medium ring-1 ring-inset " +
            badge.className
          }
        >
          {badge.text}
        </span>
      </div>

      {/* Created At */}
      <div className="w-[25%] shrink-0 px-2 text-gray-400">
        {formatDate(item.createdAt)}
      </div>
    </div>
  );
});

export { TableRow };
export type { TableRowProps };
