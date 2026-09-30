'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  DEFAULT_COURSES_PAGE,
  DEFAULT_COURSES_SIZE,
  DEFAULT_COURSES_SORT,
  parseCoursesSearchParams,
  type CoursesPricing,
  type CoursesSort,
  type CoursesUrlState,
  writeCoursesSearchParams,
} from '../utils/course-list-query';

type CoursesUrlUpdate = Partial<CoursesUrlState>;
type HistoryMode = 'push' | 'replace';

function updateBrowserUrl(state: CoursesUrlState, mode: HistoryMode) {
  const url = new URL(window.location.href);
  url.search = writeCoursesSearchParams(url.searchParams, state).toString();
  const href = `${url.pathname}${url.search}${url.hash}`;
  if (mode === 'replace') window.history.replaceState(null, '', href);
  else window.history.pushState(null, '', href);
}

export function useCoursesUrlState() {
  const searchParams = useSearchParams();
  const serializedParams = searchParams.toString();
  const state = useMemo(
    () => parseCoursesSearchParams(new URLSearchParams(serializedParams)),
    [serializedParams],
  );
  const [searchText, setSearchText] = useState(state.title);
  const [previousTitle, setPreviousTitle] = useState(state.title);
  const searchRevision = useRef(0);

  if (previousTitle !== state.title) {
    setPreviousTitle(state.title);
    setSearchText(state.title);
  }

  const updateState = useCallback((updates: CoursesUrlUpdate, mode: HistoryMode = 'push') => {
    const currentUrl = new URL(window.location.href);
    const currentState = parseCoursesSearchParams(currentUrl.searchParams);
    updateBrowserUrl({ ...currentState, ...updates }, mode);
  }, []);

  useEffect(() => {
    const canonical = writeCoursesSearchParams(
      new URLSearchParams(serializedParams),
      state,
    ).toString();
    if (canonical === serializedParams) return;
    const url = new URL(window.location.href);
    url.search = canonical;
    window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
  }, [serializedParams, state]);

  useEffect(() => {
    const normalizedSearch = searchText.trim();
    if (normalizedSearch === state.title) return;
    const revision = searchRevision.current;
    const timeout = window.setTimeout(() => {
      if (revision !== searchRevision.current) return;
      updateState({ title: normalizedSearch, page: DEFAULT_COURSES_PAGE }, 'replace');
    }, 350);
    return () => window.clearTimeout(timeout);
  }, [searchText, state.title, updateState]);

  const setSearch = useCallback((value: string) => {
    searchRevision.current += 1;
    setSearchText(value);
  }, []);

  const setPricing = useCallback(
    (pricing: CoursesPricing) => {
      updateState({ pricing, page: DEFAULT_COURSES_PAGE });
    },
    [updateState],
  );

  const setSort = useCallback(
    (sort: CoursesSort) => {
      updateState({ sort, page: DEFAULT_COURSES_PAGE });
    },
    [updateState],
  );

  const setPage = useCallback(
    (page: number, mode: HistoryMode = 'push') => {
      updateState({ page: Math.max(DEFAULT_COURSES_PAGE, page) }, mode);
    },
    [updateState],
  );

  const reset = useCallback(() => {
    searchRevision.current += 1;
    setSearchText('');
    updateState(
      {
        title: '',
        categoryId: null,
        pricing: 'all',
        page: DEFAULT_COURSES_PAGE,
        size: DEFAULT_COURSES_SIZE,
        sort: DEFAULT_COURSES_SORT,
      },
      'push',
    );
  }, [updateState]);

  return { state, searchText, setSearch, setPricing, setSort, setPage, reset };
}
