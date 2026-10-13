import Link from 'next/link';
import { Clock3 } from 'lucide-react';
import type { JlptExamSession } from '@/apis/jlpt-exams/jlpt-exams.type';

export function ExamSessionsSection({ examId, sessions }: { examId: number; sessions: JlptExamSession[] }) {
  return (
    <section aria-labelledby="sessions-title">
      <div className="mb-4 pb-1">
        <h2 id="sessions-title" className="text-base font-bold text-slate-900 md:text-lg">
          Practice Individual Sessions (Luyện tập theo từng Session)
        </h2>
        <p className="mt-0.5 text-xs text-slate-500">Practice one session at a time.</p>
      </div>
      <div className="space-y-4">
        {sessions.length === 0 && <p className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">No sessions are available for this exam.</p>}
        {sessions.map((session) => (
          <article key={session.id} className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-sm">
            <div className="flex flex-col justify-between gap-4 border-b border-slate-100 bg-slate-50/80 p-5 sm:flex-row sm:items-center">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 md:text-base">{session.name}</h3>
                <p className="mt-1 flex flex-wrap items-center gap-1 text-xs font-medium text-slate-500"><Clock3 aria-hidden="true" className="size-3.5" /> {session.timeLimitMinutes} min · {session.questionCount} questions</p>
              </div>
              <Link href={`/jlpt-exams/${examId}/taking?mode=session&sessionId=${session.id}`} className="self-start rounded-2xl bg-sky-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-sky-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 sm:self-auto">Practice This Session</Link>
            </div>
            {session.parts.length > 0 && <div className="grid gap-2 p-5 sm:grid-cols-2">{session.parts.map((part) => <div key={part.id} className="flex justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50 p-2.5 text-xs"><span className="font-semibold text-slate-700">{part.name}</span><span className="shrink-0 font-bold text-slate-400">{part.questionCount} Qs</span></div>)}</div>}
          </article>
        ))}
      </div>
    </section>
  );
}
