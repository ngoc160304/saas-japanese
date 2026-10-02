'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, Plus } from 'lucide-react';
import { vocabularyAPI } from '@/apis/lessons/lesson-content.api';
import { Button } from '@/components/ui/button';
import { getApiErrorMessage } from '@/lib/api-error';
import { VocabularyTable } from './VocabularyTable';
import { VocabularyToolbar } from './VocabularyToolbar';

interface VocabularySectionProps {
  lessonId: number;
  active: boolean;
  onVisibleCountChange: (count: number) => void;
}

export function VocabularySection({
  lessonId,
  active,
  onVisibleCountChange,
}: VocabularySectionProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [partOfSpeech, setPartOfSpeech] = useState('');
  const vocabularyQuery = useQuery({
    queryKey: ['study', 'lessons', lessonId, 'vocabularies'],
    queryFn: () => vocabularyAPI.listStudyByLesson(lessonId),
    enabled: active && Number.isSafeInteger(lessonId) && lessonId > 0,
    retry: false,
  });
  const items = vocabularyQuery.data ?? [];
  const normalizedSearchTerm = searchTerm.trim().toLocaleLowerCase('vi');
  const partOfSpeechOptions = [
    ...new Set(
      items
        .map((item) => item.partOfSpeech?.trim())
        .filter((value): value is string => Boolean(value)),
    ),
  ].sort((a, b) => a.localeCompare(b, 'vi'));
  const visibleItems = items.filter((item) => {
    const matchesSearch =
      !normalizedSearchTerm ||
      [item.word, item.reading, item.meaningVi].some((value) =>
        value.toLocaleLowerCase('vi').includes(normalizedSearchTerm),
      );
    return matchesSearch && (!partOfSpeech || item.partOfSpeech?.trim() === partOfSpeech);
  });
  const visibleCount = vocabularyQuery.isError ? 0 : visibleItems.length;

  useEffect(() => {
    onVisibleCountChange(visibleCount);
  }, [onVisibleCountChange, visibleCount]);

  function resetFilters() {
    setSearchTerm('');
    setPartOfSpeech('');
  }

  return (
    <section
      aria-labelledby="vocabulary-heading"
      className="rounded-3xl border border-slate-100 bg-white p-5 shadow-soft md:p-6"
    >
      <div className="mb-5 flex flex-col justify-between gap-4 border-b border-slate-100 pb-4 2xl:flex-row 2xl:items-center">
        <div>
          <h2
            id="vocabulary-heading"
            className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-base font-bold text-slate-900 md:text-lg"
          >
            Vocabulary List
            <span className="text-xs font-normal text-slate-500">| Từ vựng bài học</span>
          </h2>
          <p className="mt-0.5 text-xs font-medium text-slate-600">
            Danh sách các từ vựng tiếng Nhật, cách đọc Kana, nghĩa tiếng Việt và câu ví dụ tương
            ứng.
          </p>
        </div>
        <VocabularyToolbar
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
          partOfSpeech={partOfSpeech}
          onPartOfSpeechChange={setPartOfSpeech}
          partOfSpeechOptions={partOfSpeechOptions}
          onReset={resetFilters}
          hasFilters={Boolean(searchTerm || partOfSpeech)}
        />
      </div>

      <div className="space-y-4">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">
              Vocabulary List ({visibleCount}
              {visibleCount !== items.length ? ` / ${items.length}` : ''})
            </h3>
            <p className="mt-0.5 text-xs font-medium text-slate-600">
              Bảng từ vựng tương ứng với bài học
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-9 rounded-xl border-slate-200 bg-white px-3.5 text-xs font-bold text-slate-700"
            >
              <Download className="size-3.5" aria-hidden="true" />
              Import CSV
            </Button>
            <Button
              type="button"
              className="h-9 rounded-xl bg-sky-600 px-3.5 text-xs font-bold text-white shadow-2xs hover:bg-sky-700"
            >
              <Plus className="size-3.5" aria-hidden="true" />
              Add Vocabulary
            </Button>
          </div>
        </div>
        {vocabularyQuery.isFetching && !vocabularyQuery.data ? (
          <p role="status" className="py-10 text-center text-xs text-slate-500">
            Đang tải từ vựng...
          </p>
        ) : vocabularyQuery.isError ? (
          <div role="alert" className="space-y-3 py-10 text-center text-xs text-slate-600">
            <p>Không thể tải từ vựng. {getApiErrorMessage(vocabularyQuery.error)}</p>
            <Button type="button" variant="outline" onClick={() => void vocabularyQuery.refetch()}>
              Thử lại
            </Button>
          </div>
        ) : (
          <VocabularyTable
            items={visibleItems}
            emptyMessage={
              items.length === 0 ? 'Bài học chưa có từ vựng.' : 'Không tìm thấy từ vựng phù hợp.'
            }
          />
        )}
      </div>
    </section>
  );
}
