'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { categoryCourseAPI } from '@/apis/categories-course/categories-course.api';
import { IsLoading } from '@/components/common/loading/IsLoading';
import { Button } from '@/components/ui/button';
import { getApiErrorMessage } from '@/lib/api-error';
import { CategoryCourseDetailHeader } from './CategoryCourseDetailHeader';
import { CategoryCourseInformation } from './CategoryCourseInformation';
import { CategoryCourseCoursesTable } from './CategoryCourseCoursesTable';

export function CategoryCourseDetailPage({ id }: { id: number }) {
  const router = useRouter();
  const query = useQuery({
    queryKey: ['categories-course', 'detail', id],
    queryFn: () => categoryCourseAPI.getById(id),
    retry: false,
  });
  if (query.isLoading) return <IsLoading className="min-h-64 rounded-3xl bg-white" size={28} />;
  if (query.isError || !query.data)
    return (
      <div role="alert" className="rounded-3xl border border-slate-100 bg-white p-6 shadow-soft">
        <h1 className="text-lg font-bold text-slate-900">Không thể tải danh mục</h1>
        <p className="mt-2 text-sm text-rose-600">{getApiErrorMessage(query.error)}</p>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Button variant="outline" disabled={query.isFetching} onClick={() => void query.refetch()}>
            Thử lại
          </Button>
          <Link className="text-sm font-semibold text-sky-700 hover:underline" href="/admin/categories-course">
            Về danh sách danh mục
          </Link>
        </div>
      </div>
    );
  return (
    <div className="min-w-0 max-w-full">
      <CategoryCourseDetailHeader
        category={query.data}
        onDeleted={() => router.replace('/admin/categories-course')}
      />
      <CategoryCourseInformation category={query.data} />
      <CategoryCourseCoursesTable categoryId={id} />
    </div>
  );
}
