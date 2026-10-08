'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  parseMyCoursesSearchParams,
  writeMyCoursesSearchParams,
  type MyCoursesUrlState,
} from '../utils/my-courses-query';

type HistoryMode = 'push' | 'replace';

export function useMyCoursesUrlState() {
  const searchParams = useSearchParams();
  const serializedParams = searchParams.toString();
  const state = useMemo(
    () => parseMyCoursesSearchParams(new URLSearchParams(serializedParams)),
    [serializedParams],
  );
  const [searchText, setSearchText] = useState(state.courseTitle);
  const [previousTitle, setPreviousTitle] = useState(state.courseTitle);
  const searchRevision = useRef(0);

  if (previousTitle !== state.courseTitle) {
    setPreviousTitle(state.courseTitle);
    setSearchText(state.courseTitle);
  }

  const updateState = useCallback((updates: Partial<MyCoursesUrlState>, mode: HistoryMode = 'push') => {
    const url = new URL(window.location.href);
    const current = parseMyCoursesSearchParams(url.searchParams);
    url.search = writeMyCoursesSearchParams(url.searchParams, { ...current, ...updates }).toString();
    const href = `${url.pathname}${url.search}${url.hash}`;
    if (mode === 'replace') window.history.replaceState(null, '', href);
    else window.history.pushState(null, '', href);
  }, []);

  useEffect(() => {
    const canonical = writeMyCoursesSearchParams(
      new URLSearchParams(serializedParams),
      state,
    ).toString();
    if (canonical === serializedParams) return;
    const url = new URL(window.location.href);
    url.search = canonical;
    window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
  }, [serializedParams, state]);

  useEffect(() => {
    const courseTitle = searchText.trim();
    if (courseTitle === state.courseTitle) return;
    const revision = searchRevision.current;
    const timeout = window.setTimeout(() => {
      if (revision !== searchRevision.current) return;
      updateState({ courseTitle, page: 1 }, 'replace');
    }, 350);
    return () => window.clearTimeout(timeout);
  }, [searchText, state.courseTitle, updateState]);

  const setSearch = useCallback((value: string) => {
    searchRevision.current += 1;
    setSearchText(value);
  }, []);
  const setPage = useCallback(
    (page: number, mode: HistoryMode = 'push') => updateState({ page: Math.max(1, page) }, mode),
    [updateState],
  );
  const reset = useCallback(() => {
    searchRevision.current += 1;
    setSearchText('');
    updateState({ courseTitle: '', page: 1 });
  }, [updateState]);

  return { state, searchText, setSearch, setPage, reset };
}
