import { notFound } from 'next/navigation';
import { JlptExamReviewPage } from '@/features/jlpt-exams/components/review/JlptExamReviewPage';

export default async function StudentJlptExamReviewRoute({ params }: PageProps<'/student/jlpt_exam_review/[id]'>) {
  const { id } = await params;
  if (!/^[1-9]\d*$/.test(id)) notFound();
  const attemptId = Number(id);
  if (!Number.isSafeInteger(attemptId)) notFound();

  return <JlptExamReviewPage attemptId={attemptId} />;
}
