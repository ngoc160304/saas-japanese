'use client';

import { useRef, type KeyboardEvent, type ReactNode } from 'react';
import { BookOpen, CircleCheck, Video } from 'lucide-react';
import type { GrammarLectureVideo, GrammarPoint } from '../types/grammar';
import type { VocabularyItem } from '../types/vocabulary';
import { GrammarSection } from './grammar/GrammarSection';
import { VocabularySection } from './vocabulary/VocabularySection';

export type LessonContentTab = 'grammar' | 'vocabulary' | 'quiz';

interface LessonContentTabsProps {
  activeTab: LessonContentTab;
  onTabChange: (tab: LessonContentTab) => void;
  video: GrammarLectureVideo;
  grammarPoints: readonly GrammarPoint[];
  vocabularyItems: readonly VocabularyItem[];
  quizPanel: ReactNode;
  quizCount?: number;
}

export function LessonContentTabs({
  activeTab,
  onTabChange,
  video,
  grammarPoints,
  vocabularyItems,
  quizPanel,
  quizCount,
}: LessonContentTabsProps) {
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
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
      count: vocabularyItems.length,
      icon: BookOpen,
    },
    {
      id: 'quiz' as const,
      label: 'Quiz',
      count: quizCount,
      icon: CircleCheck,
    },
  ];

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
          const Icon = tab.icon;
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
              <Icon className="size-4" aria-hidden="true" />
              {tab.label}
              {tab.count !== undefined && (
                <span className="rounded-full bg-slate-100 px-1.5 text-[11px] text-slate-600">
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
        {(['Kanji'] as const).map((label) => (
          <button
            key={label}
            type="button"
            role="tab"
            aria-selected={false}
            disabled
            className="flex shrink-0 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-400"
          >
            {label === 'Kanji' ? (
              <span
                aria-hidden="true"
                className="flex size-4 items-center justify-center rounded bg-emerald-100 text-[11px] font-black text-emerald-800"
              >
                漢
              </span>
            ) : (
              <CircleCheck aria-hidden="true" className="size-4" />
            )}
            {label}
            <span className="text-[10px] font-medium">Unavailable</span>
          </button>
        ))}
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
        <VocabularySection items={vocabularyItems} />
      </div>
      <div
        id="lesson-content-panel-quiz"
        role="tabpanel"
        aria-labelledby="lesson-content-tab-quiz"
        hidden={activeTab !== 'quiz'}
      >
        {quizPanel}
      </div>
    </>
  );
}
