'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { jlptExamsAPI, jlptExamsQueryKeys } from '@/apis/jlpt-exams/jlpt-exams.api';
import { getApiError, getApiErrorMessage } from '@/lib/api-error';
import { selectAuthInitialized, selectCurrentUser } from '@/store/authSlice';
import { useAppSelector } from '@/store/hooks';
import { isRenderableJlptResult } from '../../result/validate-result';
import { JlptExamResultPage } from './JlptExamResultPage';

export function JlptExamResultRoute({ attemptId }: { attemptId: number }) {
  const initialized = useAppSelector(selectAuthInitialized);
  const user = useAppSelector(selectCurrentUser);
  const query = useQuery({
    queryKey: jlptExamsQueryKeys.result(attemptId),
    queryFn: ({ signal }) => jlptExamsAPI.getJlptAttemptResult(attemptId, signal),
    enabled: initialized && Boolean(user),
    retry: false,
  });

  if (!initialized || (user && query.isPending)) {
    return <div role="status" aria-busy="true" className="mx-auto max-w-5xl space-y-5"><div className="h-56 animate-pulse rounded-3xl bg-white" /><div className="h-28 animate-pulse rounded-3xl bg-white" /><span className="sr-only">Đang tải kết quả…</span></div>;
  }

  const result = query.data;
  if (!user || query.isError || !isRenderableJlptResult(result, attemptId)) {
    const status = getApiError(query.error).status;
    const unfinished = result?.status === 'IN_PROGRESS' || result?.status === 'ABANDONED';
    const canRetry = Boolean(user) && (status === null || status >= 500)
      && !unfinished;
    const message = !user || status === 401 ? 'Vui lòng đăng nhập để xem kết quả.'
      : status === 400 || unfinished ? 'Lượt làm bài này chưa hoàn thành nên chưa có kết quả.'
        : status === 403 || status === 404 ? 'Không tìm thấy lượt làm bài này trong tài khoản của bạn.'
          : result?.attemptId !== undefined && result.attemptId !== attemptId ? 'Máy chủ trả về kết quả không đúng lượt làm bài.'
            : result !== undefined ? 'Dữ liệu kết quả của lượt làm bài này chưa sẵn sàng.'
              : query.isError ? getApiErrorMessage(query.error) : 'Kết quả của lượt làm bài này hiện không có sẵn.';
    return (
      <section role="alert" className="mx-auto max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-xl font-extrabold text-slate-900">Chưa thể xem kết quả</h1>
        <p className="mt-3 text-sm text-slate-600">{message}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-4">
          {canRetry && <button type="button" onClick={() => void query.refetch()} disabled={query.isFetching} className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 disabled:opacity-50">{query.isFetching ? 'Đang thử lại…' : 'Thử lại'}</button>}
          <Link href={user ? '/student/jlpt_exam_history' : '/login'} className="self-center text-sm font-bold text-sky-700 underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500">{user ? 'Lịch sử làm bài' : 'Đăng nhập'}</Link>
        </div>
      </section>
    );
  }

  return <JlptExamResultPage result={result} />;
}
