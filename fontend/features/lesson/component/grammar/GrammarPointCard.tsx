import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { GrammarPoint } from '../../types/grammar';
import { GrammarPointDialog } from './GrammarPointDialog';

export function GrammarPointCard({ point, index }: { point: GrammarPoint; index: number }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs transition-colors hover:border-sky-300 md:p-5">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3 sm:flex-nowrap sm:gap-4">
        <div className="flex min-w-0 items-start gap-2.5">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-xs font-extrabold text-sky-700">
            {index}
          </span>
          <h4 className="text-sm leading-6 font-bold break-words text-slate-900">{point.title}</h4>
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-1">
          <GrammarPointDialog point={point} />
          <Button
            type="button"
            disabled
            variant="outline"
            size="icon-sm"
            aria-label={`Delete Grammar: ${point.title} (unavailable)`}
            title="Delete Grammar — unavailable in this preview"
            className="rounded-lg border-slate-200 bg-slate-50 text-slate-500 hover:bg-rose-50 hover:text-rose-600"
          >
            <X className="size-3.5" aria-hidden="true" />
          </Button>
        </div>
      </div>
      <p className="mb-2 text-right text-[10px] text-slate-500">Delete unavailable</p>
      <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5 text-xs leading-relaxed font-normal whitespace-pre-line text-slate-600">
        {point.explanation}
      </div>
    </article>
  );
}
