import Link from 'next/link';
import { Clock3 } from 'lucide-react';

export function JlptExamsHeader({ onHistoryClick }: { onHistoryClick: () => void }) {
  return (
    <header className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div>
        <nav aria-label="Breadcrumb" className="mb-1 flex items-center gap-2 text-xs font-semibold text-slate-400">
          <Link href="/student/dashboard" className="hover:text-slate-600 focus-visible:outline-2 focus-visible:outline-sky-500">Student Portal</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page" className="text-slate-800">JLPT Practice Exams</span>
        </nav>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 md:text-3xl">JLPT Practice Exams</h1>
        <p className="mt-0.5 text-xs font-medium text-slate-500 md:text-sm">
          Authentic mock examinations and session-based practice drills formatted to real JLPT standards.
        </p>
      </div>
      <button type="button" onClick={onHistoryClick} className="self-start flex shrink-0 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-sky-500 sm:self-auto">
        <Clock3 aria-hidden="true" className="size-4 text-sky-600" />
        My Attempt History
      </button>
    </header>
  );
}
