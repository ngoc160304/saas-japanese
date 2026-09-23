'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { courseAPI } from '@/apis/courses/courses.api';
import { IsLoading } from '@/components/common/loading/IsLoading';
import { DataTablePagination } from '@/components/common/table/DataTablePagination';
import { useDataTableQuery } from '@/components/common/table/hooks/useDataTableQuery';
import { DataTableFilter } from '@/components/common/table/search-bar/DataTableFilters';
import PageSection from '@/components/layout/management/page-section/PageSection';
import { Button } from '@/components/ui/button';
import { BookOpen } from 'lucide-react';
import { getApiErrorMessage } from '@/lib/api-error';
import { CategoryCourseCoursesToolbar } from './CategoryCourseCoursesToolbar';
import { CategoryCourseLinkedCoursesTable } from './CategoryCourseLinkedCoursesTable';

export function CategoryCourseCoursesTable({ categoryId }: { categoryId: number }) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const status = params.get('status') ?? 'ALL';
  const pricing = params.get('pricing');
  const published = status === 'published' ? true : status === 'draft' ? false : undefined;
  const priceFilter = pricing === 'free' || pricing === 'paid' ? pricing : undefined;
  const query = useDataTableQuery({
    queryKey: ['courses', { categoryId, published, pricing: priceFilter }],
    queryFn: (queryParams) =>
      courseAPI.getCourses({ ...queryParams, categoryId, published, pricing: priceFilter }),
    maxSize: 12,
  });
  const changeFilter = (key: string, value: string) => {
    const next = new URLSearchParams(params.toString());
    if (value === 'ALL') next.delete(key);
    else next.set(key, value);
    next.set('page', '1');
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  };
  const page = !query.isPlaceholderData && !query.isError ? query.data?.data : undefined;

  return (
    <PageSection>
      <CategoryCourseCoursesToolbar
        totalCourses={page && !query.isPlaceholderData ? page.totalElements : undefined}
        searchValue={query.search}
        onSearchChange={query.setSearch}
        onReset={() => router.replace(pathname, { scroll: false })}
      >
        <DataTableFilter
          value={status}
          onChange={(value) => changeFilter('status', value)}
          options={[
            { label: 'Tất cả trạng thái', value: 'ALL' },
            { label: 'Đã xuất bản', value: 'published' },
            { label: 'Bản nháp', value: 'draft' },
          ]}
        />
        <DataTableFilter
          value={priceFilter ?? 'ALL'}
          onChange={(value) => changeFilter('pricing', value)}
          options={[
            { label: 'Tất cả mức giá', value: 'ALL' },
            { label: 'Miễn phí', value: 'free' },
            { label: 'Có phí', value: 'paid' },
          ]}
        />
      </CategoryCourseCoursesToolbar>

      <div aria-busy={query.isFetching}>
        {query.isLoading ? (
          <IsLoading className="min-h-52" size={28} />
        ) : query.isError ? (
          <div role="alert" className="space-y-3 rounded-2xl bg-rose-50 p-6 text-sm text-rose-700">
            <p>{getApiErrorMessage(query.error)}</p>
            <Button variant="outline" disabled={query.isFetching} onClick={() => void query.refetch()}>
              Thử lại
            </Button>
          </div>
        ) : !page ? (
          <IsLoading className="min-h-52" size={28} />
        ) : (
          <>
              {query.isFetching && (
                <p role="status" className="mb-3 text-xs text-slate-500">
                  Đang cập nhật…
                </p>
              )}
              {page.content.length ? (
                <CategoryCourseLinkedCoursesTable courses={page.content} />
              ) : (
                <div role="status" className="py-12 text-center">
                  <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                    <BookOpen className="size-6" aria-hidden="true" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-800">
                    {page.totalElements === 0 && !query.search && !priceFilter && published === undefined
                      ? 'Chưa có khóa học trong danh mục'
                      : 'Không tìm thấy khóa học phù hợp'}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Hãy thử thay đổi từ khóa hoặc đặt lại bộ lọc.
                  </p>
                  {(query.search || priceFilter || published !== undefined) && (
                    <Button
                      variant="outline"
                      className="mt-4 rounded-xl"
                      onClick={() => router.replace(pathname, { scroll: false })}
                    >
                      Đặt lại bộ lọc
                    </Button>
                  )}
                </div>
              )}
              {page.totalPages > 0 && (
                <div className="mt-4 flex flex-col items-center justify-between gap-3 border-t border-slate-100 pt-5 text-xs font-medium text-slate-500 sm:flex-row">
                  <p aria-live="polite">
                    Hiển thị {page.content.length ? page.pageable.offset + 1 : 0}–
                    {page.pageable.offset + page.content.length} / {page.totalElements} khóa học
                  </p>
                  <div className="[&>div]:border-0 [&>div]:pt-0">
                    <DataTablePagination
                      page={page.pageable.pageNumber + 1}
                      totalPages={page.totalPages}
                      onPageChange={(value) => {
                        if (!query.isPlaceholderData) query.setPage(value);
                      }}
                    />
                  </div>
                </div>
              )}
          </>
        )}
      </div>
    </PageSection>
  );
}
