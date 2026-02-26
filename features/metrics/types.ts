export enum MetricSeverity {
  Low = "low",
  Medium = "medium",
  High = "high",
  Critical = "critical",
}

export type MetricTrend = "up" | "down" | "stable";

export interface MetricItem {
  id: string;
  label: string;
  value: number;
  changePercentage: number;
  trend: MetricTrend;
}

export interface TimeSeriesDataPoint {
  name: string;
  revenue: number;
  users: number;
}

export interface MetricsResponse {
  metrics: MetricItem[];
  timeSeries: TimeSeriesDataPoint[];
  generatedAt: string;
}
