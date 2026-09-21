'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

interface UseDataTableParamsOptions {
  defaultPage?: number;
  defaultSize?: number;
  maxSize?: number;
  searchParam?: string;
  pageParam?: string;
  sizeParam?: string;
}

export function useDataTableParams({
  defaultPage = 1,
  defaultSize = 10,
  maxSize = Number.MAX_SAFE_INTEGER,
  searchParam = 'search',
  pageParam = 'page',
  sizeParam = 'size',
}: UseDataTableParamsOptions = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const search = searchParams.get(searchParam) ?? '';

  const pageValue = Number(searchParams.get(pageParam));
  const page = Number.isSafeInteger(pageValue) && pageValue > 0 ? pageValue : defaultPage;

  const sizeValue = Number(searchParams.get(sizeParam));
  const size = Math.min(
    Number.isSafeInteger(sizeValue) && sizeValue > 0 ? sizeValue : defaultSize,
    maxSize,
  );

  const updateParams = (updates: Record<string, string | number | null>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === '') {
        params.delete(key);
        return;
      }

      params.set(key, String(value));
    });

    const queryString = params.toString();

    router.replace(queryString ? `${pathname}?${queryString}` : pathname);
  };

  const setSearch = (value: string) => {
    updateParams({
      [searchParam]: value,
      [pageParam]: defaultPage,
    });
  };

  const setPage = (value: number) => {
    updateParams({
      [pageParam]: value,
    });
  };

  const setSize = (value: number) => {
    updateParams({
      [sizeParam]: value,
      [pageParam]: defaultPage,
    });
  };

  const reset = () => {
    updateParams({
      [searchParam]: null,
      [pageParam]: null,
      [sizeParam]: null,
    });
  };

  return {
    search,
    page,
    size,

    setSearch,
    setPage,
    setSize,
    reset,
  };
}
