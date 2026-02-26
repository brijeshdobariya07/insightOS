import { useQuery } from "@tanstack/react-query";
import { fetchTableData } from "../services";
import type { TableResponse } from "../types";

export function useTableData() {
  const { data, isLoading, isError, error, refetch } =
    useQuery<TableResponse>({
      queryKey: ["table-data"],
      queryFn: fetchTableData,
    });

  return { data, isLoading, isError, error, refetch } as const;
}
