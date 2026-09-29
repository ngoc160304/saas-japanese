import { notFound } from 'next/navigation';
import { LessonGrammarPage } from '@/features/lesson/component/grammar/LessonGrammarPage';

export default async function Page({
  params,
}: {
  params: Promise<{ id: string; lessonId: string }>;
}) {
  const { id, lessonId: lessonIdParam } = await params;
  const courseId = Number(id);
  const lessonId = Number(lessonIdParam);

  if (
    !/^\d+$/.test(id) ||
    !Number.isSafeInteger(courseId) ||
    courseId < 1 ||
    !/^\d+$/.test(lessonIdParam) ||
    !Number.isSafeInteger(lessonId) ||
    lessonId < 1
  )
    notFound();

  return <LessonGrammarPage courseId={courseId} lessonId={lessonId} />;
}
