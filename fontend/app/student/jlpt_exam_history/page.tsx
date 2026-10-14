import { notFound } from 'next/navigation';
import { JlptExamHistoryPage } from '@/features/jlpt-exams/components/history/JlptExamHistoryPage';

export default async function StudentJlptExamHistoryRoute({ searchParams }: PageProps<'/student/jlpt_exam_history'>) {
  const { page } = await searchParams;
  const requested = page ?? '1';
  if (typeof requested !== 'string' || !/^[1-9]\d*$/.test(requested)) notFound();
  const pageNumber = Number(requested);
  if (!Number.isSafeInteger(pageNumber)) notFound();
  return <JlptExamHistoryPage pageNumber={pageNumber} />;
}
