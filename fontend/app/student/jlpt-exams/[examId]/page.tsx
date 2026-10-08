import { notFound } from 'next/navigation';
import { JlptExamDetail } from '@/features/jlpt-exams/components/detail/JlptExamDetail';
import { mockExamDetails } from '@/features/jlpt-exams/mock-detail-data';

export const dynamicParams = false;

export function generateStaticParams() {
  return mockExamDetails.map((exam) => ({ examId: exam.id }));
}

export default async function StudentJlptExamDetailPage({ params }: PageProps<'/student/jlpt-exams/[examId]'>) {
  const { examId } = await params;
  const exam = mockExamDetails.find((item) => item.id === examId);
  if (!exam) notFound();

  return <JlptExamDetail exam={exam} />;
}
