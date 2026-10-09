'use client';

import { useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { jlptExamsAPI, jlptExamsQueryKeys } from '@/apis/jlpt-exams/jlpt-exams.api';
import type { JlptExamsQuery } from '@/apis/jlpt-exams/jlpt-exams.type';
import { getApiErrorMessage } from '@/lib/api-error';
import { useJlptExamsUrlState } from '../hooks/useJlptExamsUrlState';
import { JlptExamsHeader } from './JlptExamsHeader';
import { JlptExamsToolbar } from './JlptExamsToolbar';
import { JlptExamGrid } from './JlptExamGrid';

export function JlptExamsPage() {
  const { state, searchText, setSearch, setLevel, setPage } = useJlptExamsUrlState();
  const params = useMemo<JlptExamsQuery>(() => ({
    page: state.page,
    size: 10,
    ...(state.search ? { search: state.search } : {}),
    ...(state.level ? { jlptLevel: state.level } : {}),
    sortKey: 'id',
    sortType: 'DESC',
  }), [state]);
  const query = useQuery({
    queryKey: jlptExamsQueryKeys.list(params),
    queryFn: ({ signal }) => jlptExamsAPI.getJlptExams(params, signal),
    retry: false,
  });
  const page = query.data;

  useEffect(() => {
    if (!page || query.isError) return;
    if (page.totalPages === 0 && state.page !== 0) setPage(0, 'replace');
    else if (page.totalPages > 0 && state.page >= page.totalPages)
      setPage(page.totalPages - 1, 'replace');
  }, [page, query.isError, setPage, state.page]);

  return (
    <div className="mx-auto w-full max-w-7xl">
      <JlptExamsHeader onHistoryClick={() => toast.info('Coming soon')} />
      <JlptExamsToolbar search={searchText} onSearchChange={setSearch} level={state.level} onLevelChange={setLevel} />
      {query.isError ? (
        <section role="alert" className="rounded-3xl border border-slate-100 bg-white px-6 py-16 text-center shadow-sm">
          <h2 className="text-base font-bold text-slate-800">Could not load JLPT exams</h2>
          <p className="mt-1 text-xs text-slate-500">{getApiErrorMessage(query.error)}</p>
          <button type="button" onClick={() => void query.refetch()} disabled={query.isFetching} className="mt-4 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 disabled:opacity-50">
            {query.isFetching ? 'Retrying…' : 'Retry'}
          </button>
        </section>
      ) : !page ? (
        <div role="status" aria-busy="true" className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => <div key={index} className="h-64 animate-pulse rounded-[20px] border border-slate-200 bg-white shadow-sm" />)}
          <span className="sr-only">Loading JLPT exams…</span>
        </div>
      ) : (
        <section aria-label="JLPT exam results" aria-busy={query.isFetching}>
          <div className="mb-3 min-h-5 text-xs font-medium text-slate-500" aria-live="polite">
            {query.isFetching ? 'Refreshing exams…' : `Showing ${page.numberOfElements ? page.number * page.size + 1 : 0}–${page.number * page.size + page.numberOfElements} of ${page.totalElements} exams`}
          </div>
          <JlptExamGrid exams={page.content} />
          {page.totalPages > 1 && (
            <nav aria-label="JLPT exam pages" className="mt-8 flex items-center justify-center gap-4 text-xs font-semibold text-slate-600">
              <button type="button" disabled={page.first} onClick={() => setPage(page.number - 1)} className="rounded-xl border border-slate-200 bg-white px-4 py-2 focus-visible:outline-2 focus-visible:outline-sky-500 disabled:cursor-not-allowed disabled:opacity-50">Previous</button>
              <span aria-live="polite">Page {page.number + 1} of {page.totalPages}</span>
              <button type="button" disabled={page.last} onClick={() => setPage(page.number + 1)} className="rounded-xl border border-slate-200 bg-white px-4 py-2 focus-visible:outline-2 focus-visible:outline-sky-500 disabled:cursor-not-allowed disabled:opacity-50">Next</button>
            </nav>
          )}
        </section>
      )}
    </div>
  );
}
