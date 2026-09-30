import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { StorefrontFooter } from '@/components/layout/storefront/StorefrontFooter';
import { StorefrontHeader } from '@/components/layout/storefront/StorefrontHeader';
import { CourseDetailPage } from '@/features/client-course-detail/components/CourseDetailPage';

export const metadata: Metadata = {
  title: 'Chi tiết khóa học - StudyJLPT',
  description: 'Thông tin chi tiết về khóa học luyện thi JLPT.',
};

export default async function Page({ params }: PageProps<'/courses/[id]'>) {
  const { id } = await params;
  const courseId = Number(id);

  if (!/^\d+$/.test(id) || !Number.isSafeInteger(courseId) || courseId < 1) notFound();

  return (
    <div className="flex min-h-screen flex-col bg-bg-light font-storefront text-slate-800">
      <StorefrontHeader activePage="courses" />
      <div className="flex-1">
        <CourseDetailPage courseId={courseId} />
      </div>
      <StorefrontFooter />
    </div>
  );
}
