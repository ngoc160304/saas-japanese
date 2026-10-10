import { notFound } from 'next/navigation';
import { JlptExamTakingPage as TakingPageContent } from '@/features/jlpt-exams/components/taking/JlptExamTakingPage';

export default async function JlptExamTakingPage({ params }: PageProps<'/jlpt-exams/[id]/taking'>) {
  const { id } = await params;
  if (!/^[1-9]\d*$/.test(id)) notFound();
  const examId = Number(id);
  if (!Number.isSafeInteger(examId)) notFound();

  return <TakingPageContent examId={examId} />;
}
