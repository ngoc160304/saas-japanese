import Link from 'next/link';
import { ListTree, Plus, Search, X } from 'lucide-react';
import type { Lesson } from '@/apis/lessons/lessons.type';
import { Button } from '@/components/ui/button';
import { DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import type { LessonContentTab } from './LessonContentTabs';

interface Props {
  courseId: number;
  lessonId: number;
  lessons: Lesson[];
  curriculumLoading: boolean;
  curriculumError: string | null;
  onRetryCurriculum: () => void;
  activeTab: LessonContentTab;
  onSelectTab: (tab: LessonContentTab) => void;
  onNavigate: (href: string, event: { preventDefault(): void }) => void;
  searchParams: string;
  search: string;
  onSearchChange: (value: string) => void;
  expanded: boolean;
  onToggleExpanded: () => void;
  mobile?: boolean;
}

const tabs: { id: LessonContentTab; label: string; symbol: string; color: string }[] = [
  { id: 'grammar', label: 'Grammar + Video', symbol: '文', color: 'bg-sky-100 text-sky-700' },
  { id: 'vocabulary', label: 'Vocabulary', symbol: '語', color: 'bg-emerald-50 text-emerald-700' },
  { id: 'kanji', label: 'Kanji', symbol: '漢', color: 'bg-purple-50 text-purple-700' },
  { id: 'quiz', label: 'Quiz', symbol: '?', color: 'bg-amber-50 text-amber-700' },
];

export function LessonCurriculumSidebar({
  courseId,
  lessonId,
  lessons,
  curriculumLoading,
  curriculumError,
  onRetryCurriculum,
  activeTab,
  onSelectTab,
  onNavigate,
  searchParams,
  search,
  onSearchChange,
  expanded,
  onToggleExpanded,
  mobile = false,
}: Props) {
  const searchId = `curriculum-search-${mobile ? 'mobile' : 'desktop'}`;
  const contentId = `curriculum-content-${mobile ? 'mobile' : 'desktop'}`;
  const normalizedSearch = search.trim().toLocaleLowerCase('vi');
  const visibleLessons = lessons.filter((item) =>
    `${item.id} ${item.title}`.toLocaleLowerCase('vi').includes(normalizedSearch),
  );
  const query = searchParams ? `?${searchParams}` : '';

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
              className="rounded-lg px-2 py-1 text-[11px] font-bold text-slate-500 hover:bg-slate-200/60 focus-visible:outline-2 focus-visible:outline-sky-500"
            >
              {expanded ? 'Collapse All' : 'Expand All'}
            </button>
            {mobile && (
              <DialogClose
                render={<Button variant="ghost" size="icon-xs" aria-label="Close curriculum" />}
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
            className="h-9 rounded-xl border-slate-200 bg-white pr-8 pl-8 text-xs"
          />
          <Search
            className="pointer-events-none absolute top-3 left-2.5 size-3.5 text-slate-600"
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
        <p className="mt-2.5 px-0.5 text-[11px] font-semibold text-slate-500">
          {curriculumLoading
            ? 'Đang tải danh sách bài học...'
            : curriculumError
              ? 'Không thể tải danh sách bài học'
              : `${lessons.length} available lessons`}
        </p>
      </div>
      <div
        id={contentId}
        className="min-h-0 flex-1 space-y-2.5 overflow-y-auto overscroll-contain p-3"
      >
        {curriculumLoading ? (
          <p role="status" className="px-3 py-6 text-center text-xs text-slate-500">
            Đang tải bài học...
          </p>
        ) : curriculumError ? (
          <div role="alert" className="space-y-3 px-3 py-6 text-center text-xs text-slate-600">
            <p>{curriculumError}</p>
            <Button variant="outline" onClick={onRetryCurriculum}>
              Thử lại
            </Button>
          </div>
        ) : visibleLessons.length ? (
          visibleLessons.map((item) => {
            const active = item.id === lessonId;
            return (
              <div
                key={item.id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs"
              >
                <Link
                  href={`/admin/courses/${courseId}/lessons/${item.id}${query}`}
                  scroll={false}
                  onNavigate={(event) => onNavigate(`/admin/courses/${courseId}/lessons/${item.id}${query}`, event)}
                  aria-current={active ? 'page' : undefined}
                  className={`flex items-center gap-2.5 rounded-xl px-3.5 py-3 focus-visible:outline-2 focus-visible:outline-sky-500 ${active ? 'bg-primary text-white' : 'text-slate-800 hover:bg-slate-50'}`}
                >
                  <span
                    className={`flex size-7 shrink-0 items-center justify-center rounded-lg text-[11px] font-black ${active ? 'bg-white/10' : 'bg-slate-100'}`}
                  >
                    {item.id}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-bold" title={item.title}>
                      {item.title}
                    </span>
                    <span
                      className={`mt-0.5 block text-[10px] ${active ? 'text-slate-200' : 'text-slate-500'}`}
                    >
                      {item.durationMinutes === null
                        ? 'Chưa cập nhật thời lượng'
                        : `${item.durationMinutes} phút`}{' '}
                      • {item.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </span>
                </Link>
                {active && expanded && (
                  <nav aria-label="Curriculum content" className="space-y-1.5 px-2.5 py-2.5">
                    {tabs.map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        aria-current={activeTab === tab.id ? 'true' : undefined}
                        aria-controls={`lesson-content-panel-${tab.id}`}
                        onClick={() => onSelectTab(tab.id)}
                        className={`flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-left text-xs focus-visible:outline-2 focus-visible:outline-sky-500 ${activeTab === tab.id ? 'border-sky-200 bg-sky-100 font-bold text-sky-700' : 'border-transparent font-semibold text-slate-600 hover:bg-slate-50'}`}
                      >
                        <span
                          className={`flex size-5 shrink-0 items-center justify-center rounded-md text-[10px] font-black ${tab.color}`}
                          aria-hidden="true"
                        >
                          {tab.symbol}
                        </span>
                        {tab.label}
                      </button>
                    ))}
                  </nav>
                )}
              </div>
            );
          })
        ) : (
          <p role="status" className="px-3 py-6 text-center text-xs text-slate-500">
            {lessons.length ? 'No matching lessons.' : 'Khóa học chưa có bài học.'}
          </p>
        )}
      </div>
      <div className="shrink-0 border-t border-slate-100 bg-slate-50/70 p-3">
        <Link
          href={`/admin/courses/${courseId}/lessons/create`}
          onNavigate={(event) => onNavigate(`/admin/courses/${courseId}/lessons/create`, event)}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-3 py-2.5 text-xs font-bold text-white shadow-2xs hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-sky-500"
        >
          <Plus className="size-3.5" aria-hidden="true" />
          Add New Lesson
        </Link>
      </div>
    </div>
  );
}
