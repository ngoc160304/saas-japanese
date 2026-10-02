'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { kanjiAPI } from '@/apis/lessons/lesson-content.api';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import type { LessonGrammarPreview } from '../types/grammar';
import type { VocabularyItem } from '../types/vocabulary';
import { LessonContentTabs, type LessonContentTab } from './LessonContentTabs';
import { LessonCurriculumSidebar } from './LessonCurriculumSidebar';
import { LessonHeaderCard } from './LessonHeaderCard';
import { LessonWorkspaceHeader } from './LessonWorkspaceHeader';

export function LessonContentWorkspace({
  courseId,
  lessonId,
  lesson,
  vocabularyItems,
}: {
  courseId: number;
  lessonId: number;
  lesson: LessonGrammarPreview;
  vocabularyItems: readonly VocabularyItem[];
}) {
  const [activeTab, setActiveTab] = useState<LessonContentTab>('grammar');
  const kanjiQuery = useQuery({
    queryKey: ['lessons', 'kanjis', lessonId],
    queryFn: ({ signal }) => kanjiAPI.listByLesson(lessonId, signal),
    enabled: activeTab === 'kanji' && Number.isSafeInteger(lessonId) && lessonId > 0,
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

  const sidebarProps = {
    courseId,
    lessonId,
    lesson,
    activeTab,
    search,
    expanded,
    onSelectTab: (tab: LessonContentTab) => {
      setActiveTab(tab);
      setDrawerOpen(false);
    },
    onSearchChange: setSearch,
    onToggleExpanded: () => setExpanded((value) => !value),
  };

  return (
    <Dialog open={drawerOpen} onOpenChange={setDrawerOpen}>
      <div className="flex h-dvh min-h-0 flex-col overflow-hidden bg-[#f3f6fa] text-slate-800 antialiased">
        <LessonWorkspaceHeader
          courseId={courseId}
          lessonId={lessonId}
          courseTitle={lesson.courseTitle}
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
                lessonId={lessonId}
                kanjiQuery={kanjiQuery}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                video={lesson.video}
                grammarPoints={lesson.points}
                vocabularyItems={vocabularyItems}
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
