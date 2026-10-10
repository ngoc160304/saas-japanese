'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import type { JlptLevel } from '@/apis/jlpt-exams/jlpt-exams.type';

interface JlptExamsUrlState {
  search: string;
  level: JlptLevel | null;
  page: number;
}

function isJlptLevel(value: string | null): value is JlptLevel {
  return value === 'N5' || value === 'N4' || value === 'N3' || value === 'N2' || value === 'N1';
}

function parseState(params: URLSearchParams): JlptExamsUrlState {
  const level = params.get('jlptLevel');
  const page = params.get('page');
  return {
    search: (params.get('search') ?? '').trim(),
    level: isJlptLevel(level) ? level : null,
    page: page && /^\d+$/.test(page) && Number.isSafeInteger(Number(page)) ? Number(page) : 0,
  };
}

function writeState(params: URLSearchParams, state: JlptExamsUrlState) {
  const next = new URLSearchParams(params);
  next.delete('search');
  next.delete('jlptLevel');
  next.delete('page');
  if (state.search) next.set('search', state.search);
  if (state.level) next.set('jlptLevel', state.level);
  if (state.page > 0) next.set('page', String(state.page));
  return next;
}

export function useJlptExamsUrlState() {
  const searchParams = useSearchParams();
  const serializedParams = searchParams.toString();
  const state = useMemo(() => parseState(new URLSearchParams(serializedParams)), [serializedParams]);
  const [searchText, setSearchText] = useState(state.search);
  const [previousSearch, setPreviousSearch] = useState(state.search);
  const searchRevision = useRef(0);

  if (previousSearch !== state.search) {
    setPreviousSearch(state.search);
    setSearchText(state.search);
  }

  const updateState = useCallback((updates: Partial<JlptExamsUrlState>, mode: 'push' | 'replace' = 'push') => {
    const url = new URL(window.location.href);
    const current = parseState(url.searchParams);
    url.search = writeState(url.searchParams, { ...current, ...updates }).toString();
    const href = `${url.pathname}${url.search}${url.hash}`;
    if (mode === 'replace') window.history.replaceState(null, '', href);
    else window.history.pushState(null, '', href);
  }, []);

  useEffect(() => {
    const canonical = writeState(new URLSearchParams(serializedParams), state).toString();
    if (canonical === serializedParams) return;
    const url = new URL(window.location.href);
    url.search = canonical;
    window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
  }, [serializedParams, state]);

  useEffect(() => {
    const search = searchText.trim();
    if (search === state.search) return;
    const revision = searchRevision.current;
    const timeout = window.setTimeout(() => {
      if (revision !== searchRevision.current) return;
      updateState({ search, page: 0 }, 'replace');
    }, 350);
    return () => window.clearTimeout(timeout);
  }, [searchText, state.search, updateState]);

  const setSearch = useCallback((value: string) => {
    searchRevision.current += 1;
    setSearchText(value);
  }, []);
  const setLevel = useCallback((level: JlptLevel | null) => {
    searchRevision.current += 1;
    updateState({ search: searchText.trim(), level, page: 0 });
  }, [searchText, updateState]);
  const setPage = useCallback((page: number, mode: 'push' | 'replace' = 'push') => {
    updateState({ page: Math.max(0, page) }, mode);
  }, [updateState]);

  return { state, searchText, setSearch, setLevel, setPage };
}
