import { Suspense } from 'react';
import { JlptExamsPage } from '@/features/jlpt-exams/components/JlptExamsPage';

export default function StudentJlptExamsPage() {
  return (
    <Suspense fallback={<div role="status" className="mx-auto w-full max-w-7xl text-sm text-slate-500">Loading JLPT exams…</div>}>
      <JlptExamsPage />
    </Suspense>
  );
}
