'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { jlptExamsAPI, jlptExamsQueryKeys } from '@/apis/jlpt-exams/jlpt-exams.api';
import { getApiError, getApiErrorMessage } from '@/lib/api-error';
import { JlptExamTaking } from './JlptExamTaking';

export function JlptExamTakingPage({ examId }: { examId: number }) {
  const query = useQuery({
    queryKey: jlptExamsQueryKeys.structure(examId),
    queryFn: ({ signal }) => jlptExamsAPI.getJlptExamStructure(examId, signal),
    retry: false,
  });
  const exam = query.isSuccess && query.data?.id === examId ? query.data : null;

  if (query.isPending) {
    return (
      <div role="status" aria-busy="true" className="min-h-dvh bg-[#f8fafc] p-4 sm:p-8">
        <div className="mx-auto max-w-5xl space-y-5">
          <div className="h-16 animate-pulse rounded-2xl bg-white" />
          <div className="h-64 animate-pulse rounded-2xl bg-white" />
          <span className="sr-only">Loading exam structure…</span>
        </div>
      </div>
    );
  }

  if (!exam) {
    const notFound = query.isSuccess || getApiError(query.error).status === 404;
    return (
      <main className="flex min-h-dvh items-center justify-center bg-[#f8fafc] p-4">
        <section role="alert" className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-extrabold text-slate-900">{notFound ? 'Exam unavailable' : 'Could not load exam structure'}</h1>
          <p className="mt-2 text-sm text-slate-600">{notFound ? 'This exam does not exist or is not available.' : getApiErrorMessage(query.error)}</p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-4">
            {!notFound && <button type="button" onClick={() => void query.refetch()} disabled={query.isFetching} className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 disabled:opacity-50">{query.isFetching ? 'Retrying…' : 'Retry'}</button>}
            <Link href="/student/jlpt-exams" className="text-sm font-bold text-sky-700 hover:underline focus-visible:outline-2 focus-visible:outline-sky-500">Browse JLPT exams</Link>
          </div>
        </section>
      </main>
    );
  }

  return <JlptExamTaking key={exam.id} exam={exam} />;
}
