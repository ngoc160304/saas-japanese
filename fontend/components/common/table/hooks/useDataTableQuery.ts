'use client';

import { keepPreviousData, useQuery, type QueryKey } from '@tanstack/react-query';

import { useDataTableParams } from './useDataTableParams';

interface UseDataTableQueryOptions<TData> {
  queryKey: QueryKey;

  queryFn: (params: { search: string; page: number; size: number }) => Promise<TData>;

  defaultPage?: number;
  defaultSize?: number;

  searchParam?: string;
  pageParam?: string;
  sizeParam?: string;

  enabled?: boolean;
}

export function useDataTableQuery<TData>({
  queryKey,
  queryFn,

  defaultPage = 1,
  defaultSize = 10,

  searchParam = 'search',
  pageParam = 'page',
  sizeParam = 'size',

  enabled = true,
}: UseDataTableQueryOptions<TData>) {
  const params = useDataTableParams({
    defaultPage,
    defaultSize,
    searchParam,
    pageParam,
    sizeParam,
  });

  const query = useQuery({
    queryKey: [
      ...queryKey,
      {
        search: params.search,
        page: params.page,
        size: params.size,
      },
    ],

    queryFn: () =>
      queryFn({
        search: params.search,
        page: params.page,
        size: params.size,
      }),

    placeholderData: keepPreviousData,

    enabled,
  });

  return {
    ...query,

    ...params,
  };
}
