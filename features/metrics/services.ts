import type {
  MetricItem,
  MetricTrend,
  MetricsResponse,
  TimeSeriesDataPoint,
} from "./types";

interface MetricDefinition {
  id: string;
  label: string;
  baseValue: number;
  variance: number;
  precision: number;
}

const METRIC_DEFINITIONS: MetricDefinition[] = [
  { id: "revenue", label: "Total Revenue", baseValue: 48500, variance: 12000, precision: 2 },
  { id: "users", label: "Active Users", baseValue: 2340, variance: 800, precision: 0 },
  { id: "conversion", label: "Conversion Rate", baseValue: 3.2, variance: 1.5, precision: 2 },
  { id: "error-rate", label: "Error Rate", baseValue: 0.8, variance: 0.6, precision: 2 },
];

function randomInRange(base: number, variance: number): number {
  return base + (Math.random() * 2 - 1) * variance;
}

function roundTo(value: number, precision: number): number {
  const factor = Math.pow(10, precision);
  return Math.round(value * factor) / factor;
}

function deriveTrend(changePercentage: number): MetricTrend {
  if (changePercentage > 0.5) return "up";
  if (changePercentage < -0.5) return "down";
  return "stable";
}

function generateMetricItem(definition: MetricDefinition): MetricItem {
  const value = roundTo(
    Math.max(0, randomInRange(definition.baseValue, definition.variance)),
    definition.precision,
  );
  const changePercentage = roundTo(randomInRange(0, 15), 1);
  const trend = deriveTrend(changePercentage);

  return {
    id: definition.id,
    label: definition.label,
    value,
    changePercentage,
    trend,
  };
}

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

const TIMESERIES_CONFIG = {
  revenueBase: 42000,
  revenueVariance: 8000,
  usersBase: 1800,
  usersVariance: 400,
  weekendRevenueDip: 0.72,
  weekendUsersDip: 0.65,
  midweekRevenuePeak: 1.15,
  midweekUsersPeak: 1.1,
} as const;

function getDayMultiplier(
  dayIndex: number,
  peakFactor: number,
  dipFactor: number,
): number {
  if (dayIndex === 5 || dayIndex === 6) return dipFactor;
  if (dayIndex === 2 || dayIndex === 3) return peakFactor;
  return 1;
}

function generateTimeSeries(): TimeSeriesDataPoint[] {
  return DAY_LABELS.map((name, index) => {
    const revenueMultiplier = getDayMultiplier(
      index,
      TIMESERIES_CONFIG.midweekRevenuePeak,
      TIMESERIES_CONFIG.weekendRevenueDip,
    );
    const usersMultiplier = getDayMultiplier(
      index,
      TIMESERIES_CONFIG.midweekUsersPeak,
      TIMESERIES_CONFIG.weekendUsersDip,
    );

    const revenue = roundTo(
      Math.max(
        0,
        randomInRange(
          TIMESERIES_CONFIG.revenueBase * revenueMultiplier,
          TIMESERIES_CONFIG.revenueVariance,
        ),
      ),
      2,
    );
    const users = roundTo(
      Math.max(
        0,
        randomInRange(
          TIMESERIES_CONFIG.usersBase * usersMultiplier,
          TIMESERIES_CONFIG.usersVariance,
        ),
      ),
      0,
    );

    return { name, revenue, users };
  });
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function fetchMetrics(): Promise<MetricsResponse> {
  await delay(800);

  const metrics = METRIC_DEFINITIONS.map(generateMetricItem);
  const timeSeries = generateTimeSeries();

  return {
    metrics,
    timeSeries,
    generatedAt: new Date().toISOString(),
  };
}
