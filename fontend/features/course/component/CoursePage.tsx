'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { courseAPI } from '@/apis/courses/courses.api';
import { IsLoading } from '@/components/common/loading/IsLoading';
import { StatCard } from '@/components/common/stats/StatCard';
import { DataTablePagination } from '@/components/common/table/DataTablePagination';
import { DataTableToolbar } from '@/components/common/table/DataTableToolbar';
import { DataTableFilter } from '@/components/common/table/search-bar/DataTableFilters';
import { useDataTableQuery } from '@/components/common/table/hooks/useDataTableQuery';
import Header from '@/components/layout/management/header/Header';
import PageSection from '@/components/layout/management/page-section/PageSection';
import { Button } from '@/components/ui/button';
import { CourseTable } from './CourseTable';

export function CoursePage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const status = searchParams.get('status') ?? 'ALL';
  const publishedFilter = status === 'published' ? true : status === 'draft' ? false : undefined;
  const query = useDataTableQuery({
    queryKey: ['courses', { published: publishedFilter }],
    queryFn: (params) => courseAPI.getCourses({ ...params, published: publishedFilter }),
    defaultPage: 1,
    defaultSize: 10,
    maxSize: 12,
  });
  const page = query.data?.data;
  // Do not present the previous query's records as the current search/page.
  const current = page && !query.isPlaceholderData && !query.isError ? page : undefined;
  const published = current?.content.filter((course) => course.published).length;
  const lessons =
    current && current.content.every((course) => course.lessonCount !== null)
      ? current.content.reduce((total, course) => total + (course.lessonCount ?? 0), 0)
      : undefined;

  return (
    <div className="min-w-0 max-w-full">
      <Header
        title="Courses Management"
        description="Quản lý khóa học tiếng Nhật, danh mục, số bài học và trạng thái xuất bản."
      >
        <Link href="/admin/courses/create" className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-sky-600 focus-visible:outline-2 focus-visible:outline-sky-500 md:text-sm">
          <Plus className="size-4" aria-hidden="true" />
          Tạo khóa học
        </Link>
      </Header>
      <StatCard
        items={[
          {
            label: 'Khóa học phù hợp',
            value: current?.totalElements ?? '—',
            description: 'Theo tìm kiếm hiện tại',
          },
          {
            label: 'Published',
            value: published ?? '—',
            description: 'Chỉ trang hiện tại',
            valueClassName: 'text-emerald-600',
          },
          {
            label: 'Draft',
            value: current && published !== undefined ? current.content.length - published : '—',
            description: 'Chỉ trang hiện tại',
            valueClassName: 'text-amber-600',
          },
          {
            label: 'Số bài học',
            value: lessons ?? '—',
            description: 'Chỉ trang hiện tại',
            valueClassName: 'text-indigo-600',
          },
        ]}
      />
      <PageSection>
        <DataTableToolbar
          searchValue={query.search}
          onSearchChange={query.setSearch}
          searchPlaceholder="Tìm kiếm khóa học..."
          onReset={() => router.replace(pathname, { scroll: false })}
        >
          <DataTableFilter
            value={status}
            onChange={(value) => {
              const next = new URLSearchParams(searchParams.toString());
              if (value === 'ALL') next.delete('status');
              else next.set('status', value);
              next.set('page', '1');
              router.replace(`${pathname}?${next.toString()}`, { scroll: false });
            }}
            options={[
              { label: 'Tất cả trạng thái', value: 'ALL' },
              { label: 'Đã xuất bản', value: 'published' },
              { label: 'Bản nháp', value: 'draft' },
            ]}
          />
          <label className="flex items-center gap-2 text-xs text-slate-600">
            Số dòng
            <select
              aria-label="Số dòng mỗi trang"
              value={query.size}
              onChange={(event) => query.setSize(Number(event.target.value))}
              className="h-10 rounded-2xl border border-slate-200 bg-slate-50 px-3 focus-visible:outline-sky-500"
            >
              {Array.from({ length: 12 }, (_, index) => index + 1).map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
        </DataTableToolbar>
        <div aria-busy={query.isFetching}>
          {query.isError ? (
            <div
              role="alert"
              className="space-y-3 rounded-2xl bg-rose-50 p-6 text-center text-sm text-rose-700"
            >
              <p>Không thể tải danh sách khóa học. Vui lòng thử lại.</p>
              <Button
                variant="outline"
                disabled={query.isFetching}
                onClick={() => void query.refetch()}
              >
                Thử lại
              </Button>
            </div>
          ) : !current ? (
            <IsLoading className="py-16" size={28} />
          ) : current.content.length === 0 ? (
            <div role="status" className="space-y-3 py-12 text-center text-sm text-slate-500">
              <p>
                {current.totalElements > 0
                  ? 'Trang này không có khóa học.'
                  : 'Không có khóa học phù hợp.'}
              </p>
              <Button variant="outline" onClick={() => router.replace(pathname, { scroll: false })}>
                Về trang đầu và đặt lại tìm kiếm
              </Button>
            </div>
          ) : (
            <CourseTable courses={current.content} />
          )}
          {current && (
            <div className="mt-5 space-y-3">
              <p className="text-xs text-slate-500" aria-live="polite">
                Hiển thị {current.content.length ? current.number * current.size + 1 : 0}–
                {current.content.length
                  ? current.number * current.size + current.content.length
                  : 0}{' '}
                / {current.totalElements} khóa học
              </p>
              <DataTablePagination
                page={current.number + 1}
                totalPages={current.totalPages}
                onPageChange={query.setPage}
              />
            </div>
          )}
        </div>
      </PageSection>
    </div>
  );
}
