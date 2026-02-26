import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useShallow } from "zustand/react/shallow";
import { fetchTableData } from "../services";
import { useDataTableStore } from "../store";
import type { SortDirection } from "../store";
import type { TableResponse, TableRowItem, TableStatus } from "../types";

// ---------------------------------------------------------------------------
// Pure helpers (unchanged — no state dependency)
// ---------------------------------------------------------------------------

/**
 * Compares two TableRowItem values for a given key.
 * Handles string, number, and fallback comparison.
 */
function compareRows(
  a: TableRowItem,
  b: TableRowItem,
  key: keyof TableRowItem,
  direction: SortDirection,
): number {
  const aValue = a[key];
  const bValue = b[key];

  let result: number;

  if (typeof aValue === "string" && typeof bValue === "string") {
    result = aValue.localeCompare(bValue);
  } else if (typeof aValue === "number" && typeof bValue === "number") {
    result = aValue - bValue;
  } else {
    result = String(aValue).localeCompare(String(bValue));
  }

  return direction === "asc" ? result : -result;
}

/**
 * Returns true if the row's user or email contains the search term
 * (case-insensitive).
 */
function matchesSearch(row: TableRowItem, term: string): boolean {
  const lowerTerm = term.toLowerCase();
  return (
    row.user.toLowerCase().includes(lowerTerm) ||
    row.email.toLowerCase().includes(lowerTerm)
  );
}

/**
 * Returns true if the row matches the given status filter.
 * "all" matches every row.
 */
function matchesStatus(
  row: TableRowItem,
  filter: TableStatus | "all",
): boolean {
  return filter === "all" || row.status === filter;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useTableData() {
  // ── TanStack Query (unchanged queryKey — no refetch on local state changes) ──
  const { data, isLoading, isError, error, refetch } =
    useQuery<TableResponse>({
      queryKey: ["table-data"],
      queryFn: fetchTableData,
    });

  // ── Store state (shallow selector prevents re-renders on unrelated changes) ──
  const { statusFilter, searchTerm, sortKey, sortDirection } =
    useDataTableStore(
      useShallow((state) => ({
        statusFilter: state.statusFilter,
        searchTerm: state.searchTerm,
        sortKey: state.sortKey,
        sortDirection: state.sortDirection,
      })),
    );

  // ── Store actions (stable references — never cause re-renders) ──
  const setStatusFilter = useDataTableStore((state) => state.setStatusFilter);
  const setSearchTerm = useDataTableStore((state) => state.setSearchTerm);
  const toggleSort = useDataTableStore((state) => state.toggleSort);

  // ── Derived rows: search → status filter → sort (never mutates original) ──
  const filteredRows = useMemo<TableRowItem[]>(() => {
    const rows = data?.rows;
    if (!rows) {
      return [];
    }

    const trimmedSearch = searchTerm.trim();

    // Step 1 + 2: Apply search and status filters in a single pass
    const filtered = rows.filter((row) => {
      const passesSearch =
        trimmedSearch.length === 0 || matchesSearch(row, trimmedSearch);
      const passesStatus = matchesStatus(row, statusFilter);
      return passesSearch && passesStatus;
    });

    // Step 3: Sort (creates a shallow copy — original array is untouched)
    if (sortKey !== null) {
      return [...filtered].sort((a, b) =>
        compareRows(a, b, sortKey, sortDirection),
      );
    }

    return filtered;
  }, [data?.rows, searchTerm, statusFilter, sortKey, sortDirection]);

  return {
    // Original query data (backward-compatible)
    data,
    isLoading,
    isError,
    error,
    refetch,

    // Derived rows
    filteredRows,

    // Sorting
    sortKey,
    sortDirection,
    toggleSort,

    // Filtering
    statusFilter,
    setStatusFilter,

    // Search
    searchTerm,
    setSearchTerm,
  } as const;
}
