import { notFound } from 'next/navigation';
import { JlptExamTaking } from '@/features/jlpt-exams/components/taking/JlptExamTaking';
import { mockTakingExams } from '@/features/jlpt-exams/taking/mock-data';

export const dynamicParams = false;

export function generateStaticParams() {
  return mockTakingExams.map((exam) => ({ id: exam.id }));
}

export default async function JlptExamTakingPage({ params }: PageProps<'/jlpt-exams/[id]/taking'>) {
  const { id } = await params;
  const exam = mockTakingExams.find((item) => item.id === id);
  if (!exam) notFound();

  return <JlptExamTaking exam={exam} />;
}
