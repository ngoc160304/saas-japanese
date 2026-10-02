import { RotateCcw, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { KanjiQuery } from '@/apis/lessons/lesson-content.api';

interface KanjiToolbarProps {
  filters: Pick<KanjiQuery, 'kanji' | 'meaningVi'>;
  onKanjiChange: (value: string) => void;
  onMeaningChange: (value: string) => void;
  onReset: () => void;
}

export function KanjiToolbar({
  filters,
  onKanjiChange,
  onMeaningChange,
  onReset,
}: KanjiToolbarProps) {
  return (
    <div className="flex w-full flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-end 2xl:w-auto">
      <div className="w-full sm:w-44">
        <label
          htmlFor="kanji-character-filter"
          className="mb-1 block text-xs font-semibold text-slate-600"
        >
          Chữ Hán
        </label>
        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <Input
            id="kanji-character-filter"
            type="search"
            value={filters.kanji}
            onChange={(event) => onKanjiChange(event.target.value)}
            placeholder="Tìm chữ Hán..."
            className="h-9 rounded-2xl border-slate-200 bg-slate-50 pl-8 text-xs font-medium text-slate-800"
          />
        </div>
      </div>
      <div className="w-full sm:w-48">
        <label
          htmlFor="kanji-meaning-filter"
          className="mb-1 block text-xs font-semibold text-slate-600"
        >
          Nghĩa tiếng Việt
        </label>
        <Input
          id="kanji-meaning-filter"
          type="search"
          value={filters.meaningVi}
          onChange={(event) => onMeaningChange(event.target.value)}
          placeholder="Tìm nghĩa..."
          className="h-9 rounded-2xl border-slate-200 bg-slate-50 text-xs font-medium text-slate-800"
        />
      </div>
      <Button
        type="button"
        variant="outline"
        onClick={onReset}
        disabled={!filters.kanji && !filters.meaningVi}
        className="h-9 rounded-2xl border-slate-200 bg-white px-3 text-xs font-bold text-slate-700"
      >
        <RotateCcw className="size-3.5" aria-hidden="true" />
        Xóa bộ lọc
      </Button>
    </div>
  );
}
