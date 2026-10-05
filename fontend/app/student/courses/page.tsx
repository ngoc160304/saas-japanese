import { Suspense } from 'react';
import { StudentCoursesPage } from '@/features/student-courses/components/StudentCoursesPage';

export default function Page() {
  return (
    <Suspense
      fallback={
        <p role="status" className="p-6 text-sm text-slate-500">
          Loading my courses…
        </p>
      }
    >
      <StudentCoursesPage />
    </Suspense>
  );
}
