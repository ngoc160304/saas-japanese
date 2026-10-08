import Link from 'next/link';
import { Check, Clock3, Star } from 'lucide-react';
import type { JlptExam } from '../types';
import { JlptExamSectionSummary } from './JlptExamSectionSummary';

export function JlptExamCard({ exam, onViewTest }: { exam: JlptExam; onViewTest: () => void }) {
  const isPremium = exam.accessTier === 'premium';

  return (
    <article className={`flex h-full flex-col rounded-[20px] bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${isPremium ? 'border-2 border-amber-400 hover:shadow-amber-200/50' : 'border border-slate-200'}`}>
      <div className="flex-1">
        <div className="mb-3 flex items-start justify-between gap-2">
          <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">{exam.category}</span>
          <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
            {exam.completion === 'completed' && <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-extrabold tracking-wide text-emerald-600 uppercase"><Check aria-hidden="true" className="size-3" />Completed</span>}
            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-extrabold tracking-wide uppercase ${isPremium ? 'border-amber-200 bg-amber-100 text-amber-600' : 'border-slate-300 bg-slate-50 text-slate-500'}`}>
              {isPremium && <Star aria-hidden="true" className="size-3 fill-current" />}{isPremium ? 'Premium' : 'Free'}
            </span>
            {exam.popularity === 'popular' && <span className="rounded-full border border-rose-200 bg-rose-100 px-2 py-0.5 text-[10px] font-extrabold tracking-wide text-rose-600 uppercase">Popular</span>}
          </div>
        </div>
        <h2 className={`mb-3 text-base leading-snug font-extrabold ${isPremium ? 'text-amber-600' : 'text-slate-900'}`}>{exam.title}</h2>
        <div className="mb-4 flex items-center gap-2 text-xs text-slate-500">
          <span className="flex items-center gap-1 font-medium text-slate-700"><Clock3 aria-hidden="true" className="size-3.5" />{exam.durationMinutes} min</span>
          <span aria-hidden="true">•</span>
          <span>{exam.totalQuestions} 問題</span>
        </div>
        <hr className="mb-4 border-slate-100" />
        <JlptExamSectionSummary results={exam.sections} />
      </div>
      {exam.detailId ? (
        <Link href={`/student/jlpt-exams/${exam.detailId}`} aria-label={`View test: ${exam.title}`} className="mt-auto w-full rounded-xl bg-slate-900 py-3 text-center text-xs font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500">
          VIEW TEST
        </Link>
      ) : (
        <button type="button" onClick={onViewTest} aria-label={`View test: ${exam.title}`} className="mt-auto w-full rounded-xl bg-slate-900 py-3 text-center text-xs font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500">
          VIEW TEST
        </button>
      )}
    </article>
  );
}
