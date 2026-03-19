import { useQuery } from "@tanstack/react-query";
import { useState, useCallback } from "react";

export interface PaginatedResult<T> {
  data: T[];
  count: number;
}

interface UsePaginatedQueryOptions<T> {
  queryKey: unknown[];
  queryFn: (range: { from: number; to: number }) => Promise<PaginatedResult<T>>;
  pageSize?: number;
  staleTime?: number;
  enabled?: boolean;
}

export function usePaginatedQuery<T>({
  queryKey,
  queryFn,
  pageSize = 20,
  staleTime = 30_000,
  enabled = true,
}: UsePaginatedQueryOptions<T>) {
  const [page, setPage] = useState(1);

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const query = useQuery({
    queryKey: [...queryKey, "page", page, pageSize],
    queryFn: () => queryFn({ from, to }),
    staleTime,
    enabled,
  });

  const totalCount = query.data?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const items = query.data?.data ?? [];

  const resetPage = useCallback(() => setPage(1), []);

  return {
    items,
    totalCount,
    page,
    totalPages,
    pageSize,
    setPage,
    resetPage,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error as Error | null,
    refetch: query.refetch,
  };
}
