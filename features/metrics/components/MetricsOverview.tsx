"use client";

import { useMetricsData } from "../hooks/useMetricsData";
import { MetricCard } from "./MetricCard";

const SKELETON_COUNT = 4;
const SKELETON_INDICES = Array.from({ length: SKELETON_COUNT }, (_, i) => i);

function MetricCardSkeleton() {
  return (
    <div
      className={
        "animate-pulse rounded-lg border border-gray-800 bg-gray-900/60 p-5"
      }
    >
      <div className="h-4 w-24 rounded bg-gray-800" />
      <div className="mt-3 h-7 w-32 rounded bg-gray-800" />
      <div className="mt-4 flex items-center gap-2">
        <div className="h-5 w-16 rounded-full bg-gray-800" />
        <div className="h-3 w-20 rounded bg-gray-800/60" />
      </div>
    </div>
  );
}

function MetricsLoadingSkeleton() {
  return (
    <section
      aria-label="Loading metrics"
      className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4"
    >
      {SKELETON_INDICES.map((index) => (
        <MetricCardSkeleton key={index} />
      ))}
    </section>
  );
}

interface MetricsErrorProps {
  readonly message: string;
  readonly onRetry: () => void;
}

function MetricsError({ message, onRetry }: MetricsErrorProps) {
  return (
    <section
      role="alert"
      className={
        "flex flex-col items-center justify-center gap-4 rounded-lg " +
        "border border-red-900/50 bg-red-950/20 px-6 py-10 text-center"
      }
    >
      <span
        aria-hidden="true"
        className="text-3xl text-red-400"
      >
        {"\u26A0"}
      </span>

      <p className="text-sm text-gray-300">
        {message}
      </p>

      <button
        type="button"
        onClick={onRetry}
        className={
          "rounded-md border border-red-800 bg-red-950/40 px-4 py-2 " +
          "text-sm font-medium text-red-300 " +
          "transition-colors duration-150 " +
          "hover:border-red-700 hover:bg-red-900/40 hover:text-red-200 " +
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
        }
      >
        Try again
      </button>
    </section>
  );
}

function MetricsGrid({ children }: { readonly children: React.ReactNode }) {
  return (
    <section
      aria-label="Key metrics"
      className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4"
    >
      {children}
    </section>
  );
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "Unable to load metrics. Please try again.";
}

export function MetricsOverview() {
  const { data, isLoading, isError, error, refetch } = useMetricsData();

  if (isLoading) {
    return <MetricsLoadingSkeleton />;
  }

  if (isError) {
    return (
      <MetricsError
        message={getErrorMessage(error)}
        onRetry={() => void refetch()}
      />
    );
  }

  const metrics = data?.metrics;

  if (!metrics || metrics.length === 0) {
    return (
      <section
        aria-label="No metrics available"
        className={
          "flex items-center justify-center rounded-lg " +
          "border border-gray-800 bg-gray-900/40 px-6 py-10"
        }
      >
        <p className="text-sm text-gray-500">No metrics available.</p>
      </section>
    );
  }

  return (
    <MetricsGrid>
      {metrics.map((metric) => (
        <MetricCard key={metric.id} metric={metric} />
      ))}
    </MetricsGrid>
  );
}
