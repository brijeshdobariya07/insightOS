"use client";

import { memo } from "react";
import type { MetricItem, MetricTrend } from "../types";

interface TrendConfig {
  readonly color: string;
  readonly bgColor: string;
  readonly symbol: string;
  readonly label: string;
}

const TREND_CONFIG: Record<MetricTrend, TrendConfig> = {
  up: {
    color: "text-emerald-400",
    bgColor: "bg-emerald-400/10",
    symbol: "\u2191",
    label: "Trending up",
  },
  down: {
    color: "text-red-400",
    bgColor: "bg-red-400/10",
    symbol: "\u2193",
    label: "Trending down",
  },
  stable: {
    color: "text-gray-400",
    bgColor: "bg-gray-400/10",
    symbol: "\u2192",
    label: "Stable",
  },
} as const;

function formatValue(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }
  if (Number.isInteger(value)) {
    return value.toLocaleString();
  }
  return value.toFixed(2);
}

function formatChangePercentage(change: number): string {
  const abs = Math.abs(change);
  const sign = change > 0 ? "+" : change < 0 ? "-" : "";
  return `${sign}${abs.toFixed(1)}%`;
}

interface MetricCardProps {
  readonly metric: MetricItem;
}

const MetricCard = memo<MetricCardProps>(function MetricCard({ metric }) {
  const { label, value, changePercentage, trend } = metric;
  const trendConfig = TREND_CONFIG[trend];

  return (
    <div
      className={
        "group rounded-lg border border-gray-800 bg-gray-900/60 p-5 " +
        "transition-all duration-200 " +
        "hover:border-gray-700 hover:bg-gray-900/80 hover:shadow-lg hover:shadow-black/20"
      }
    >
      <p className="text-sm font-medium text-gray-400">{label}</p>

      <p className="mt-2 text-2xl font-semibold tracking-tight text-gray-50">
        {formatValue(value)}
      </p>

      <div className="mt-3 flex items-center gap-2">
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${trendConfig.bgColor} ${trendConfig.color}`}
          aria-label={trendConfig.label}
        >
          <span aria-hidden="true">{trendConfig.symbol}</span>
          {formatChangePercentage(changePercentage)}
        </span>

        <span className="text-xs text-gray-500">vs last period</span>
      </div>
    </div>
  );
});

export { MetricCard };
export type { MetricCardProps };
