"use client";

import { useRef, useCallback } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useTableData } from "../hooks/useTableData";
import { TableHeader } from "./TableHeader";
import { TableRow } from "./TableRow";
import type { TableStatus } from "../types";

const ROW_HEIGHT_ESTIMATE = 48;
const OVERSCAN_COUNT = 5;
const CONTAINER_HEIGHT = 500;
const SKELETON_ROW_COUNT = 12;

const STATUS_OPTIONS: readonly { value: TableStatus | "all"; label: string }[] = [
  { value: "all", label: "All Statuses" },
  { value: "active", label: "Active" },
  { value: "pending", label: "Pending" },
  { value: "error", label: "Error" },
] as const;

function SkeletonRow() {
  return (
    <div className="flex items-center border-b border-gray-800/50 px-4 py-3">
      <div className="w-[20%] shrink-0 px-2">
        <div className="h-4 w-28 animate-pulse rounded bg-gray-800" />
      </div>
      <div className="w-[25%] shrink-0 px-2">
        <div className="h-4 w-40 animate-pulse rounded bg-gray-800" />
      </div>
      <div className="w-[15%] shrink-0 px-2">
        <div className="h-4 w-20 animate-pulse rounded bg-gray-800" />
      </div>
      <div className="w-[15%] shrink-0 px-2">
        <div className="h-5 w-16 animate-pulse rounded-full bg-gray-800" />
      </div>
      <div className="w-[25%] shrink-0 px-2">
        <div className="h-4 w-24 animate-pulse rounded bg-gray-800" />
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div role="status" aria-label="Loading table data">
      {Array.from({ length: SKELETON_ROW_COUNT }, (_, index) => (
        <SkeletonRow key={index} />
      ))}
    </div>
  );
}

interface ErrorStateProps {
  readonly message: string;
  readonly onRetry: () => void;
}

function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div
      className={
        "flex flex-col items-center justify-center gap-4 py-20 text-center"
      }
      role="alert"
    >
      <div className="rounded-full bg-red-400/10 p-3">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 text-red-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v2m0 4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
          />
        </svg>
      </div>
      <div>
        <p className="text-sm font-medium text-gray-200">
          Failed to load table data
        </p>
        <p className="mt-1 text-xs text-gray-500">{message}</p>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className={
          "rounded-md bg-gray-800 px-4 py-2 text-sm font-medium text-gray-200 " +
          "transition-colors duration-150 hover:bg-gray-700 " +
          "focus:outline-none focus:ring-2 focus:ring-gray-600 focus:ring-offset-2 " +
          "focus:ring-offset-gray-950"
        }
      >
        Retry
      </button>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <p className="text-sm text-gray-500">No data available</p>
    </div>
  );
}

function NoResultsState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <p className="text-sm text-gray-400">No rows match your filters</p>
      <p className="mt-1 text-xs text-gray-500">
        Try adjusting your search or status filter
      </p>
    </div>
  );
}

export function DataTable() {
  const {
    data,
    filteredRows,
    isLoading,
    isError,
    error,
    refetch,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
  } = useTableData();

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // eslint-disable-next-line react-hooks/incompatible-library -- useVirtualizer intentionally returns mutable objects
  const virtualizer = useVirtualizer({
    count: filteredRows.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => ROW_HEIGHT_ESTIMATE,
    overscan: OVERSCAN_COUNT,
  });

  const handleRetry = useCallback(() => {
    void refetch();
  }, [refetch]);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchTerm(e.target.value);
    },
    [setSearchTerm],
  );

  const handleStatusChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setStatusFilter(e.target.value as TableStatus | "all");
    },
    [setStatusFilter],
  );

  const errorMessage =
    error instanceof Error ? error.message : "An unexpected error occurred";

  const hasData = !isLoading && !isError && data !== undefined;
  const hasFilteredRows = hasData && filteredRows.length > 0;
  const hasNoResults = hasData && filteredRows.length === 0;
  const isFiltered = searchTerm.trim().length > 0 || statusFilter !== "all";
  const hasOriginalData = (data?.rows.length ?? 0) > 0;

  return (
    <div
      className={
        "overflow-hidden rounded-lg border border-gray-800 bg-gray-900/60"
      }
      role="table"
      aria-label="Data table"
    >
      {/* ── Toolbar: Search + Status Filter ── */}
      <div
        className={
          "flex flex-col gap-3 border-b border-gray-800 bg-gray-900/80 " +
          "px-4 py-3 sm:flex-row sm:items-center sm:gap-4"
        }
      >
        {/* Search input */}
        <div className="relative flex-1">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={
              "pointer-events-none absolute left-3 top-1/2 h-4 w-4 " +
              "-translate-y-1/2 text-gray-500"
            }
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
            />
          </svg>
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Search by name or email…"
            aria-label="Search table rows"
            className={
              "w-full rounded-md border border-gray-700 bg-gray-800/60 " +
              "py-2 pl-9 pr-3 text-sm text-gray-200 placeholder-gray-500 " +
              "transition-colors duration-150 " +
              "focus:border-gray-600 focus:outline-none focus:ring-1 focus:ring-gray-600"
            }
          />
        </div>

        {/* Status filter dropdown */}
        <select
          value={statusFilter}
          onChange={handleStatusChange}
          aria-label="Filter by status"
          className={
            "rounded-md border border-gray-700 bg-gray-800/60 " +
            "px-3 py-2 text-sm text-gray-200 " +
            "transition-colors duration-150 " +
            "focus:border-gray-600 focus:outline-none focus:ring-1 focus:ring-gray-600"
          }
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <TableHeader />

      <div
        ref={scrollContainerRef}
        className="overflow-auto"
        style={{ height: CONTAINER_HEIGHT }}
      >
        {isLoading && <LoadingSkeleton />}

        {isError && !isLoading && (
          <ErrorState message={errorMessage} onRetry={handleRetry} />
        )}

        {/* No original data at all */}
        {hasNoResults && !isFiltered && <EmptyState />}

        {/* Has original data but filters produced zero results */}
        {hasNoResults && isFiltered && hasOriginalData && <NoResultsState />}

        {hasFilteredRows && (
          <div
            style={{ height: virtualizer.getTotalSize() }}
            className="relative w-full"
          >
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const row = filteredRows[virtualRow.index];

              if (!row) {
                return null;
              }

              return (
                <div
                  key={virtualRow.key}
                  className="absolute left-0 top-0 w-full"
                  style={{
                    height: virtualRow.size,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <TableRow item={row} />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer with row count */}
      {hasData && (
        <div className="border-t border-gray-800 bg-gray-900/80 px-4 py-2.5">
          <p className="text-xs text-gray-500">
            {isFiltered
              ? `${filteredRows.length.toLocaleString()} of ${(data?.total ?? 0).toLocaleString()} rows`
              : `${(data?.total ?? 0).toLocaleString()} rows`}
          </p>
        </div>
      )}
    </div>
  );
}
