'use client';

import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { DataTablePagination } from '@/components/common/table/DataTablePagination';
import Header from '@/components/layout/management/header/Header';
import PageSection from '@/components/layout/management/page-section/PageSection';
import { Button } from '@/components/ui/button';
import { getApiError } from '@/lib/api-error';
import { useAdminJlptExamList, useAdminJlptExamStats } from '../hooks/useAdminJlptExams';
import { useAdminJlptExamsUrlState } from '../hooks/useAdminJlptExamsUrlState';
import { AdminJlptLoading, AdminJlptQueryError } from './AdminJlptState';
import { AdminJlptExamStats } from './AdminJlptExamStats';
import { AdminJlptExamFilters } from './AdminJlptExamFilters';
import { AdminJlptExamGrid } from './AdminJlptExamGrid';
import { AdminJlptMetadataDialog, type AdminJlptMetadataTarget } from './AdminJlptMetadataDialog';

export function AdminJlptExamListPage() {
  const { params, searchText, setSearch, setFilters, setPage, reset } = useAdminJlptExamsUrlState();
  const list = useAdminJlptExamList(params);
  const stats = useAdminJlptExamStats(params);
  const [dialog, setDialog] = useState<AdminJlptMetadataTarget | null>(null);
  const data = list.data;
  const lastPage = data ? Math.max(0, data.totalPages - 1) : 0;
  const correctingPage = Boolean(data && !list.isError && params.page > lastPage);
  const filtered = Boolean(params.search || params.level || params.status);

  useEffect(() => {
    if (correctingPage) setPage(lastPage, 'replace');
  }, [correctingPage, lastPage, setPage]);

  const listStatus = list.isError ? getApiError(list.error).status : null;
  const statsStatus = stats.isError ? getApiError(stats.error).status : null;
  if (listStatus === 401 || listStatus === 403 || statsStatus === 401 || statsStatus === 403)
    return (
      <AdminJlptQueryError
        error={listStatus === 401 || listStatus === 403 ? list.error : stats.error}
        onRetry={() => {
          void list.refetch();
          void stats.refetch();
        }}
      />
    );

  return (
    <>
      <Header
        title="Đề thi JLPT"
        description="Quản lý đề thi, thông tin tổng quan và mở trình biên soạn cấu trúc."
        showProfile={false}
      >
        <Button
          className="h-10 rounded-2xl px-4"
          disabled={!list.isSuccess}
          onClick={() => setDialog({ mode: 'create' })}
        >
          <Plus aria-hidden="true" />
          Thêm đề thi
        </Button>
      </Header>
      <AdminJlptExamStats query={stats} />
      <PageSection>
        <h2 className="sr-only">Danh sách đề thi</h2>
        <AdminJlptExamFilters
          params={params}
          search={searchText}
          onSearch={setSearch}
          onFilters={setFilters}
          onReset={reset}
        />
        {list.isError ? (
          <AdminJlptQueryError error={list.error} onRetry={() => void list.refetch()} />
        ) : list.isPending || correctingPage ? (
          <AdminJlptLoading />
        ) : (
          data && (
            <section aria-label="Kết quả đề thi" aria-busy={list.isFetching} className="space-y-5">
              {data.content.length > 0 ? (
                <AdminJlptExamGrid
                  exams={data.content}
                  onEdit={(examId) => setDialog({ mode: 'edit', examId })}
                />
              ) : (
                <div role="status" className="space-y-3 py-10 text-center">
                  <h3 className="font-semibold text-slate-900">
                    {filtered
                      ? 'Không tìm thấy đề thi phù hợp'
                      : stats.data?.totalExams === 0
                        ? 'Thư viện chưa có đề thi'
                        : 'Chưa có đề thi đang hoạt động'}
                  </h3>
                  <p className="text-sm text-slate-600">
                    {filtered
                      ? 'Thử đổi từ khóa, cấp độ hoặc trạng thái.'
                      : 'Bạn có thể tạo đề thi nháp mới hoặc chọn trạng thái Đã lưu trữ để xem lịch sử.'}
                  </p>
                  {filtered && (
                    <Button variant="outline" onClick={reset}>
                      Xóa bộ lọc
                    </Button>
                  )}
                </div>
              )}
              <div className="flex flex-col justify-between gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center">
                <p aria-live="polite" className="text-xs text-slate-600">
                  {list.isFetching
                    ? 'Đang cập nhật…'
                    : `Hiển thị ${data.numberOfElements ? data.number * data.size + 1 : 0}–${data.number * data.size + data.numberOfElements} / ${data.totalElements} đề thi · Trang ${data.number + 1}/${Math.max(1, data.totalPages)}`}
                </p>
                {data.totalPages > 1 && (
                  <nav aria-label="Phân trang đề thi">
                    <DataTablePagination
                      page={params.page + 1}
                      totalPages={data.totalPages}
                      onPageChange={(page) => setPage(page - 1)}
                    />
                  </nav>
                )}
              </div>
            </section>
          )
        )}
      </PageSection>
      {dialog && (
        <AdminJlptMetadataDialog
          key={dialog.mode === 'create' ? 'create' : dialog.examId}
          target={dialog}
          onClose={() => setDialog(null)}
        />
      )}
    </>
  );
}
