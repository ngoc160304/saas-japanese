import { notFound } from 'next/navigation';
import { JlptExamResultRoute } from '@/features/jlpt-exams/components/result/JlptExamResultRoute';

export default async function StudentJlptExamResultRoute({ params }: PageProps<'/student/jlpt_exam_result/[id]'>) {
  const { id } = await params;
  if (!/^[1-9]\d*$/.test(id)) notFound();
  const attemptId = Number(id);
  if (!Number.isSafeInteger(attemptId)) notFound();

  return <JlptExamResultRoute attemptId={attemptId} />;
}
