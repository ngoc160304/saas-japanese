import { notFound } from 'next/navigation';
import { AdminJlptQuestionEditorPage } from '@/features/admin-jlpt-exams/components/AdminJlptQuestionEditorPage';
import { parseAdminJlptExamId } from '@/features/admin-jlpt-exams/admin-jlpt-route';

export default async function Page({
  params,
}: {
  params: Promise<{ id: string; sessionId: string; partId: string; questionId: string }>;
}) {
  const route = await params;
  const examId = parseAdminJlptExamId(route.id);
  const sessionId = parseAdminJlptExamId(route.sessionId);
  const partId = parseAdminJlptExamId(route.partId);
  const questionId = parseAdminJlptExamId(route.questionId);
  if (examId === null || sessionId === null || partId === null || questionId === null) notFound();
  return <AdminJlptQuestionEditorPage target={{ examId, sessionId, partId, questionId }} />;
}
