import Link from 'next/link';
import { Clock3 } from 'lucide-react';
import type { JlptExamSummary } from '@/apis/jlpt-exams/jlpt-exams.type';

export function JlptExamCard({ exam }: { exam: JlptExamSummary }) {
  return (
    <article className="flex h-full flex-col rounded-[20px] border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
      <div className="flex-1">
        <div className="mb-3 flex items-start justify-between gap-2">
          <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">JLPT Practice Exam</span>
          <span className="rounded-full border border-sky-100 bg-sky-50 px-2 py-0.5 text-[10px] font-extrabold text-sky-700">{exam.jlptLevel}</span>
        </div>
        <h2 className="mb-3 text-base leading-snug font-extrabold text-slate-900">{exam.title}</h2>
        <div className="mb-4 text-xs text-slate-500">
          <span className="flex items-center gap-1 font-medium text-slate-700"><Clock3 aria-hidden="true" className="size-3.5" />{exam.totalTimeMinutes} min</span>
        </div>
        <hr className="mb-4 border-slate-100" />
        <p className="mb-6 text-xs leading-relaxed text-slate-600">{exam.description}</p>
      </div>
      <Link href={`/student/jlpt-exams/${exam.id}`} aria-label={`View test: ${exam.title}`} className="mt-auto w-full rounded-xl bg-slate-900 py-3 text-center text-xs font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500">
        VIEW TEST
      </Link>
    </article>
  );
}
