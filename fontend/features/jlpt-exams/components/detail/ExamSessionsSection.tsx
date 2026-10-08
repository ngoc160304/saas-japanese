import type { JlptExamSession } from '../../detail-types';
import { ExamSessionCard } from './ExamSessionCard';

export function ExamSessionsSection({ examId, sessions }: { examId: string; sessions: JlptExamSession[] }) {
  return (
    <section aria-labelledby="sessions-title">
      <div className="mb-4 pb-1">
        <h2 id="sessions-title" className="text-base font-bold text-slate-900 md:text-lg">
          Practice Individual Sessions (Luyện tập theo từng Session)
        </h2>
        <p className="mt-0.5 text-xs text-slate-400">Select a complete session below to practice without taking the entire mock exam.</p>
      </div>
      <div className="space-y-4">
        {sessions.map((session) => <ExamSessionCard key={session.id} examId={examId} session={session} />)}
      </div>
    </section>
  );
}
