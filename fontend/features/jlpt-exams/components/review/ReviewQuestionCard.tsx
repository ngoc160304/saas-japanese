import type { ReviewQuestionEntry } from '../../review/types';

export function ReviewQuestionCard({ entry, total }: { entry: ReviewQuestionEntry; total: number }) {
  const { question, status } = entry;
  const statusLabel = status === 'correct' ? '✓ Correct' : status === 'incorrect' ? '✕ Incorrect' : '— Unanswered';
  const statusClass = status === 'correct' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : status === 'incorrect' ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-amber-200 bg-amber-50 text-amber-800';

  return (
    <section aria-labelledby="review-question-heading" className="space-y-6 rounded-3xl border border-slate-100 bg-white p-5 shadow-[0_2px_14px_-2px_rgba(15,23,42,0.04)] md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          <span className="font-bold tracking-wider text-slate-400 uppercase">Question {String(entry.number).padStart(2, '0')} / {String(total).padStart(2, '0')}</span>
          <span aria-hidden="true" className="text-slate-300">•</span>
          <span className="font-semibold text-slate-600">{entry.sessionTitle} / {entry.partName}</span>
        </div>
        <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold ${statusClass}`}>{statusLabel}</span>
      </div>

      {question.passageText && (
        <section aria-label="Reading passage" className="rounded-2xl border border-sky-100 bg-sky-50/60 p-4 text-sm leading-7 whitespace-pre-line text-slate-700 md:p-5">
          <h3 className="mb-2 text-xs font-bold tracking-wider text-sky-800 uppercase">Passage</h3>
          <p>{question.passageText}</p>
        </section>
      )}

      <h2 id="review-question-heading" className="text-base leading-relaxed font-extrabold text-slate-900 md:text-lg">{question.questionText}</h2>

      <ol aria-label="Answer options" className="space-y-2.5">
        {question.answers.map((answer, index) => {
          const selected = answer.answerId === question.selectedAnswerId;
          const correct = answer.answerId === question.correctAnswerId;
          const optionClass = correct ? 'border-emerald-400 bg-emerald-50 font-bold text-emerald-950 ring-2 ring-emerald-500/20' : selected ? 'border-rose-400 bg-rose-50 font-bold text-rose-900 ring-2 ring-rose-500/20' : 'border-slate-200 bg-slate-50/70 text-slate-700';
          const label = selected && correct ? 'Your answer · Correct' : correct ? 'Correct answer' : selected ? 'Your answer' : null;
          return (
            <li key={answer.answerId} className={`flex flex-col justify-between gap-3 rounded-2xl border p-3.5 sm:flex-row sm:items-center ${optionClass}`}>
              <span className="text-sm font-semibold">{index + 1}. {answer.answerText}</span>
              {label && <span className={`self-end rounded-md px-2.5 py-1 text-[11px] font-bold text-white sm:self-auto ${correct ? 'bg-emerald-600' : 'bg-rose-600'}`}>{label}</span>}
            </li>
          );
        })}
      </ol>

      {status === 'unanswered' && <p className="text-xs font-semibold text-amber-800">You did not select an answer for this question.</p>}

      <section aria-labelledby="review-explanation-heading" className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-5 md:p-6">
        <h3 id="review-explanation-heading" className="text-xs font-bold tracking-wider text-slate-800 uppercase"><span aria-hidden="true">💡 </span>Detailed Explanation &amp; Solution Notes</h3>
        <p className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 text-sm leading-relaxed whitespace-pre-line text-slate-700">{question.explanation}</p>
      </section>
    </section>
  );
}
