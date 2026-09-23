import { Suspense } from 'react';
import { IsLoading } from '@/components/common/loading/IsLoading';
import { CoursePage } from '@/features/course/component/CoursePage';

export default function Page() {
  return (
    <Suspense fallback={<IsLoading className="py-16" />}>
      <CoursePage />
    </Suspense>
  );
}
