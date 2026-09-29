import Link from 'next/link';
import type { Lesson } from '@/apis/lessons/lessons.type';
import type { PageResponse } from '@/types/pagination';
import { DataTablePagination } from '@/components/common/table/DataTablePagination';
import { DataTableReset } from '@/components/common/table/search-bar/DataTableReset';
import { DataTableSearch } from '@/components/common/table/search-bar/DataTableSearch';
import PageSection from '@/components/layout/management/page-section/PageSection';
import { Button } from '@/components/ui/button';
import { LessonTable } from '@/features/lesson/component/LessonTable';

interface CourseLessonsSectionProps {
  page: PageResponse<Lesson> | undefined;
  currentPage: number;
  searchValue: string;
  loading: boolean;
  busy: boolean;
  error: string | null;
  createHref: string;
  onSearchChange: (value: string) => void;
  onReset: () => void;
  onRetry: () => void;
  onPageChange: (page: number) => void;
  onDelete: (lesson: Lesson) => void;
}

export function CourseLessonsSection({
  page,
  currentPage,
  searchValue,
  loading,
  busy,
  error,
  createHref,
  onSearchChange,
  onReset,
  onRetry,
  onPageChange,
  onDelete,
}: CourseLessonsSectionProps) {
  const shownFrom = page?.content.length ? page.pageable.offset + 1 : 0;
  const shownTo = page ? page.pageable.offset + page.content.length : 0;

  return (
    <PageSection>
      <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-base font-bold text-slate-900">Nội dung bài học</h2>
          <p className="mt-0.5 text-xs font-medium text-slate-600">
            Danh sách bài học và trạng thái nội dung trong khóa học.
          </p>
        </div>

        <div className="flex w-full items-center gap-2 sm:w-auto">
          <DataTableSearch
            value={searchValue}
            onChange={onSearchChange}
            placeholder="Tìm tiêu đề, slug hoặc nội dung..."
            className="max-w-none sm:w-64"
          />
          <DataTableReset onReset={onReset} label="Đặt lại" />
        </div>
      </div>

      {busy && !loading && (
        <p role="status" className="text-xs font-medium text-slate-700">
          Đang cập nhật bài học…
        </p>
      )}

      <LessonTable
        lessons={page?.content ?? []}
        offset={page?.pageable.offset ?? 0}
        loading={loading}
        busy={busy}
        error={error}
        onRetry={onRetry}
        onDelete={onDelete}
      />

      {page && !error && (
        <div className="flex flex-col gap-4 border-t border-slate-100 pt-5 text-xs font-medium text-slate-700 lg:flex-row lg:items-center lg:justify-between">
          <p aria-live="polite">
            Hiển thị {shownFrom}–{shownTo} / {page.totalElements} bài học
          </p>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center lg:justify-end">
            {page.totalPages > 0 && (
              <div className="[&>div]:border-0 [&>div]:pt-0">
                <DataTablePagination
                  page={page.number + 1}
                  totalPages={page.totalPages}
                  onPageChange={onPageChange}
                />
              </div>
            )}
            {!page.content.length && currentPage > 1 && (
              <Button variant="outline" onClick={() => onPageChange(1)}>
                Về trang đầu
              </Button>
            )}
            <Link
              href={createHref}
              className="font-bold text-sky-600 hover:text-sky-700 hover:underline focus-visible:rounded focus-visible:outline-2 focus-visible:outline-sky-500"
            >
              + Tạo bài học
            </Link>
          </div>
        </div>
      )}
    </PageSection>
  );
}
