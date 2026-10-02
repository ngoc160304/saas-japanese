import type { KanjiItem } from '@/apis/lessons/lesson-content.api';

export function KanjiCard({ item }: { item: KanjiItem }) {
  const exampleWords = item.exampleWords?.trim();

  return (
    <article className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs transition-colors hover:border-purple-300">
      <div>
        <div className="mb-3 flex items-start justify-between">
          <div className="flex size-14 items-center justify-center rounded-2xl border border-purple-100 bg-purple-50 text-3xl font-extrabold text-purple-900">
            {item.kanji.trim() || '—'}
          </div>
        </div>
        <h4 className="mb-1 text-xs font-bold text-slate-900">
          {item.meaningVi.trim() || 'Chưa có nghĩa'}
        </h4>
        <p className="mb-2 text-[10px] text-slate-500">
          {item.strokeCount === null ? 'Chưa có số nét' : `${item.strokeCount} strokes`}
        </p>
        <div className="mb-2 space-y-1 rounded-xl border border-slate-100 bg-slate-50 p-2.5 text-[11px]">
          <p>
            <span className="font-bold text-slate-500">On:</span>{' '}
            <span className="font-semibold text-purple-700">{item.onyomi?.trim() || '—'}</span>
          </p>
          <p>
            <span className="font-bold text-slate-500">Kun:</span>{' '}
            <span className="font-semibold text-slate-700">{item.kunyomi?.trim() || '—'}</span>
          </p>
        </div>
      </div>
      <p className="break-words whitespace-pre-wrap text-[10px] text-slate-500">
        <span className="font-bold text-slate-600">Compounds:</span> {exampleWords || '—'}
      </p>
    </article>
  );
}
