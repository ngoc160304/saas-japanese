import type { JlptExamDetail } from '../../detail-types';

interface ExamOverviewCardProps {
  exam: JlptExamDetail;
  totalQuestions: number;
  totalDuration: number;
}

export function ExamOverviewCard({ exam, totalQuestions, totalDuration }: ExamOverviewCardProps) {
  return (
    <section aria-labelledby="exam-title" className="mb-6 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm md:p-8">
      <div className="border-b border-slate-100 pb-6">
        <div className="mb-2 flex flex-wrap items-center gap-2.5">
          <span className="rounded-lg bg-slate-900 px-2.5 py-0.5 text-xs font-extrabold text-white uppercase">{exam.level}</span>
          <span aria-hidden="true" className="text-slate-300">•</span>
          <span className="font-mono text-xs font-bold text-slate-500">{exam.category}</span>
        </div>
        <h1 id="exam-title" className="text-xl font-black tracking-tight text-slate-900 md:text-2xl">{exam.title}</h1>
        <p className="mt-2 max-w-3xl text-xs leading-relaxed text-slate-600 md:text-sm">{exam.description}</p>
      </div>
      <dl className="grid grid-cols-2 gap-4 pt-6 sm:grid-cols-4">
        <div className="px-1">
          <dt className="mb-0.5 text-[11px] font-bold tracking-wider text-slate-400 uppercase">Total Questions</dt>
          <dd className="text-xl font-extrabold text-slate-900 md:text-2xl">{totalQuestions} 問題</dd>
        </div>
        <div className="px-1">
          <dt className="mb-0.5 text-[11px] font-bold tracking-wider text-slate-400 uppercase">Total Duration</dt>
          <dd className="text-xl font-extrabold text-slate-900 md:text-2xl">{totalDuration} min</dd>
        </div>
        <div className="px-1">
          <dt className="mb-0.5 text-[11px] font-bold tracking-wider text-slate-400 uppercase">Passing Score</dt>
          <dd className="text-xl font-extrabold text-emerald-600 md:text-2xl">{exam.passingScore} / {exam.maximumScore} pts</dd>
        </div>
        <div className="px-1">
          <dt className="mb-0.5 text-[11px] font-bold tracking-wider text-slate-400 uppercase">Exam Structure</dt>
          <dd className="text-xl font-extrabold text-indigo-600 md:text-2xl">{exam.sessions.length} Sessions</dd>
        </div>
      </dl>
    </section>
  );
}
