interface ScoreCardProps {
  title: string;
  score: number;
}

export default function ScoreCard({ title, score }: ScoreCardProps) {
  return (
    <div className="rounded-xl border border-slate-100 bg-[#F8FAFC] p-5 text-center">
      <p className="text-sm font-medium text-slate-500">{title}</p>

      <p className="mt-2 text-4xl font-bold text-[#2F80ED]">{Math.round(score ?? 0)}</p>

      <p className="mt-1 text-xs text-slate-400">/ 100</p>
    </div>
  );
}
