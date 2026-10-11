'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import type { Course } from '@/apis/courses/courses.type';
import { lessonAPI } from '@/apis/lessons/lessons.api';
import type { Lesson } from '@/apis/lessons/lessons.type';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { getApiErrorMessage } from '@/lib/api-error';
import { LessonContentTabs, type LessonContentTab } from './LessonContentTabs';
import { LessonCurriculumSidebar } from './LessonCurriculumSidebar';
import { LessonHeaderCard } from './LessonHeaderCard';
import { LessonWorkspaceHeader } from './LessonWorkspaceHeader';

export function LessonContentWorkspace({
  courseId,
  lessonId,
  course,
  lesson,
}: {
  courseId: number;
  lessonId: number;
  course: Course;
  lesson: Lesson;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const activeTab: LessonContentTab =
    tabParam === 'vocabulary' || tabParam === 'kanji' || tabParam === 'quiz' ? tabParam : 'grammar';
  const curriculumQuery = useQuery({
    queryKey: ['lessons', 'curriculum', courseId],
    queryFn: () => lessonAPI.getCourseCurriculum(courseId),
    retry: false,
  });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 1024px)');
    function closeOnDesktop(event: MediaQueryListEvent) {
      if (event.matches) setDrawerOpen(false);
    }
    desktop.addEventListener('change', closeOnDesktop);
    return () => desktop.removeEventListener('change', closeOnDesktop);
  }, []);

  function selectTab(tab: LessonContentTab) {
    setDrawerOpen(false);
    if (tab === activeTab && tabParam === tab) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  const sidebarProps = {
    courseId,
    lessonId,
    lessons:
      curriculumQuery.data?.filter((item) => item.courseId === courseId && !item.isDeleted) ?? [],
    curriculumLoading: curriculumQuery.isPending,
    curriculumError: curriculumQuery.isError ? getApiErrorMessage(curriculumQuery.error) : null,
    onRetryCurriculum: () => void curriculumQuery.refetch(),
    activeTab,
    search,
    expanded,
    onSelectTab: selectTab,
    onNavigate: () => setDrawerOpen(false),
    searchParams: searchParams.toString(),
    onSearchChange: setSearch,
    onToggleExpanded: () => setExpanded((value) => !value),
  };

  return (
    <Dialog open={drawerOpen} onOpenChange={setDrawerOpen}>
      <div className="fixed inset-0 flex min-h-0 flex-col overflow-hidden bg-[#f3f6fa] text-slate-800 antialiased">
        <LessonWorkspaceHeader
          courseId={courseId}
          courseTitle={course.title}
          lessonTitle={lesson.title}
        />
        <div className="flex min-h-0 flex-1 overflow-hidden">
          <aside
            aria-label="Lesson curriculum"
            className="hidden w-80 shrink-0 border-r border-slate-200 lg:block"
          >
            <LessonCurriculumSidebar {...sidebarProps} />
          </aside>
          <main
            aria-label="Lesson content workspace"
            className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain p-4 md:p-6 lg:p-7"
          >
            <div className="space-y-5">
              <LessonHeaderCard courseId={courseId} lessonId={lessonId} lesson={lesson} />
              <LessonContentTabs
                activeTab={activeTab}
                onTabChange={selectTab}
                lesson={lesson}
                lessonId={lessonId}
              />
            </div>
          </main>
        </div>
      </div>
      <DialogContent
        showCloseButton={false}
        className="top-0 left-0 flex h-dvh w-80 max-w-[calc(100%-1rem)] translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-none bg-white p-0 text-slate-800 sm:max-w-80"
      >
        <DialogTitle className="sr-only">Lesson curriculum</DialogTitle>
        <LessonCurriculumSidebar {...sidebarProps} mobile />
      </DialogContent>
    </Dialog>
  );
}
