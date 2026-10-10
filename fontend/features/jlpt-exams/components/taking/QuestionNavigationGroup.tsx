import type { ExamAnswerOption, ExamQuestionGroup } from '../../taking/types';

interface QuestionNavigationGroupProps {
  group: ExamQuestionGroup;
  answers: Record<string, ExamAnswerOption['id']>;
  flaggedIds: ReadonlySet<string>;
  currentQuestionId: string;
  onQuestionClick: (questionId: string) => void;
}

export function QuestionNavigationGroup({ group, answers, flaggedIds, currentQuestionId, onQuestionClick }: QuestionNavigationGroupProps) {
  return (
    <div className="mb-4">
      <h2 className="mb-2 text-xs font-bold text-slate-500">{group.label}・{group.englishLabel}</h2>
      <div className="grid grid-cols-6 gap-2">
        {group.questions.map((question) => {
          const isCurrent = question.id === currentQuestionId;
          const isFlagged = flaggedIds.has(question.id);
          const isAnswered = answers[question.id] !== undefined;
          const stateClass = isCurrent
            ? 'border-sky-600 bg-sky-50 text-sky-600 ring-1 ring-sky-600'
            : isFlagged
              ? 'border-amber-500 bg-amber-100 text-amber-600'
              : isAnswered
                ? 'border-slate-200 bg-slate-200 text-slate-500'
                : 'border-slate-200 bg-white text-slate-700';
          return (
            <button key={question.id} type="button" aria-current={isCurrent ? 'true' : undefined} aria-label={`Question ${question.number}${isAnswered ? ', answered' : ', unanswered'}${isFlagged ? ', flagged for review' : ''}`} onClick={() => onQuestionClick(question.id)} className={`relative flex h-7 items-center justify-center rounded-lg border text-xs font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 ${stateClass}`}>
              {question.number}
              {isFlagged && <span aria-hidden="true" className="absolute -top-1 -right-1 size-2 rounded-full bg-amber-500 ring-1 ring-white" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
