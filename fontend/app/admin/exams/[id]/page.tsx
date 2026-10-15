import { notFound } from 'next/navigation';
import { AdminJlptExamDetailPage } from '@/features/admin-jlpt-exams/components/AdminJlptExamDetailPage';
import { parseAdminJlptExamId } from '@/features/admin-jlpt-exams/admin-jlpt-route';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const examId = parseAdminJlptExamId((await params).id);
  if (examId === null) notFound();
  return <AdminJlptExamDetailPage examId={examId} />;
}
