import type { KanjiItem } from '@/apis/lessons/lesson-content.api';

export function KanjiCard({ item }: { item: KanjiItem }) {
  return (
    <article className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs transition-colors hover:border-purple-300">
      <div>
        <div
          lang="ja"
          className="mb-3 flex size-14 items-center justify-center rounded-2xl border border-purple-100 bg-purple-50 text-3xl font-extrabold text-purple-900"
        >
          {item.kanji}
        </div>
        <h4 className="mb-1 text-xs font-bold text-slate-900">{item.meaningVi}</h4>
        <p className="mb-2 text-[11px] text-slate-500">
          {item.strokeCount === null ? 'Chưa cập nhật số nét' : `${item.strokeCount} nét`}
        </p>
        <dl className="space-y-1 rounded-xl border border-slate-100 bg-slate-50 p-2.5 text-xs">
          <div className="flex gap-2">
            <dt className="font-bold text-slate-500">On:</dt>
            <dd lang="ja" className="break-words font-semibold text-purple-700">
              {item.onyomi || '—'}
            </dd>
          </div>
          <div className="flex gap-2">
            <dt className="font-bold text-slate-500">Kun:</dt>
            <dd lang="ja" className="break-words font-semibold text-slate-700">
              {item.kunyomi || '—'}
            </dd>
          </div>
        </dl>
      </div>
      <p className="text-xs break-words whitespace-pre-wrap text-slate-500">
        <span className="font-bold text-slate-600">Từ ví dụ: </span>
        {item.exampleWords || 'Chưa có ví dụ.'}
      </p>
    </article>
  );
}
