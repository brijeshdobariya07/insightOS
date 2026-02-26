"use client";

import { memo } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { CSSProperties } from "react";

interface MetricsChartDataPoint {
  readonly name: string;
  readonly revenue: number;
  readonly users: number;
}

interface MetricsChartProps {
  readonly data: readonly MetricsChartDataPoint[];
}

const CHART_COLORS = {
  revenue: "#6366f1",
  users: "#22d3ee",
  grid: "#1f2937",
  axis: "#6b7280",
  tooltipBg: "#111827",
  tooltipBorder: "#374151",
  tooltipText: "#f3f4f6",
} as const;

const CHART_MARGIN = { top: 8, right: 16, left: 0, bottom: 0 } as const;

const tooltipWrapperStyle: CSSProperties = {
  outline: "none",
};

const tooltipContentStyle: CSSProperties = {
  backgroundColor: CHART_COLORS.tooltipBg,
  border: `1px solid ${CHART_COLORS.tooltipBorder}`,
  borderRadius: "0.5rem",
  padding: "0.5rem 0.75rem",
  fontSize: "0.8125rem",
  color: CHART_COLORS.tooltipText,
  boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.3)",
};

const tooltipLabelStyle: CSSProperties = {
  color: CHART_COLORS.axis,
  fontWeight: 500,
  marginBottom: "0.25rem",
};

const MetricsChart = memo<MetricsChartProps>(function MetricsChart({ data }) {
  if (data.length === 0) {
    return (
      <div
        className={
          "flex items-center justify-center rounded-lg " +
          "border border-gray-800 bg-gray-900/60 px-6 py-16"
        }
      >
        <p className="text-sm text-gray-500">No chart data available.</p>
      </div>
    );
  }

  return (
    <div
      className={
        "rounded-lg border border-gray-800 bg-gray-900/60 p-5 " +
        "transition-all duration-200 " +
        "hover:border-gray-700 hover:bg-gray-900/80"
      }
    >
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={data as MetricsChartDataPoint[]} margin={CHART_MARGIN}>
          <CartesianGrid
            stroke={CHART_COLORS.grid}
            strokeDasharray="3 6"
            vertical={false}
          />
          <XAxis
            dataKey="name"
            tick={{ fill: CHART_COLORS.axis, fontSize: 12 }}
            axisLine={{ stroke: CHART_COLORS.grid }}
            tickLine={false}
            dy={8}
          />
          <YAxis
            tick={{ fill: CHART_COLORS.axis, fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={48}
          />
          <Tooltip
            wrapperStyle={tooltipWrapperStyle}
            contentStyle={tooltipContentStyle}
            labelStyle={tooltipLabelStyle}
            cursor={{ stroke: CHART_COLORS.axis, strokeWidth: 1, strokeDasharray: "4 4" }}
          />
          <Line
            type="monotone"
            dataKey="revenue"
            name="Revenue"
            stroke={CHART_COLORS.revenue}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: CHART_COLORS.revenue, strokeWidth: 0 }}
          />
          <Line
            type="monotone"
            dataKey="users"
            name="Users"
            stroke={CHART_COLORS.users}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: CHART_COLORS.users, strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
});

export { MetricsChart };
export type { MetricsChartProps, MetricsChartDataPoint };
