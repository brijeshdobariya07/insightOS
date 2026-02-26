"use client";

import { memo, useCallback } from "react";
import type { TableRowItem } from "../types";

type SortDirection = "asc" | "desc";

/** Column keys that support sorting. */
type SortableKey = "user" | "revenue" | "createdAt";

const SORTABLE_KEYS: ReadonlySet<string> = new Set<SortableKey>([
  "user",
  "revenue",
  "createdAt",
]);

interface ColumnDef {
  readonly key: keyof TableRowItem;
  readonly label: string;
  readonly width: string;
}

const COLUMNS: readonly ColumnDef[] = [
  { key: "user", label: "User", width: "w-[20%]" },
  { key: "email", label: "Email", width: "w-[25%]" },
  { key: "revenue", label: "Revenue", width: "w-[15%]" },
  { key: "status", label: "Status", width: "w-[15%]" },
  { key: "createdAt", label: "Created At", width: "w-[25%]" },
] as const;

// ── Sort indicator ──

function SortIndicator({
  direction,
}: {
  readonly direction: SortDirection;
}) {
  return (
    <span className="ml-1 text-gray-300" aria-hidden="true">
      {direction === "asc" ? "▲" : "▼"}
    </span>
  );
}

// ── Props ──

interface TableHeaderProps {
  /** Currently sorted column key — `null` when unsorted. */
  readonly sortKey?: keyof TableRowItem | null;
  /** Current sort direction. */
  readonly sortDirection?: SortDirection;
  /** Callback from useTableData to toggle sorting on a column. */
  readonly onToggleSort?: (key: keyof TableRowItem) => void;
}

// ── Component ──

const TableHeader = memo<TableHeaderProps>(function TableHeader({
  sortKey = null,
  sortDirection = "asc",
  onToggleSort,
}) {
  const handleClick = useCallback(
    (key: keyof TableRowItem) => {
      if (onToggleSort && SORTABLE_KEYS.has(key)) {
        onToggleSort(key);
      }
    },
    [onToggleSort],
  );

  return (
    <div
      className={
        "sticky top-0 z-10 flex items-center border-b border-gray-800 " +
        "bg-gray-900/95 px-4 py-3 text-xs font-semibold uppercase " +
        "tracking-wider text-gray-400 backdrop-blur-sm"
      }
      role="row"
    >
      {COLUMNS.map((column) => {
        const isSortable = SORTABLE_KEYS.has(column.key);
        const isActive = sortKey === column.key;

        if (isSortable) {
          return (
            <button
              key={column.key}
              type="button"
              onClick={() => handleClick(column.key)}
              className={
                `${column.width} shrink-0 px-2 text-left ` +
                "inline-flex items-center gap-0.5 " +
                "transition-colors duration-150 " +
                "hover:text-gray-200 focus:outline-none focus:text-gray-200 " +
                (isActive ? "text-gray-200" : "")
              }
              role="columnheader"
              aria-sort={
                isActive
                  ? sortDirection === "asc"
                    ? "ascending"
                    : "descending"
                  : "none"
              }
            >
              {column.label}
              {isActive && <SortIndicator direction={sortDirection} />}
            </button>
          );
        }

        return (
          <div
            key={column.key}
            className={`${column.width} shrink-0 px-2`}
            role="columnheader"
          >
            {column.label}
          </div>
        );
      })}
    </div>
  );
});

export { TableHeader, COLUMNS };
export type { TableHeaderProps, SortableKey };
