'use client';

import { keepPreviousData, useQuery, type QueryKey } from '@tanstack/react-query';

import { useDataTableParams } from './useDataTableParams';

interface UseDataTableQueryOptions<TData> {
  queryKey: QueryKey;

  queryFn: (params: { search: string; page: number; size: number }) => Promise<TData>;

  searchValue?: string;
  onSearchChange?: (value: string) => void;

  defaultPage?: number;
  defaultSize?: number;
  maxSize?: number;

  searchParam?: string;
  pageParam?: string;
  sizeParam?: string;

  enabled?: boolean;
}

export function useDataTableQuery<TData>({
  queryKey,
  queryFn,
  searchValue,
  onSearchChange,

  defaultPage = 1,
  defaultSize = 10,
  maxSize,

  searchParam = 'search',
  pageParam = 'page',
  sizeParam = 'size',

  enabled = true,
}: UseDataTableQueryOptions<TData>) {
  const params = useDataTableParams({
    defaultPage,
    defaultSize,
    maxSize,
    searchParam,
    pageParam,
    sizeParam,
  });
  const hasControlledSearch = searchValue !== undefined;
  const search = hasControlledSearch ? searchValue : params.search;

  const setSearch = (value: string) => {
    if (!hasControlledSearch) {
      params.setSearch(value);
      return;
    }

    onSearchChange?.(value);
    if (params.page !== defaultPage) params.setPage(defaultPage);
  };

  const reset = () => {
    if (hasControlledSearch) onSearchChange?.('');
    params.reset();
  };

  const query = useQuery({
    queryKey: [
      ...queryKey,
      {
        search,
        page: params.page,
        size: params.size,
      },
    ],

    queryFn: () =>
      queryFn({
        search,
        page: params.page,
        size: params.size,
      }),

    placeholderData: keepPreviousData,

    enabled,
  });

  return {
    ...query,

    ...params,
    search,
    setSearch,
    reset,
  };
}
