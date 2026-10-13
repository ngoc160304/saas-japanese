'use client';

import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { BookOpen, CircleCheck, Video } from 'lucide-react';
import type { Lesson } from '@/apis/lessons/lessons.type';
import { GrammarSection } from './grammar/GrammarSection';
import type { LessonVideoControls } from './grammar/GrammarLectureCard';
import { KanjiSection } from './kanji/KanjiSection';
import { QuizSection } from './quiz/QuizSection';
import { VocabularySection } from './vocabulary/VocabularySection';

export type LessonContentTab = 'grammar' | 'vocabulary' | 'kanji' | 'quiz';

interface LessonContentTabsProps {
  activeTab: LessonContentTab;
  onTabChange: (tab: LessonContentTab) => void;
  lesson: Lesson;
  lessonId: number;
  grammarDraft: string;
  onGrammarChange: (value: string) => void;
  video: LessonVideoControls;
  videoDisabled: boolean;
  onReloadVideo: () => void;
  onQuizBusyChange: (busy: boolean) => void;
}

export function LessonContentTabs({
  activeTab,
  onTabChange,
  lesson,
  lessonId,
  grammarDraft,
  onGrammarChange,
  video,
  videoDisabled,
  onReloadVideo,
  onQuizBusyChange,
}: LessonContentTabsProps) {
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [vocabularyCount, setVocabularyCount] = useState<number | null>(null);
  const [kanjiCount, setKanjiCount] = useState<number | null>(null);
  const [quizCount, setQuizCount] = useState<number | null>(null);
  const tabs = [
    {
      id: 'grammar' as const,
      label: 'Grammar + Video',
      count: null,
      icon: Video,
    },
    {
      id: 'vocabulary' as const,
      label: 'Vocabulary',
      count: vocabularyCount,
      icon: BookOpen,
    },
    {
      id: 'kanji' as const,
      label: 'Kanji',
      count: kanjiCount,
      icon: null,
    },
    {
      id: 'quiz' as const,
      label: 'Quiz',
      count: quizCount,
      icon: CircleCheck,
    },
  ];

  useEffect(() => {
    const tab = tabRefs.current.find((item) => item?.id === `lesson-content-tab-${activeTab}`);
    const list = tab?.parentElement;
    if (!tab || !list) return;
    const left =
      tab.getBoundingClientRect().left - list.getBoundingClientRect().left + list.scrollLeft;
    if (left < list.scrollLeft) list.scrollLeft = left;
    else if (left + tab.offsetWidth > list.scrollLeft + list.clientWidth)
      list.scrollLeft = left + tab.offsetWidth - list.clientWidth;
  }, [activeTab]);

  function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, currentIndex: number) {
    let nextIndex: number | undefined;

    if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % tabs.length;
    if (event.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = tabs.length - 1;

    if (nextIndex === undefined) return;

    event.preventDefault();
    onTabChange(tabs[nextIndex].id);
    tabRefs.current[nextIndex]?.focus();
  }

  return (
    <>
      <div
        role="tablist"
        aria-label="Lesson content"
        className="flex items-center gap-2 overflow-x-auto pb-2"
      >
        {tabs.map((tab, index) => {
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              ref={(node) => {
                tabRefs.current[index] = node;
              }}
              id={`lesson-content-tab-${tab.id}`}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`lesson-content-panel-${tab.id}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onTabChange(tab.id)}
              onKeyDown={(event) => handleTabKeyDown(event, index)}
              className={`flex shrink-0 items-center gap-2 rounded-2xl border px-4 py-2.5 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 ${
                isActive
                  ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              {tab.icon ? (
                <tab.icon className="size-4" aria-hidden="true" />
              ) : (
                <span
                  aria-hidden="true"
                  className="flex size-4 items-center justify-center rounded bg-emerald-100 text-[11px] font-black text-emerald-800"
                >
                  漢
                </span>
              )}
              {tab.label}
              {tab.count !== null && (
                <span className="rounded-full bg-slate-100 px-1.5 text-[11px] text-slate-600">
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div
        id="lesson-content-panel-grammar"
        role="tabpanel"
        aria-labelledby="lesson-content-tab-grammar"
        hidden={activeTab !== 'grammar'}
      >
        {activeTab === 'grammar' && <GrammarSection lesson={lesson} draft={grammarDraft} onDraftChange={onGrammarChange}
          video={video} videoDisabled={videoDisabled} onReloadVideo={onReloadVideo} />}
      </div>
      <div
        id="lesson-content-panel-vocabulary"
        role="tabpanel"
        aria-labelledby="lesson-content-tab-vocabulary"
        hidden={activeTab !== 'vocabulary'}
      >
        <VocabularySection
          lessonId={lessonId}
          active={activeTab === 'vocabulary'}
          onCountChange={setVocabularyCount}
        />
      </div>
      <div
        id="lesson-content-panel-kanji"
        role="tabpanel"
        aria-labelledby="lesson-content-tab-kanji"
        hidden={activeTab !== 'kanji'}
      >
        <KanjiSection
          lessonId={lessonId}
          active={activeTab === 'kanji'}
          onCountChange={setKanjiCount}
        />
      </div>
      <div
        id="lesson-content-panel-quiz"
        role="tabpanel"
        aria-labelledby="lesson-content-tab-quiz"
        hidden={activeTab !== 'quiz'}
      >
        <QuizSection
          lessonId={lessonId}
          active={activeTab === 'quiz'}
          onCountChange={setQuizCount}
          onBusyChange={onQuizBusyChange}
        />
      </div>
    </>
  );
}
