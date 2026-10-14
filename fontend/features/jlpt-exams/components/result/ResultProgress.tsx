import { progressWidth } from '../../result/result-view';

export function ResultProgress({ label, value, total }: { label: string; value: number; total: number }) {
  const percent = progressWidth(value, total);
  return (
    <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(percent)} className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
      <div className="h-full rounded-full bg-sky-500" style={{ width: `${percent}%` }} />
    </div>
  );
}
