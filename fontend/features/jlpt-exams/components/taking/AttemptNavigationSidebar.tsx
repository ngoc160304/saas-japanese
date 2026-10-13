import type { AttemptViewSession } from '../../taking/attempt-view';

interface AttemptNavigationSidebarProps {
  sessions: AttemptViewSession[];
  selectedSessionId: number;
  currentQuestionId: number | null;
  answers: Record<number, number>;
  flaggedIds: ReadonlySet<number>;
  isOpen: boolean;
  onSelectSession: (sessionId: number) => void;
  onSelectQuestion: (sessionId: number, questionId: number) => void;
  onSubmit: () => void;
  submitting: boolean;
}

export function AttemptNavigationSidebar({ sessions, selectedSessionId, currentQuestionId, answers, flaggedIds, isOpen, onSelectSession, onSelectQuestion, onSubmit, submitting }: AttemptNavigationSidebarProps) {
  return (
    <aside id="exam-navigation" aria-label="Question navigation" className={`${isOpen ? 'flex' : 'hidden'} max-h-[48dvh] w-full shrink-0 flex-col border-b border-slate-200 bg-white shadow-sm md:flex md:max-h-none md:w-80 md:border-r md:border-b-0`}>
      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain p-5">
        {sessions.map((session) => (
          <section key={session.id} aria-label={session.title}>
            <button type="button" onClick={() => onSelectSession(session.id)} aria-current={selectedSessionId === session.id ? 'true' : undefined} className={`flex w-full items-center justify-between gap-2 border-b border-slate-100 pb-2 text-left text-sm font-extrabold focus-visible:outline-2 focus-visible:outline-sky-500 ${selectedSessionId === session.id ? 'text-sky-700' : 'text-slate-600'}`}>
              <span>{session.title}</span>
              {session.timeLimitMinutes !== null && <span className="shrink-0 rounded-md bg-slate-50 px-2 py-1 font-mono text-xs text-slate-500">{session.timeLimitMinutes} min</span>}
            </button>
            <div className="mt-3 space-y-4">
              {session.parts.map((part) => (
                <div key={part.id}>
                  <h3 className="mb-2 text-xs font-bold text-slate-500">{part.name}</h3>
                  <div className="grid grid-cols-6 gap-2">
                    {part.questions.map(({ number, question }) => {
                      const current = currentQuestionId === question.questionId;
                      const answered = answers[question.questionId] !== undefined;
                      const flagged = flaggedIds.has(question.questionId);
                      const state = current ? 'border-sky-600 bg-sky-50 text-sky-700 ring-1 ring-sky-600' : flagged ? 'border-amber-500 bg-amber-100 text-amber-700' : answered ? 'border-slate-200 bg-slate-200 text-slate-600' : 'border-slate-200 bg-white text-slate-700';
                      return <button key={question.questionId} type="button" onClick={() => onSelectQuestion(session.id, question.questionId)} aria-current={current ? 'true' : undefined} aria-label={`Question ${number}, ${answered ? 'answered' : 'unanswered'}${flagged ? ', flagged' : ''}`} className={`relative flex h-7 items-center justify-center rounded-lg border text-xs font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 ${state}`}>{number}{flagged && <span aria-hidden="true" className="absolute -top-1 -right-1 size-2 rounded-full bg-amber-500 ring-1 ring-white" />}</button>;
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
      <div className="border-t border-slate-200 bg-white p-4">
        <button type="button" onClick={onSubmit} disabled={submitting} className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 text-sm font-bold text-slate-800 hover:bg-slate-50 disabled:opacity-50">{submitting ? 'Submitting…' : 'Submit Exam'}</button>
      </div>
    </aside>
  );
}
