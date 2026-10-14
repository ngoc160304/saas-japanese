import Link from 'next/link';
import type { JlptAttemptReview, ReviewFilter } from '../../review/types';

interface ReviewTopBarProps {
  review: JlptAttemptReview;
  filter: ReviewFilter;
  counts: { all: number; incorrect: number; correct: number; unanswered: number };
  onFilterChange: (filter: ReviewFilter) => void;
}

const filters: { value: ReviewFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'incorrect', label: 'Incorrect' },
  { value: 'correct', label: 'Correct' },
  { value: 'unanswered', label: 'Unanswered' },
];

export function ReviewTopBar({ review, filter, counts, onFilterChange }: ReviewTopBarProps) {
  return (
    <header id="review-top-bar" className="sticky top-0 z-40 border-b border-slate-200 bg-white px-4 py-3 shadow-xs lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <Link href={`/student/jlpt-exams/${review.examId}`} className="shrink-0 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500">
            ← Exam Details
          </Link>
          <span aria-hidden="true" className="hidden h-6 w-px bg-slate-200 sm:block" />
          <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-xs text-slate-500">
            <span className="hidden font-semibold text-slate-400 md:inline">JLPT Exams /</span>
            <span className="truncate font-bold text-slate-800">{review.examTitle}</span>
            <span aria-hidden="true" className="text-slate-300">/</span>
            <span className="shrink-0 font-bold text-sky-700">Attempt #{review.attemptId} Review</span>
          </nav>
        </div>
        <div role="group" aria-label="Filter review questions" className="flex flex-wrap gap-1.5">
          {filters.map(({ value, label }) => (
            <button key={value} type="button" aria-pressed={filter === value} onClick={() => onFilterChange(value)} className={`rounded-xl border px-3 py-2 text-xs font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 ${filter === value ? 'border-slate-900 bg-slate-900 text-white' : value === 'incorrect' ? 'border-slate-200 bg-slate-50 text-rose-700 hover:bg-rose-50' : value === 'correct' ? 'border-slate-200 bg-slate-50 text-emerald-700 hover:bg-emerald-50' : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'}`}>
              {label} ({counts[value]})
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
