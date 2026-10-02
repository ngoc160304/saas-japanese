import Link from 'next/link';
import { ListTree, Plus, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import type { LessonGrammarPreview } from '../types/grammar';
import type { LessonContentTab } from './LessonContentTabs';

interface LessonCurriculumSidebarProps {
  courseId: number;
  lessonId: number;
  lesson: LessonGrammarPreview;
  activeTab: LessonContentTab;
  onSelectTab: (tab: LessonContentTab) => void;
  search: string;
  onSearchChange: (value: string) => void;
  expanded: boolean;
  onToggleExpanded: () => void;
  mobile?: boolean;
}

export function LessonCurriculumSidebar({
  courseId,
  lessonId,
  lesson,
  activeTab,
  onSelectTab,
  search,
  onSearchChange,
  expanded,
  onToggleExpanded,
  mobile = false,
}: LessonCurriculumSidebarProps) {
  const searchId = `curriculum-search-${mobile ? 'mobile' : 'desktop'}`;
  const contentId = `curriculum-content-${mobile ? 'mobile' : 'desktop'}`;
  const matchesSearch = `Lesson ${lessonId} ${lesson.title}`
    .toLocaleLowerCase('vi')
    .includes(search.trim().toLocaleLowerCase('vi'));

  return (
    <div className="flex h-full min-h-0 flex-col bg-white">
      <div className="shrink-0 border-b border-slate-100 bg-slate-50/50 p-4">
        <div className="mb-2.5 flex items-center justify-between gap-1">
          <h2 className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-slate-900 uppercase">
            <ListTree className="size-4 text-sky-600" aria-hidden="true" />
            Curriculum Tree
          </h2>
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-expanded={expanded}
              aria-controls={contentId}
              onClick={onToggleExpanded}
              className="rounded-lg px-2 py-1 text-[11px] font-bold text-slate-500 hover:bg-slate-200/60 hover:text-slate-800 focus-visible:outline-2 focus-visible:outline-sky-500"
            >
              {expanded ? 'Collapse All' : 'Expand All'}
            </button>
            {mobile && (
              <DialogClose
                render={
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    aria-label="Close curriculum"
                    className="text-slate-500 focus-visible:ring-sky-500"
                  />
                }
              >
                <X className="size-4" aria-hidden="true" />
              </DialogClose>
            )}
          </div>
        </div>
        <div className="relative">
          <label htmlFor={searchId} className="sr-only">
            Search lessons
          </label>
          <Input
            id={searchId}
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search lessons..."
            className="h-9 rounded-xl border-slate-200 bg-white pr-8 pl-8 text-xs text-slate-800 shadow-2xs focus-visible:ring-sky-500 md:text-xs"
          />
          <Search
            className="pointer-events-none absolute top-3 left-2.5 size-3.5 text-slate-400"
            aria-hidden="true"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              aria-label="Clear lesson search"
              className="absolute top-2 right-2 rounded text-slate-500 focus-visible:outline-2 focus-visible:outline-sky-500"
            >
              <X className="size-5" aria-hidden="true" />
            </button>
          )}
        </div>
        <p className="mt-2.5 px-0.5 text-[11px] font-semibold text-slate-500">1 available lesson</p>
      </div>
      <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto overscroll-contain p-3">
        {matchesSearch ? (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs">
            <div
              className="flex items-center gap-2.5 rounded-xl bg-slate-900 px-3.5 py-3 text-white shadow-xs"
              aria-current="page"
            >
              <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-white/10 text-[11px] font-black">
                {lessonId}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold" title={lesson.title}>
                  Lesson {lessonId}: {lesson.title}
                </p>
                <p className="mt-0.5 text-[10px] text-slate-400">
                  {lesson.durationMinutes} mins • Published
                </p>
              </div>
            </div>
            <nav
              id={contentId}
              aria-label="Curriculum content"
              hidden={!expanded}
              className="space-y-1.5 px-2.5 py-2.5"
            >
              {(
                [
                  {
                    id: 'grammar',
                    label: 'Grammar + Video',
                    symbol: '文',
                    color: 'bg-sky-100 text-sky-700',
                  },
                  {
                    id: 'vocabulary',
                    label: 'Vocabulary',
                    symbol: '語',
                    color: 'bg-emerald-50 text-emerald-700',
                  },
                  {
                    id: 'kanji',
                    label: 'Kanji',
                    symbol: '漢',
                    color: 'bg-purple-50 text-purple-700',
                  },
                ] as const
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  aria-current={activeTab === item.id ? 'true' : undefined}
                  aria-controls={`lesson-content-panel-${item.id}`}
                  onClick={() => onSelectTab(item.id)}
                  className={`flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-left text-xs focus-visible:outline-2 focus-visible:outline-sky-500 ${activeTab === item.id ? 'border-sky-200 bg-sky-100 font-bold text-sky-700' : 'border-transparent font-semibold text-slate-600 hover:bg-slate-50'}`}
                >
                  <span
                    className={`flex size-5 shrink-0 items-center justify-center rounded-md text-[10px] font-black ${item.color}`}
                    aria-hidden="true"
                  >
                    {item.symbol}
                  </span>
                  {item.label}
                </button>
              ))}
              {([{ label: 'Quiz', symbol: '?', color: 'bg-amber-50 text-amber-700' }] as const).map(
                (item) => (
                  <button
                    key={item.label}
                    type="button"
                    disabled
                    className="flex w-full items-center gap-2 rounded-xl border border-transparent px-3 py-2 text-left text-xs font-semibold text-slate-400"
                  >
                    <span
                      className={`flex size-5 shrink-0 items-center justify-center rounded-md text-[10px] font-black ${item.color}`}
                      aria-hidden="true"
                    >
                      {item.symbol}
                    </span>
                    {item.label}
                    <span className="ml-auto text-[10px]">Unavailable</span>
                  </button>
                ),
              )}
            </nav>
          </div>
        ) : (
          <p role="status" className="px-3 py-6 text-center text-xs text-slate-500">
            No matching lessons.
          </p>
        )}
      </div>
      <div className="shrink-0 border-t border-slate-100 bg-slate-50/70 p-3">
        <Link
          href={`/admin/courses/${courseId}/lessons/create`}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-3 py-2.5 text-xs font-bold text-white shadow-2xs hover:bg-sky-600 focus-visible:outline-2 focus-visible:outline-sky-500"
        >
          <Plus className="size-3.5" aria-hidden="true" />
          Add New Lesson
        </Link>
      </div>
    </div>
  );
}
