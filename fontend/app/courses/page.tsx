import { Suspense } from 'react';
import type { Metadata } from 'next';
import { StorefrontFooter } from '@/components/layout/storefront/StorefrontFooter';
import { StorefrontHeader } from '@/components/layout/storefront/StorefrontHeader';
import { CoursesCta } from '@/features/client-course/components/CoursesCta';
import { CoursesHero } from '@/features/client-course/components/CoursesHero';
import { CoursesPage, CoursesPageFallback } from '@/features/client-course/components/CoursesPage';

export const metadata: Metadata = {
  title: 'Khóa học JLPT - StudyJLPT',
  description: 'Khám phá các khóa học luyện thi JLPT phù hợp với mục tiêu và trình độ của bạn.',
};

export default function Page() {
  return (
    <div className="flex min-h-screen flex-col bg-white font-storefront text-slate-800">
      <StorefrontHeader activePage="courses" />
      <main className="flex-1 bg-bg-light pb-20">
        <CoursesHero />
        <Suspense fallback={<CoursesPageFallback />}>
          <CoursesPage />
        </Suspense>
        <CoursesCta />
      </main>
      <StorefrontFooter />
    </div>
  );
}
