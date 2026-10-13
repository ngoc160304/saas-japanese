import type { JlptResultSession } from '../../result/types';
import { formatPercent } from '../../result/result-view';
import { ResultPartRow } from './ResultPartRow';
import { ResultProgress } from './ResultProgress';

export function ResultSessionCard({ session, index }: { session: JlptResultSession; index: number }) {
  return (
    <article aria-labelledby={`result-session-${session.attemptSessionId}`} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_2px_14px_-2px_rgba(15,23,42,0.04)]">
      <div className="flex flex-col justify-between gap-3 border-b border-slate-100 bg-slate-50/80 p-5 sm:flex-row sm:items-center">
        <div className="flex min-w-0 items-start gap-2.5">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-xs font-bold text-white">{index + 1}</span>
          <h3 id={`result-session-${session.attemptSessionId}`} className="min-w-0 break-words text-sm font-extrabold text-slate-900 md:text-base">{session.sessionName}</h3>
        </div>
        <div className="sm:text-right">
          <span className="block text-xs font-medium text-slate-500">Điểm phần thi</span>
          <span className="text-sm font-extrabold text-slate-900 md:text-base">{session.score} / {session.maxScore} · {formatPercent(session.score, session.maxScore)}</span>
        </div>
      </div>
      <div className="space-y-4 p-5">
        <ResultProgress label={`${session.sessionName}: ${session.score} trên ${session.maxScore} điểm`} value={session.score} total={session.maxScore} />
        <p className="text-xs text-slate-500">{session.correctCount} / {session.totalQuestions} câu đúng</p>
        {session.parts.length === 0 ? <p className="text-sm text-slate-600">Chưa có Mondai trong phần thi này.</p> : (
          <div className="space-y-5 border-t border-slate-100 pt-4">
            {session.parts.map((part) => <ResultPartRow key={part.attemptPartId} part={part} />)}
          </div>
        )}
      </div>
    </article>
  );
}
