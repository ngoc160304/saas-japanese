'use client';

import { useEffect, useState } from 'react';
import { useLessonContentMutation } from '../../hooks/useLessonContentMutation';
import { LessonContentDeleteDialog } from '../LessonContentDeleteDialog';
import { KanjiDialog } from './KanjiDialog';
import { useQuery } from '@tanstack/react-query';
import { kanjiAPI, type KanjiQuery } from '@/apis/lessons/lesson-content.api';
import { Button } from '@/components/ui/button';
import { getApiErrorMessage } from '@/lib/api-error';
import { KanjiList } from './KanjiList';
import { KanjiToolbar } from './KanjiToolbar';

interface KanjiSectionProps {
  lessonId: number;
  active: boolean;
  onCountChange: (count: number | null) => void;
}

export function KanjiSection({ lessonId, active, onCountChange }: KanjiSectionProps) {
  const [kanji, setKanji] = useState('');
  const [meaningVi, setMeaningVi] = useState('');
  const filters: KanjiQuery = { lessonId, kanji, meaningVi };
  const kanjiQuery = useQuery({
    queryKey: ['admin', 'lessons', filters.lessonId, 'kanjis'],
    queryFn: ({ signal }) => kanjiAPI.listByLesson(filters.lessonId, signal),
    enabled: active && Number.isSafeInteger(filters.lessonId) && filters.lessonId > 0,
    retry: false,
  });
  const items = kanjiQuery.isError ? [] : (kanjiQuery.data ?? []);
  const normalizedKanji = filters.kanji.trim().toLocaleLowerCase('vi');
  const normalizedMeaning = filters.meaningVi.trim().toLocaleLowerCase('vi');
  const matchesFilter = (item: (typeof items)[number]) =>
    (!normalizedKanji || item.kanji.toLocaleLowerCase('vi').includes(normalizedKanji)) &&
    (!normalizedMeaning || item.meaningVi.toLocaleLowerCase('vi').includes(normalizedMeaning));
  const visibleItems = items.filter(matchesFilter);
  const editor = useLessonContentMutation(
    lessonId,
    'kanjis',
    kanjiAPI,
    matchesFilter,
    kanjiQuery.isSuccess ? kanjiQuery.data : undefined,
  );
  const count = visibleItems.length;

  useEffect(() => {
    onCountChange(kanjiQuery.isSuccess ? items.length : null);
  }, [items.length, kanjiQuery.isSuccess, onCountChange]);

  function resetFilters() {
    setKanji('');
    setMeaningVi('');
  }

  return (
    <section
      aria-labelledby="kanji-heading"
      className="rounded-3xl border border-slate-100 bg-white p-5 shadow-soft md:p-6"
    >
      <div className="mb-5 flex flex-col justify-between gap-4 border-b border-slate-100 pb-4 2xl:flex-row 2xl:items-end">
        <div>
          <h2
            id="kanji-heading"
            className="flex flex-wrap items-baseline gap-2 text-base font-bold text-slate-900 md:text-lg"
          >
            Kanji Characters
            <span className="text-xs font-normal text-slate-500">| Chữ Hán bài học</span>
          </h2>
          <p className="mt-0.5 text-xs font-medium text-slate-600">
            Chữ Hán, âm On/Kun, số nét, nghĩa tiếng Việt và các từ ghép minh họa.
          </p>
        </div>
        <KanjiToolbar
          onAdd={() => editor.open('create')}
          filters={filters}
          onKanjiChange={setKanji}
          onMeaningChange={setMeaningVi}
          onReset={resetFilters}
        />
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-extrabold text-slate-900">
            Kanji Cards {kanjiQuery.isSuccess ? `(${items.length})` : ''}
          </h3>
          <p className="mt-0.5 text-xs font-medium text-slate-600">
            Chữ Hán, âm On/Kun và các từ vựng phái sinh
          </p>
          {kanjiQuery.isSuccess && (
            <p className="mt-1 text-xs font-medium text-slate-500">
              Hiển thị {count} / {items.length} Kanji
            </p>
          )}
        </div>
        {kanjiQuery.isFetching && !kanjiQuery.data ? (
          <p role="status" className="py-10 text-center text-xs text-slate-500">
            Đang tải Kanji...
          </p>
        ) : kanjiQuery.isError ? (
          <div role="alert" className="space-y-3 py-10 text-center text-xs text-slate-600">
            <p>Không thể tải Kanji. {getApiErrorMessage(kanjiQuery.error)}</p>
            <Button type="button" variant="outline" onClick={() => void kanjiQuery.refetch()}>
              Thử lại
            </Button>
          </div>
        ) : (
          <KanjiList
            items={visibleItems}
            onEdit={(item) => editor.open('edit', item)}
            onDelete={(item) => editor.open('delete', item)}
            emptyMessage={
              items.length === 0 ? 'Bài học chưa có Kanji.' : 'Không tìm thấy Kanji phù hợp.'
            }
          />
        )}
      </div>
      {editor.target?.mode === 'delete' ? (
        <LessonContentDeleteDialog
          label={editor.target.item.kanji}
          pending={editor.pending}
          unavailable={editor.unavailable}
          onClose={editor.close}
          onConfirm={() => editor.submit()}
        />
      ) : (
        editor.target && (
          <KanjiDialog
            key={`${editor.target.revision}-${editor.target.item?.id ?? 'new'}`}
            item={editor.target.item}
            pending={editor.pending}
            unavailable={editor.unavailable}
            onClose={editor.close}
            onSubmit={(values) => editor.submit({ ...values, lessonId })}
          />
        )
      )}
    </section>
  );
}
