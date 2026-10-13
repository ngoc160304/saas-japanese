import { Flag } from 'lucide-react';
import type { NumberedQuestion } from '../../taking/attempt-view';

interface AttemptQuestionCardProps {
  item: NumberedQuestion;
  selectedAnswerId?: number;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  disabled: boolean;
  retryDisabled: boolean;
  onRetry: (questionId: number) => void;
  flagged: boolean;
  onSelectAnswer: (questionId: number, answerId: number) => void;
  onToggleFlag: (questionId: number) => void;
  onFocusQuestion: (questionId: number) => void;
}

export function AttemptQuestionCard({ item: { number, question }, selectedAnswerId, saveStatus, disabled, retryDisabled, onRetry, flagged, onSelectAnswer, onToggleFlag, onFocusQuestion }: AttemptQuestionCardProps) {
  return (
    <article id={`question-${question.questionId}`} aria-label={`Question ${number}`} onFocus={() => onFocusQuestion(question.questionId)} className="scroll-mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-4">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-100 font-bold text-slate-700">{number}</span>
          <p className="min-w-0 whitespace-pre-line pt-0.5 text-lg font-medium text-slate-800">{question.questionText}</p>
        </div>
        <button type="button" aria-pressed={flagged} aria-label={`${flagged ? 'Remove flag from' : 'Flag'} question ${number} for review`} onClick={() => onToggleFlag(question.questionId)} className={`shrink-0 rounded-lg p-1 focus-visible:outline-2 focus-visible:outline-sky-500 ${flagged ? 'text-amber-500' : 'text-slate-300 hover:text-amber-500'}`}>
          <Flag aria-hidden="true" className="size-6" fill={flagged ? 'currentColor' : 'none'} />
        </button>
      </div>
      <fieldset className="space-y-2 pl-0 sm:pl-12">
        <legend className="sr-only">Choose an answer for question {number}</legend>
        {question.answers.map((answer, index) => (
          <label key={answer.answerId} className={`flex cursor-pointer items-center rounded-xl border px-4 py-3 transition-colors ${selectedAnswerId === answer.answerId ? 'border-sky-500 bg-sky-50' : 'border-slate-200 bg-white hover:border-sky-400 hover:bg-sky-50'}`}>
            <input type="radio" name={`question-${question.questionId}`} value={answer.answerId} checked={selectedAnswerId === answer.answerId} disabled={disabled} onChange={() => onSelectAnswer(question.questionId, answer.answerId)} className="mr-3 size-4 accent-sky-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500" />
            <span className="font-medium text-slate-700">{index + 1}. {answer.answerText}</span>
          </label>
        ))}
        {question.answers.length === 0 && <p className="text-sm text-slate-500">No answer options are available for this question.</p>}
      </fieldset>
      {selectedAnswerId !== undefined && <p role="status" className={`mt-3 text-xs font-semibold sm:pl-12 ${saveStatus === 'error' ? 'text-red-700' : 'text-slate-500'}`}>
        {saveStatus === 'saving' ? 'Saving answer…' : saveStatus === 'saved' ? 'Answer saved' : saveStatus === 'error' ? 'Answer was not saved.' : 'Ready to save'}
        {saveStatus === 'error' && <button type="button" onClick={() => onRetry(question.questionId)} disabled={retryDisabled} className="ml-2 font-bold text-sky-700 underline disabled:opacity-50">Retry</button>}
      </p>}
    </article>
  );
}
