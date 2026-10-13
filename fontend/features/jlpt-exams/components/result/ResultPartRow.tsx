import type { JlptResultPart } from '../../result/types';
import { formatPercent } from '../../result/result-view';
import { ResultProgress } from './ResultProgress';

export function ResultPartRow({ part }: { part: JlptResultPart }) {
  return (
    <div className="min-w-0">
      <div className="mb-2 flex flex-col justify-between gap-1 text-xs font-semibold text-slate-700 sm:flex-row sm:items-start sm:gap-4">
        <h4 className="min-w-0 break-words font-bold text-slate-900">{part.partName}</h4>
        <span className="shrink-0 text-slate-500">{part.correctCount} / {part.totalQuestions} câu · <strong className="text-sky-700">{formatPercent(part.correctCount, part.totalQuestions)}</strong> <span className="text-slate-400">({part.score} / {part.maxScore} điểm)</span></span>
      </div>
      <ResultProgress label={`${part.partName}: ${part.correctCount} trên ${part.totalQuestions} câu đúng`} value={part.correctCount} total={part.totalQuestions} />
    </div>
  );
}
