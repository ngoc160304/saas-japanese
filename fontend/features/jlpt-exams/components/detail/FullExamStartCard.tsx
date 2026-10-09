import Link from 'next/link';
import { Clock3 } from 'lucide-react';

export function FullExamStartCard({ examId, isPublished }: { examId: number; isPublished: boolean }) {
  const canStart = isPublished && Number.isSafeInteger(examId) && examId > 0;

  return (
    <section aria-labelledby="full-exam-title" className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 to-indigo-950 p-6 text-white shadow-md md:p-8">
      <div aria-hidden="true" className="pointer-events-none absolute -right-10 -bottom-10 size-48 rounded-full bg-sky-500/10 blur-2xl" />
      <div className="relative z-10 flex flex-col justify-between gap-5 md:flex-row md:items-center">
        <div>
          <span className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-sky-400/20 bg-sky-500/20 px-3 py-1 text-xs font-bold text-sky-300">
            <Clock3 aria-hidden="true" className="size-3.5" /> Full Exam Simulation
          </span>
          <h2 id="full-exam-title" className="text-xl font-extrabold tracking-tight text-white md:text-2xl">Full Examination</h2>
          <p className="mt-1 max-w-xl text-xs leading-relaxed text-slate-300 md:text-sm">
            {isPublished
              ? 'View the full exam structure. Questions and attempts are not available yet.'
              : 'This exam is unpublished and cannot be started.'}
          </p>
        </div>
        {canStart ? (
          <Link href={`/jlpt-exams/${examId}/taking?mode=full`} className="shrink-0 self-start rounded-2xl bg-sky-600 px-6 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-sky-500/30 transition-colors hover:bg-sky-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 sm:self-auto">
            Start Full Exam
          </Link>
        ) : (
          <button type="button" disabled className="shrink-0 self-start rounded-2xl bg-sky-600 px-6 py-3.5 text-sm font-extrabold text-white opacity-50 sm:self-auto">
            Start unavailable
          </button>
        )}
      </div>
    </section>
  );
}
