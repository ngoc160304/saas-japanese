import Link from 'next/link';
import type { JlptExamResult } from '../../result/types';

const actionClass = 'inline-flex min-h-12 w-full items-center justify-center rounded-2xl px-5 py-3 text-center text-xs font-bold leading-tight transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 sm:flex-1';

export function ResultActions({ result }: { result: JlptExamResult }) {
  return (
    <section aria-label="Result actions" className="mb-6 grid gap-3 rounded-3xl border border-slate-100 bg-white p-4 shadow-[0_2px_14px_-2px_rgba(15,23,42,0.04)] sm:grid-cols-3">
      <Link href={`/student/jlpt_exam_review/${result.attemptId}`} className={`${actionClass} bg-slate-900 font-extrabold text-white shadow-xs hover:bg-sky-600`}>
        Xem đáp án và giải thích
      </Link>
      <Link href={`/student/jlpt-exams/${result.examId}`} className={`${actionClass} border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100`}>Làm lại đề</Link>
      <Link href="/student/jlpt_exam_history" className={`${actionClass} border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100`}>Lịch sử làm bài</Link>
    </section>
  );
}
