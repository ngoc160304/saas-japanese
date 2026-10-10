import { Flag } from 'lucide-react';
import type { ExamAnswerOption, ExamQuestion } from '../../taking/types';
import { ExamAnswerOption as AnswerOption } from './ExamAnswerOption';

interface ExamQuestionCardProps {
  question: ExamQuestion;
  selectedAnswer?: ExamAnswerOption['id'];
  flagged: boolean;
  disabled: boolean;
  preview?: boolean;
  onSelectAnswer?: (questionId: string, answerId: ExamAnswerOption['id']) => void;
  onToggleFlag?: (questionId: string) => void;
}

export function ExamQuestionCard({ question, selectedAnswer, flagged, disabled, preview = false, onSelectAnswer, onToggleFlag }: ExamQuestionCardProps) {
  return (
    <article id={question.id} aria-label={`Question ${question.number}${preview ? ' preview' : ''}`} className="scroll-mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-4">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-100 font-bold text-slate-700">{question.number}</span>
          <p className="min-w-0 pt-0.5 text-lg font-medium text-slate-800">
            {question.text.map((segment, index) => segment.underlined
              ? <u key={index} className="decoration-2 underline-offset-4">{segment.text}</u>
              : <span key={index}>{segment.text}</span>)}
          </p>
        </div>
        {preview ? (
          <span className="shrink-0 rounded-lg bg-slate-50 px-2 py-1 text-[10px] font-bold text-slate-400 uppercase">Preview</span>
        ) : (
          <button type="button" disabled={disabled} aria-pressed={flagged} aria-label={`${flagged ? 'Remove flag from' : 'Flag'} question ${question.number} for review`} onClick={() => onToggleFlag?.(question.id)} className={`shrink-0 rounded-lg p-1 focus-visible:outline-2 focus-visible:outline-sky-500 disabled:cursor-not-allowed disabled:opacity-50 ${flagged ? 'text-amber-500' : 'text-slate-300 hover:text-amber-500'}`}>
            <Flag aria-hidden="true" className="size-6" fill={flagged ? 'currentColor' : 'none'} />
          </button>
        )}
      </div>
      <div className="space-y-2 pl-0 sm:pl-12">
        {question.options.map((option) => (
          <AnswerOption key={option.id} questionId={question.id} option={option} selected={selectedAnswer === option.id} disabled={disabled} onSelect={() => onSelectAnswer?.(question.id, option.id)} />
        ))}
      </div>
    </article>
  );
}
