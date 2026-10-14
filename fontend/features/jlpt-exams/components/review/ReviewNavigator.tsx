import type { JlptAttemptReview, ReviewQuestionEntry } from '../../review/types';

interface ReviewNavigatorProps {
  review: JlptAttemptReview;
  questions: ReviewQuestionEntry[];
  activeQuestionId: number;
  counts: { correct: number; incorrect: number; unanswered: number };
  onSelectQuestion: (questionId: number) => void;
}

export function ReviewNavigator({ review, questions, activeQuestionId, counts, onSelectQuestion }: ReviewNavigatorProps) {
  return (
    <aside aria-label="Review navigator" className="lg:sticky lg:top-20 lg:col-span-4">
      <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-[0_2px_14px_-2px_rgba(15,23,42,0.04)]">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <h2 className="text-xs font-bold tracking-wider text-slate-900 uppercase">Review Navigator</h2>
          <span className="text-[11px] font-semibold text-slate-600">{counts.correct} Correct · {counts.incorrect} Incorrect · {counts.unanswered} Unanswered</span>
        </div>
        <div aria-label="Question status legend" className="my-4 flex flex-wrap gap-x-4 gap-y-2 px-1 text-[11px] font-medium text-slate-500">
          <span className="flex items-center gap-1.5"><span aria-hidden="true" className="size-2.5 rounded-full bg-emerald-500" />Correct</span>
          <span className="flex items-center gap-1.5"><span aria-hidden="true" className="size-2.5 rounded-full bg-rose-500" />Incorrect</span>
          <span className="flex items-center gap-1.5"><span aria-hidden="true" className="size-2.5 rounded-full bg-amber-500" />Unanswered</span>
          <span className="flex items-center gap-1.5"><span aria-hidden="true" className="size-2.5 rounded-full bg-white ring-2 ring-sky-500" />Active</span>
        </div>
        <nav aria-label="Questions" className="max-h-[55vh] space-y-4 overflow-y-auto pr-1">
          {review.sessions.map((session) => {
            const sessionQuestions = questions.filter((entry) => entry.sessionId === session.sessionId);
            if (sessionQuestions.length === 0) return null;
            return (
              <section key={session.sessionId} aria-label={session.sessionTitle}>
                <h3 className="mb-2 text-xs font-bold text-slate-700">{session.sessionTitle}</h3>
                <div className="space-y-3">
                  {session.parts.map((part) => {
                    const partQuestions = sessionQuestions.filter((entry) => entry.partId === part.partId);
                    if (partQuestions.length === 0) return null;
                    return (
                      <div key={part.partId}>
                        <p className="mb-2 text-[11px] font-medium text-slate-500">{part.partName}</p>
                        <div className="grid grid-cols-5 gap-2 sm:grid-cols-6 lg:grid-cols-4">
                          {partQuestions.map((entry) => {
                            const active = entry.question.questionId === activeQuestionId;
                            const statusClass = entry.status === 'correct' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : entry.status === 'incorrect' ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-amber-200 bg-amber-50 text-amber-800';
                            return (
                              <button key={entry.question.questionId} type="button" aria-current={active ? 'true' : undefined} aria-label={`Question ${entry.number}, ${entry.status}`} onClick={() => onSelectQuestion(entry.question.questionId)} className={`flex h-9 items-center justify-center gap-0.5 rounded-xl border text-xs font-bold transition-colors hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 ${statusClass} ${active ? 'ring-2 ring-sky-500' : ''}`}>
                                {entry.number}<span aria-hidden="true" className="text-[10px]">{entry.status === 'correct' ? '✓' : entry.status === 'incorrect' ? '✕' : '—'}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
