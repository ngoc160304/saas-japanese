import { notFound } from 'next/navigation';
import { StudentLessonViewer } from '@/features/student-lessons/components/StudentLessonViewer';
import { parseStudyId } from '@/features/student-lessons/utils/lesson-route';

export default async function Page({
  params,
}: PageProps<'/student/courses/[id]/lessons/[lessonId]'>) {
  const route = await params;
  const courseId = parseStudyId(route.id);
  const lessonId = parseStudyId(route.lessonId);
  if (courseId === null || lessonId === null) notFound();
  return (
    <StudentLessonViewer key={`${courseId}-${lessonId}`} courseId={courseId} lessonId={lessonId} />
  );
}
