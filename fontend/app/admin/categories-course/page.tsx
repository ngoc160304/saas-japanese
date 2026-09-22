import { Suspense } from 'react';
import { IsLoading } from '@/components/common/loading/IsLoading';
import CategoryCoursePage from '@/features/category-course/component/CategoryCoursePage';

export default function Page() {
  return (
    <Suspense fallback={<IsLoading />}>
      <CategoryCoursePage />
    </Suspense>
  );
}
