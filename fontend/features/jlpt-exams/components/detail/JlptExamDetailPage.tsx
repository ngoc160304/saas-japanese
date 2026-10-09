'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { jlptExamsAPI, jlptExamsQueryKeys } from '@/apis/jlpt-exams/jlpt-exams.api';
import { getApiError, getApiErrorMessage } from '@/lib/api-error';
import { ExamDetailBreadcrumbs } from './ExamDetailBreadcrumbs';
import { JlptExamDetail } from './JlptExamDetail';

export function JlptExamDetailPage({ examId }: { examId: number }) {
  const query = useQuery({
    queryKey: jlptExamsQueryKeys.detail(examId),
    queryFn: ({ signal }) => jlptExamsAPI.getJlptExam(examId, signal),
    retry: false,
  });
  const exam = query.isSuccess && query.data?.id === examId ? query.data : null;

  if (query.isPending) {
    return (
      <div role="status" aria-busy="true" className="mx-auto w-full max-w-5xl">
        <ExamDetailBreadcrumbs title="Loading exam…" />
        <div className="h-64 animate-pulse rounded-3xl border border-slate-100 bg-white shadow-sm" />
        <span className="sr-only">Loading JLPT exam details…</span>
      </div>
    );
  }

  if (!exam) {
    const notFound = query.isSuccess || getApiError(query.error).status === 404;
    return (
      <div className="mx-auto w-full max-w-5xl">
        <ExamDetailBreadcrumbs title={notFound ? 'Exam unavailable' : 'Exam details'} />
        <section role="alert" className="rounded-3xl border border-slate-100 bg-white px-6 py-16 text-center shadow-sm">
          <h1 className="text-xl font-extrabold text-slate-900">
            {notFound ? 'Exam unavailable' : 'Could not load exam'}
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            {notFound ? 'This exam does not exist or is not published.' : getApiErrorMessage(query.error)}
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-4">
            {!notFound && (
              <button type="button" onClick={() => void query.refetch()} disabled={query.isFetching} className="rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 disabled:opacity-50">
                {query.isFetching ? 'Retrying…' : 'Retry'}
              </button>
            )}
            <Link href="/student/jlpt-exams" className="text-xs font-bold text-sky-700 hover:underline focus-visible:outline-2 focus-visible:outline-sky-500">Browse JLPT exams</Link>
          </div>
        </section>
      </div>
    );
  }

  return <JlptExamDetail exam={exam} />;
}
