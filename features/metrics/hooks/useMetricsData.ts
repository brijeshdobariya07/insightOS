import { useQuery } from "@tanstack/react-query";
import { fetchMetrics } from "../services";
import type { MetricsResponse } from "../types";

export function useMetricsData() {
  const { data, isLoading, isError, error, refetch } =
    useQuery<MetricsResponse>({
      queryKey: ["metrics"],
      queryFn: fetchMetrics,
    });

  return { data, isLoading, isError, error, refetch } as const;
}
