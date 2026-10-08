import { Clock3 } from 'lucide-react';
import { ExamStartButton } from './ExamStartButton';

export function FullExamStartCard({ examId }: { examId: string }) {
  return (
    <section aria-labelledby="full-exam-title" className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 to-indigo-950 p-6 text-white shadow-md md:p-8">
      <div aria-hidden="true" className="pointer-events-none absolute -right-10 -bottom-10 size-48 rounded-full bg-sky-500/10 blur-2xl" />
      <div className="relative z-10 flex flex-col justify-between gap-5 md:flex-row md:items-center">
        <div>
          <span className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-sky-400/20 bg-sky-500/20 px-3 py-1 text-xs font-bold text-sky-300">
            <Clock3 aria-hidden="true" className="size-3.5" /> Full Exam Simulation
          </span>
          <h2 id="full-exam-title" className="text-xl font-extrabold tracking-tight text-white md:text-2xl">Start Full Examination</h2>
          <p className="mt-1 max-w-xl text-xs leading-relaxed text-slate-300 md:text-sm">
            Take all sessions consecutively with continuous timers and break intervals in true test day conditions.
          </p>
        </div>
        <ExamStartButton action={{ examId, mode: 'full' }} />
      </div>
    </section>
  );
}
