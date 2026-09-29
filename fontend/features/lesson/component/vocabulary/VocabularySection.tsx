'use client';

import { useState } from 'react';
import { Download, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { VocabularyItem } from '../../types/vocabulary';
import { VocabularyTable } from './VocabularyTable';
import { VocabularyToolbar } from './VocabularyToolbar';

export function VocabularySection({ items }: { items: readonly VocabularyItem[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const normalizedSearchTerm = searchTerm.trim().toLocaleLowerCase('vi');
  const visibleItems = normalizedSearchTerm
    ? items.filter((item) =>
        [item.word, item.reading, item.meaning, item.exampleSentence].some((value) =>
          value.toLocaleLowerCase('vi').includes(normalizedSearchTerm),
        ),
      )
    : items;

  return (
    <section
      aria-labelledby="vocabulary-heading"
      className="rounded-3xl border border-slate-100 bg-white p-5 shadow-soft md:p-6"
    >
      <div className="mb-5 flex flex-col justify-between gap-4 border-b border-slate-100 pb-4 xl:flex-row xl:items-center">
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
        <VocabularyToolbar searchTerm={searchTerm} onSearchTermChange={setSearchTerm} />
      </div>

      <div className="space-y-4">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">
              Vocabulary List ({visibleItems.length})
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
        <VocabularyTable items={visibleItems} />
      </div>
    </section>
  );
}
