import { formatScore } from '../utils/session-events';

export default function ScoreCard({
  title,
  score,
}: {
  title: string;
  score: number | null | undefined;
}) {
  const available = typeof score === 'number' && Number.isFinite(score);
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-5 text-center">
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p className={`mt-2 font-bold text-primary ${available ? 'text-4xl' : 'text-sm'}`}>
        {formatScore(score)}
      </p>
      {available && <p className="mt-1 text-xs text-slate-400">/ 100</p>}
    </div>
  );
}
