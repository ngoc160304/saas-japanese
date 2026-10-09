import type { JlptExamSession } from '@/apis/jlpt-exams/jlpt-exams.type';

interface ExamNavigationSidebarProps {
  sessions: JlptExamSession[];
  selectedSessionId: number | null;
  isOpen: boolean;
  onSelectSession: (sessionId: number) => void;
}

export function ExamNavigationSidebar({ sessions, selectedSessionId, isOpen, onSelectSession }: ExamNavigationSidebarProps) {
  return (
    <aside id="exam-navigation" aria-label="Session navigation" className={`${isOpen ? 'flex' : 'hidden'} max-h-[48dvh] w-full shrink-0 flex-col border-b border-slate-200 bg-white shadow-sm md:flex md:max-h-none md:w-80 md:border-r md:border-b-0`}>
      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        <h2 className="mb-4 text-xs font-extrabold tracking-widest text-slate-500 uppercase">Exam sessions</h2>
        {sessions.length === 0 ? (
          <p className="text-sm text-slate-500">No sessions are available for this exam.</p>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => (
              <button key={session.id} type="button" onClick={() => onSelectSession(session.id)} aria-current={selectedSessionId === session.id ? 'true' : undefined} className={`w-full rounded-xl border px-4 py-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 ${selectedSessionId === session.id ? 'border-sky-300 bg-sky-50 text-sky-800' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}>
                <span className="block text-sm font-bold">{session.name}</span>
                <span className="mt-1 block text-xs">{session.timeLimitMinutes} min · {session.questionCount} questions · {session.parts.length} parts</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
