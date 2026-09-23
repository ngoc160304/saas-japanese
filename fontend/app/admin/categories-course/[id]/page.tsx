import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { IsLoading } from '@/components/common/loading/IsLoading';
import { CategoryCourseDetailPage } from '@/features/category-course/component/CategoryCourseDetailPage';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const categoryId = Number(id);
  if (!/^\d+$/.test(id) || !Number.isSafeInteger(categoryId) || categoryId < 1) notFound();
  return (
    <Suspense fallback={<IsLoading />}>
      <CategoryCourseDetailPage id={categoryId} />
    </Suspense>
  );
}
