import { Suspense } from 'react';
import { AdminJlptExamListPage } from '@/features/admin-jlpt-exams/components/AdminJlptExamListPage';
import { AdminJlptLoading } from '@/features/admin-jlpt-exams/components/AdminJlptState';

export default function Page() {
  return (
    <Suspense fallback={<AdminJlptLoading />}>
      <AdminJlptExamListPage />
    </Suspense>
  );
}
