'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  parseAdminJlptExamQuery,
  writeAdminJlptExamQuery,
  type AdminJlptListParams,
} from '../admin-jlpt-route';

export function useAdminJlptExamsUrlState() {
  const serialized = useSearchParams().toString();
  const params = useMemo(
    () => parseAdminJlptExamQuery(new URLSearchParams(serialized)),
    [serialized],
  );
  const [searchText, setSearchText] = useState(params.search ?? '');
  const [previousUrl, setPreviousUrl] = useState(serialized);
  const revision = useRef(0);
  if (previousUrl !== serialized) {
    setPreviousUrl(serialized);
    setSearchText(params.search ?? '');
  }

  const update = useCallback(
    (updates: Partial<AdminJlptListParams>, mode: 'push' | 'replace' = 'push') => {
      const url = new URL(window.location.href);
      const current = parseAdminJlptExamQuery(url.searchParams);
      url.search = writeAdminJlptExamQuery(url.searchParams, { ...current, ...updates }).toString();
      const href = `${url.pathname}${url.search}${url.hash}`;
      if (mode === 'replace') window.history.replaceState(null, '', href);
      else window.history.pushState(null, '', href);
    },
    [],
  );

  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.toString() !== serialized) return;
    const canonical = writeAdminJlptExamQuery(url.searchParams, params).toString();
    if (canonical === serialized) return;
    url.search = canonical;
    window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
  }, [params, serialized]);

  useEffect(() => {
    if (searchText.trim() === (params.search ?? '')) return;
    const currentRevision = revision.current;
    const timer = window.setTimeout(() => {
      if (revision.current === currentRevision) update({ search: searchText.trim(), page: 0 });
    }, 350);
    return () => window.clearTimeout(timer);
  }, [searchText, params.search, serialized, update]);

  const setSearch = (value: string) => {
    revision.current += 1;
    setSearchText(value);
  };
  const setFilters = (values: Partial<Pick<AdminJlptListParams, 'level' | 'status' | 'size'>>) => {
    revision.current += 1;
    update({ ...values, search: searchText.trim(), page: 0 });
  };
  const setPage = useCallback(
    (page: number, mode: 'push' | 'replace' = 'push') => update({ page: Math.max(0, page) }, mode),
    [update],
  );
  const reset = () => {
    revision.current += 1;
    setSearchText('');
    update({ search: undefined, level: undefined, status: undefined, page: 0, size: 10 });
  };
  return { params, searchText, setSearch, setFilters, setPage, reset };
}
