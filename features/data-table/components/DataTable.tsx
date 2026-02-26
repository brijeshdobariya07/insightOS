"use client";

import { useRef, useCallback } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useTableData } from "../hooks/useTableData";
import { TableHeader } from "./TableHeader";
import { TableRow } from "./TableRow";

const ROW_HEIGHT_ESTIMATE = 48;
const OVERSCAN_COUNT = 5;
const CONTAINER_HEIGHT = 500;
const SKELETON_ROW_COUNT = 12;

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

export function DataTable() {
  const { data, isLoading, isError, error, refetch } = useTableData();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const rows = data?.rows ?? [];

  // eslint-disable-next-line react-hooks/incompatible-library -- useVirtualizer intentionally returns mutable objects
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => ROW_HEIGHT_ESTIMATE,
    overscan: OVERSCAN_COUNT,
  });

  const handleRetry = useCallback(() => {
    void refetch();
  }, [refetch]);

  const errorMessage =
    error instanceof Error ? error.message : "An unexpected error occurred";

  return (
    <div
      className={
        "overflow-hidden rounded-lg border border-gray-800 bg-gray-900/60"
      }
      role="table"
      aria-label="Data table"
    >
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

        {!isLoading && !isError && rows.length === 0 && <EmptyState />}

        {!isLoading && !isError && rows.length > 0 && (
          <div
            style={{ height: virtualizer.getTotalSize() }}
            className="relative w-full"
          >
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const row = rows[virtualRow.index];

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
      {!isLoading && !isError && rows.length > 0 && (
        <div className="border-t border-gray-800 bg-gray-900/80 px-4 py-2.5">
          <p className="text-xs text-gray-500">
            {data?.total.toLocaleString() ?? 0} rows
          </p>
        </div>
      )}
    </div>
  );
}
