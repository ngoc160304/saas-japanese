'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { StatCard } from '@/components/common/stats/StatCard';
import { DataTablePagination } from '@/components/common/table/DataTablePagination';
import Header from '@/components/layout/management/header/Header';
import PageSection from '@/components/layout/management/page-section/PageSection';
import { parseAdminJlptExamQuery } from '../admin-jlpt-route';
import { useAdminJlptExamList, useAdminJlptExamStats } from '../hooks/useAdminJlptExams';
import { AdminJlptLoading, AdminJlptQueryError } from './AdminJlptState';
import { AdminJlptStatus } from './AdminJlptStatus';

export function AdminJlptExamListPage() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const params = parseAdminJlptExamQuery(searchParams);
  const list = useAdminJlptExamList(params);
  const stats = useAdminJlptExamStats(params);
  const data = list.data;
  const lastPage = data ? Math.max(1, data.totalPages) : 1;
  const currentPage = (params.page ?? 0) + 1;
  const correctingPage = Boolean(data && !list.isError && currentPage > lastPage);

  function setPage(page: number) {
    const next = new URLSearchParams(searchParams.toString());
    next.set('page', String(page));
    router.push(`${pathname}?${next}`, { scroll: false });
  }

  useEffect(() => {
    if (!correctingPage) return;
    const next = new URLSearchParams(searchParams.toString());
    next.set('page', String(lastPage));
    router.replace(`${pathname}?${next}`, { scroll: false });
  }, [correctingPage, lastPage, pathname, router, searchParams]);

  // A revoked permission must take precedence over any previously cached rows.
  if (list.isError)
    return <AdminJlptQueryError error={list.error} onRetry={() => void list.refetch()} />;
  if (stats.isError)
    return <AdminJlptQueryError error={stats.error} onRetry={() => void stats.refetch()} />;

  return (
    <>
      <Header
        title="Đề thi JLPT"
        description="Xem danh sách và cấu trúc đề thi JLPT."
        showProfile={false}
      />
      {stats.data && (
        <StatCard
          items={[
            {
              label: 'Tổng đề thi',
              value: stats.data.totalExams,
              description: 'Gồm cả đề đã lưu trữ',
            },
            { label: 'Đã xuất bản', value: stats.data.publishedExams },
            { label: 'Bản nháp', value: stats.data.draftExams },
            { label: 'Đã lưu trữ', value: stats.data.archivedExams },
          ]}
        />
      )}
      <PageSection>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-900">Danh sách đề thi</h2>
          <p className="text-xs text-slate-600">Chế độ chỉ đọc</p>
        </div>
        {(params.search || params.level || params.status) && (
          <p className="break-words text-sm text-slate-600">
            Bộ lọc: {[params.search, params.level, params.status].filter(Boolean).join(' · ')}.{' '}
            <Link href="/admin/exams" className="text-primary underline">
              Xóa bộ lọc
            </Link>
          </p>
        )}
        {list.isPending || stats.isPending || correctingPage ? (
          <AdminJlptLoading />
        ) : (
          data && (
            <div aria-busy={list.isFetching} className="space-y-5">
              {data.content.length === 0 ? (
                <p role="status" className="py-8 text-center text-sm text-slate-600">
                  Chưa có đề thi phù hợp.
                </p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {data.content.map((exam) => (
                    <li
                      key={exam.id}
                      className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0 space-y-2">
                        <Link
                          className="break-words text-sm font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-2"
                          href={`/admin/exams/${exam.id}`}
                        >
                          {exam.title}
                        </Link>
                        <p className="text-xs text-slate-600">
                          {exam.level} · {exam.questionCount} câu hỏi · {exam.totalTimeMinutes} phút
                          · Điểm đỗ: {exam.passingScore}
                        </p>
                        {exam.description && (
                          <p className="line-clamp-2 break-words text-sm text-slate-600">
                            {exam.description}
                          </p>
                        )}
                      </div>
                      <div className="flex shrink-0 flex-wrap items-center gap-2">
                        <AdminJlptStatus status={exam.status} />
                        {exam.contentLocked && (
                          <span className="text-xs text-slate-600">Nội dung đã khóa</span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <p aria-live="polite" className="text-xs text-slate-600">
                {list.isFetching
                  ? 'Đang cập nhật…'
                  : `Tổng ${data.totalElements} đề thi · Trang ${data.number + 1}/${Math.max(1, data.totalPages)}`}
              </p>
              {data.totalPages > 1 && (
                <nav aria-label="Phân trang đề thi">
                  <DataTablePagination
                    page={data.number + 1}
                    totalPages={data.totalPages}
                    onPageChange={setPage}
                  />
                </nav>
              )}
            </div>
          )
        )}
      </PageSection>
    </>
  );
}
