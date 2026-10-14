'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { jlptExamsAPI, jlptExamsQueryKeys } from '@/apis/jlpt-exams/jlpt-exams.api';
import { getApiError, getApiErrorMessage } from '@/lib/api-error';
import { selectAuthInitialized, selectCurrentUser } from '@/store/authSlice';
import { useAppSelector } from '@/store/hooks';
import { HistoryAttemptRow } from './HistoryAttemptRow';

const pageSize = 10;

export function JlptExamHistoryPage({ pageNumber }: { pageNumber: number }) {
  const initialized = useAppSelector(selectAuthInitialized);
  const user = useAppSelector(selectCurrentUser);
  const params = { page: pageNumber - 1, size: pageSize };
  const query = useQuery({
    queryKey: jlptExamsQueryKeys.history(params),
    queryFn: ({ signal }) => jlptExamsAPI.getJlptAttemptHistory(params, signal),
    enabled: initialized && Boolean(user),
    retry: false,
  });
  const page = query.data;

  return (
    <div className="mx-auto w-full max-w-7xl">
      <header className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <nav aria-label="Breadcrumb" className="mb-1 flex items-center gap-2 text-xs font-semibold text-slate-400"><Link href="/student/jlpt-exams" className="hover:text-slate-600 focus-visible:outline-2 focus-visible:outline-sky-500">JLPT Exams</Link><span aria-hidden="true">/</span><span aria-current="page" className="text-slate-800">Lịch sử làm bài</span></nav>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 md:text-3xl">Lịch sử làm bài JLPT</h1>
          <p className="mt-1 text-xs font-medium text-slate-500 md:text-sm">Xem lại các lượt luyện tập và kết quả đã hoàn thành.</p>
        </div>
        <Link href="/student/jlpt-exams" className="self-start rounded-2xl bg-slate-900 px-5 py-3 text-xs font-bold text-white hover:bg-sky-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 sm:self-auto">+ Chọn đề mới</Link>
      </header>

      {page && <section aria-label="Thống kê lịch sử" className="mb-6 grid grid-cols-2 gap-4">
        <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm"><h2 className="text-xs font-bold uppercase tracking-wide text-slate-500">Tổng lượt làm bài</h2><p className="mt-2 text-2xl font-extrabold text-slate-900">{page.totalElements}</p></div>
        <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm"><h2 className="text-xs font-bold uppercase tracking-wide text-slate-500">Lượt trên trang này</h2><p className="mt-2 text-2xl font-extrabold text-slate-900">{page.numberOfElements}</p></div>
      </section>}

      <section aria-labelledby="history-list-title" className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5"><h2 id="history-list-title" className="text-base font-bold text-slate-900">Các lượt làm bài</h2><p className="mt-1 text-xs text-slate-500">Mới nhất trước · Điểm và trạng thái từ máy chủ</p></div>
        {!initialized || (user && query.isPending) ? <div role="status" aria-busy="true" className="p-8 text-center text-sm text-slate-500">Đang tải lịch sử…</div>
          : !user || query.isError || !page ? <div role="alert" className="p-8 text-center"><p className="text-sm text-slate-700">{!user || getApiError(query.error).status === 401 ? 'Vui lòng đăng nhập để xem lịch sử.' : getApiErrorMessage(query.error)}</p>{user && <button type="button" onClick={() => void query.refetch()} disabled={query.isFetching} className="mt-4 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 disabled:opacity-50">{query.isFetching ? 'Đang thử lại…' : 'Thử lại'}</button>}</div>
            : page.content.length === 0 ? <p className="p-8 text-center text-sm text-slate-600">{pageNumber === 1 ? 'Chưa có lượt làm bài nào. Hãy chọn một đề để bắt đầu.' : 'Trang này không có lượt làm bài. Hãy quay lại trang trước.'}</p>
              : <div><div className="hidden grid-cols-[minmax(0,2fr)_5rem_minmax(0,1fr)_minmax(0,1fr)_7rem_auto] gap-4 px-5 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-400 md:grid"><span>Đề thi và chế độ</span><span>Cấp độ</span><span>Thời gian</span><span>Điểm</span><span>Trạng thái</span><span className="text-right">Thao tác</span></div>{page.content.map((attempt) => <HistoryAttemptRow key={attempt.attemptId} attempt={attempt} />)}</div>}
      </section>

      {page && (page.totalPages > 1 || pageNumber > 1) && <nav aria-label="Trang lịch sử" className="mt-6 flex items-center justify-center gap-4 text-xs font-semibold text-slate-600">
        {pageNumber > 1 ? <Link href={`/student/jlpt_exam_history?page=${pageNumber - 1}`} className="rounded-xl border border-slate-200 bg-white px-4 py-2 focus-visible:outline-2 focus-visible:outline-sky-500">Trước</Link> : <span className="rounded-xl border border-slate-200 bg-white px-4 py-2 opacity-50">Trước</span>}
        <span aria-live="polite">Trang {pageNumber} / {Math.max(1, page.totalPages)}</span>
        {!page.last && page.content.length > 0 ? <Link href={`/student/jlpt_exam_history?page=${pageNumber + 1}`} className="rounded-xl border border-slate-200 bg-white px-4 py-2 focus-visible:outline-2 focus-visible:outline-sky-500">Sau</Link> : <span className="rounded-xl border border-slate-200 bg-white px-4 py-2 opacity-50">Sau</span>}
      </nav>}
    </div>
  );
}
