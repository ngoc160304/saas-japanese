import { notFound } from 'next/navigation';
import { JlptExamDetailPage } from '@/features/jlpt-exams/components/detail/JlptExamDetailPage';

export default async function StudentJlptExamDetailPage({ params }: PageProps<'/student/jlpt-exams/[examId]'>) {
  const { examId } = await params;
  if (!/^[1-9]\d*$/.test(examId)) notFound();
  const id = Number(examId);
  if (!Number.isSafeInteger(id)) notFound();

  return <JlptExamDetailPage examId={id} />;
}
