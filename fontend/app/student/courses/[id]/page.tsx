import { notFound } from 'next/navigation';
import { StudentCourseDetail } from '@/features/student-courses/components/StudentCourseDetail';

export default async function Page({ params }: PageProps<'/student/courses/[id]'>) {
  const { id } = await params;
  const courseId = Number(id);
  if (!/^\d+$/.test(id) || !Number.isSafeInteger(courseId) || courseId < 1) notFound();
  return <StudentCourseDetail courseId={courseId} />;
}
