import type { UseQueryResult } from '@tanstack/react-query';
import type { KanjiItem } from '@/apis/lessons/lesson-content.api';
import { Button } from '@/components/ui/button';
import { getApiErrorMessage } from '@/lib/api-error';
import { KanjiCard } from './KanjiCard';

export function KanjiSection({ query }: { query: UseQueryResult<KanjiItem[], Error> }) {
  return (
    <section
      aria-label="Chữ Hán bài học"
      aria-busy={query.isFetching}
      className="rounded-3xl border border-slate-100 bg-white p-5 shadow-soft md:p-6"
    >
      <div className="mb-5 border-b border-slate-100 pb-4">
        <h2 className="text-base font-bold text-slate-900 md:text-lg">
          Kanji Characters{' '}
          <span className="text-xs font-normal text-slate-500">| Chữ Hán bài học</span>
        </h2>
        <p className="mt-1 text-xs font-medium text-slate-500">
          Chữ Hán, âm On/Kun, số nét và các từ ghép minh họa.
        </p>
      </div>
      {query.isPending ? (
        <p role="status" className="py-8 text-center text-sm text-slate-500">
          Đang tải Kanji...
        </p>
      ) : query.isError ? (
        <div role="alert" className="space-y-3 rounded-2xl bg-rose-50 p-4 text-sm text-rose-700">
          <p>{getApiErrorMessage(query.error)}</p>
          <Button
            variant="outline"
            disabled={query.isFetching}
            onClick={() => void query.refetch()}
          >
            Thử lại
          </Button>
        </div>
      ) : query.data.length === 0 ? (
        <p role="status" className="py-8 text-center text-sm text-slate-500">
          Bài học này chưa có Kanji.
        </p>
      ) : (
        <div className="space-y-4">
          <h3 className="text-sm font-extrabold text-slate-900">
            Kanji Cards ({query.data.length})
          </h3>
          <div className="grid grid-cols-1 gap-3.5 md:grid-cols-3">
            {query.data.map((item) => (
              <KanjiCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
