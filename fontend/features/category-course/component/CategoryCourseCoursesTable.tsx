'use client';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { courseAPI } from '@/apis/courses/courses.api';
import { IsLoading } from '@/components/common/loading/IsLoading';
import { useDataTableQuery } from '@/components/common/table/hooks/useDataTableQuery';
import { DataTableToolbar } from '@/components/common/table/DataTableToolbar';
import { DataTablePagination } from '@/components/common/table/DataTablePagination';
import { DataTableFilter } from '@/components/common/table/search-bar/DataTableFilters';
import PageSection from '@/components/layout/management/page-section/PageSection';
import { Button } from '@/components/ui/button';
import { CourseTable } from '@/features/course/component/CourseTable';
import { getApiErrorMessage } from '@/lib/api-error';

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
  const page = query.data?.data;
  return (
    <PageSection>
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-base font-bold text-slate-900">Khóa học trong danh mục</h2>
        {page && !query.isPlaceholderData && (
          <span className="text-xs text-slate-400">{page.totalElements} khóa học</span>
        )}
      </div>
      <DataTableToolbar
        searchValue={query.search}
        onSearchChange={query.setSearch}
        searchPlaceholder="Tìm theo tên khóa học…"
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
      </DataTableToolbar>
      <div aria-busy={query.isFetching}>
        {query.isLoading ? (
          <IsLoading />
        ) : query.isError ? (
          <div role="alert" className="space-y-3 text-sm text-rose-600">
            <p>{getApiErrorMessage(query.error)}</p>
            <Button variant="outline" onClick={() => void query.refetch()}>
              Thử lại
            </Button>
          </div>
        ) : (
          page && (
            <>
              {query.isFetching && (
                <p role="status" className="mb-3 text-xs text-slate-500">
                  Đang cập nhật…
                </p>
              )}
              {page.content.length ? (
                <CourseTable courses={page.content} />
              ) : (
                <div className="py-12 text-center text-sm text-slate-500">
                  Không tìm thấy khóa học. Hãy thử đặt lại bộ lọc.
                </div>
              )}
              {page.totalPages > 0 && (
                <DataTablePagination
                  page={page.pageable.pageNumber + 1}
                  totalPages={page.totalPages}
                  onPageChange={(value) => {
                    if (!query.isPlaceholderData) query.setPage(value);
                  }}
                />
              )}
            </>
          )
        )}
      </div>
    </PageSection>
  );
}
