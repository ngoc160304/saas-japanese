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
  if (query.isLoading) return <IsLoading />;
  if (query.isError || !query.data)
    return (
      <div role="alert" className="space-y-4 rounded-3xl bg-white p-6 text-sm">
        <p className="text-rose-600">{getApiErrorMessage(query.error)}</p>
        <Button variant="outline" onClick={() => void query.refetch()}>
          Thử lại
        </Button>
        <Link className="ml-4 text-sky-600" href="/admin/categories-course">
          Về danh sách
        </Link>
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
