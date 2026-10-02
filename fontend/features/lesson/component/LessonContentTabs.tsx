'use client';

import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { BookOpen, CircleCheck, Video } from 'lucide-react';
import type { GrammarLectureVideo, GrammarPoint } from '../types/grammar';
import { GrammarSection } from './grammar/GrammarSection';
import { KanjiSection } from './kanji/KanjiSection';
import { QuizSection } from './quiz/QuizSection';
import { VocabularySection } from './vocabulary/VocabularySection';

export type LessonContentTab = 'grammar' | 'vocabulary' | 'kanji' | 'quiz';

interface LessonContentTabsProps {
  activeTab: LessonContentTab;
  onTabChange: (tab: LessonContentTab) => void;
  video: GrammarLectureVideo;
  grammarPoints: readonly GrammarPoint[];
  lessonId: number;
}

export function LessonContentTabs({
  activeTab,
  onTabChange,
  video,
  grammarPoints,
  lessonId,
}: LessonContentTabsProps) {
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [vocabularyCount, setVocabularyCount] = useState(0);
  const [kanjiCount, setKanjiCount] = useState(0);
  const [quizCount, setQuizCount] = useState(0);
  const tabs = [
    {
      id: 'grammar' as const,
      label: 'Grammar + Video',
      count: grammarPoints.length,
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
    tabRefs.current
      .find((tab) => tab?.id === `lesson-content-tab-${activeTab}`)
      ?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
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
              <span className="rounded-full bg-slate-100 px-1.5 text-[11px] text-slate-600">
                {tab.count}
              </span>
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
        <GrammarSection video={video} points={grammarPoints} />
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
          onVisibleCountChange={setVocabularyCount}
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
        />
      </div>
    </>
  );
}
