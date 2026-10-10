import { Clock3 } from 'lucide-react';
import type { JlptExamSession } from '../../detail-types';
import { ExamStartButton } from './ExamStartButton';

export function ExamSessionCard({ examId, session }: { examId: string; session: JlptExamSession }) {
  const questionCount = session.mondaiSections.reduce((total, section) => total + section.questionCount, 0);

  return (
    <article className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-sm">
      <div className="flex flex-col justify-between gap-4 border-b border-slate-100 bg-slate-50/80 p-5 sm:flex-row sm:items-center">
        <div className="flex min-w-0 items-start gap-3">
          <span aria-label={`Session ${session.number}`} className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-xs font-bold text-white">{session.number}</span>
          <div className="min-w-0">
            <h3 className="text-sm font-extrabold text-slate-900 md:text-base">{session.japaneseTitle}</h3>
            <p className="mt-0.5 flex flex-wrap items-center gap-x-1 text-xs font-medium text-slate-500">
              <span>{session.englishSubtitle}</span>
              <span aria-hidden="true">•</span>
              <Clock3 aria-hidden="true" className="size-3.5" />
              <span>{session.durationMinutes} mins</span>
              <span aria-hidden="true">•</span>
              <span>{questionCount} Questions</span>
            </p>
          </div>
        </div>
        <ExamStartButton action={{ examId, mode: 'session', sessionId: session.id }} />
      </div>
      <div className="bg-white p-5">
        <h4 className="mb-2 text-[11px] font-bold tracking-wider text-slate-400 uppercase">Included Mondai Sections:</h4>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {session.mondaiSections.map((mondai) => (
            <div key={mondai.id} className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50 p-2.5 text-xs">
              <span className="min-w-0 font-semibold text-slate-700">{mondai.label}: {mondai.description}</span>
              <span className="ml-2 shrink-0 font-bold text-slate-400">{mondai.questionCount} Qs</span>
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}
