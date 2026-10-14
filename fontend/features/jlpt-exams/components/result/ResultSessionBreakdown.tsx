import type { JlptResultSession } from '../../result/types';
import { ResultSessionCard } from './ResultSessionCard';

export function ResultSessionBreakdown({ sessions }: { sessions: JlptResultSession[] }) {
  return (
    <section aria-labelledby="session-breakdown-title" className="space-y-4">
      <div className="pb-1">
        <h2 id="session-breakdown-title" className="text-base font-bold text-slate-900 md:text-lg">Chi tiết từng phần thi và Mondai</h2>
        <p className="mt-0.5 text-xs text-slate-500">Điểm phần thi → độ chính xác của từng Mondai</p>
      </div>
      {sessions.length === 0 ? <p className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600">Chưa có phần thi trong lượt làm bài này.</p> : sessions.map((session, index) => (
        <ResultSessionCard key={session.attemptSessionId} session={session} index={index} />
      ))}
    </section>
  );
}
