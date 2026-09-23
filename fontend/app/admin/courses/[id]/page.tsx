import { notFound } from 'next/navigation';
import { CourseDetailPage } from '@/features/course/component/CourseDetailPage';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const courseId = Number(id);

  if (!/^\d+$/.test(id) || !Number.isSafeInteger(courseId) || courseId < 1) notFound();

  return <CourseDetailPage courseId={courseId} />;
}
